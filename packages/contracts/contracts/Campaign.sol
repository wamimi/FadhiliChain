// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// @title Campaign
/// @notice Holds the contributions for one fundraiser and enforces its release and refund rules.
/// @dev Deployed as an EIP-1167 clone by CampaignFactory and initialised in the same transaction.
///
/// Rules, in one place:
///  - Contributions are accepted only while `block.timestamp < deadline` and the campaign is not cancelled.
///  - After the deadline, if `totalRaised >= target`, the recipient may withdraw once.
///  - After the deadline with `totalRaised < target`, or once cancelled, each donor may reclaim their own contribution once.
///  - Withdrawal and refunds are mutually exclusive: `withdrawn` blocks cancellation, and cancellation or failure blocks withdrawal.
///  - Nobody, including platform administrators, can send campaign funds anywhere other than the recipient (on success)
///    or the donor who paid them (on failure or cancellation).
///
/// Tokens sent to this contract without calling `contribute` are not recorded and cannot be refunded.
/// On a successful campaign they are paid to the recipient together with the recorded contributions.
contract Campaign is Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Open, // accepting contributions
        Successful, // deadline passed, target met, not yet withdrawn
        Failed, // deadline passed, target not met: refunds open
        Cancelled, // cancelled before withdrawal: refunds open
        Withdrawn // funds paid to the recipient
    }

    /// @notice Role on the factory that may cancel any campaign before withdrawal (fraud response).
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    address public factory;
    IERC20 public token;
    address public organiser;
    address public recipient;
    uint256 public target;
    uint64 public deadline;
    bytes32 public metadataHash;

    uint256 public totalRaised;
    uint256 public totalRefunded;
    bool public cancelled;
    bool public withdrawn;

    mapping(address donor => uint256 amount) public contributionOf;

    event Contributed(address indexed donor, uint256 amount, uint256 totalRaised);
    event Withdrawn(address indexed recipient, address indexed to, uint256 amount);
    event Refunded(address indexed donor, uint256 amount);
    event Cancelled(address indexed by);

    error ZeroAddress();
    error ZeroAmount();
    error InvalidTarget();
    error InvalidDeadline();
    error NotOpen();
    error NotSuccessful();
    error RefundsNotOpen();
    error NothingToRefund();
    error AlreadyFinalised();
    error NotAuthorised();
    error TransferAmountMismatch(uint256 expected, uint256 received);

    constructor() {
        _disableInitializers();
    }

    /// @notice Called once by the factory immediately after cloning.
    function initialize(
        IERC20 token_,
        address organiser_,
        address recipient_,
        uint256 target_,
        uint64 deadline_,
        bytes32 metadataHash_
    ) external initializer {
        if (address(token_) == address(0) || organiser_ == address(0) || recipient_ == address(0)) revert ZeroAddress();
        if (target_ == 0) revert InvalidTarget();
        if (deadline_ <= block.timestamp) revert InvalidDeadline();

        factory = msg.sender;
        token = token_;
        organiser = organiser_;
        recipient = recipient_;
        target = target_;
        deadline = deadline_;
        metadataHash = metadataHash_;
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function status() public view returns (Status) {
        if (withdrawn) return Status.Withdrawn;
        if (cancelled) return Status.Cancelled;
        if (block.timestamp < deadline) return Status.Open;
        return totalRaised >= target ? Status.Successful : Status.Failed;
    }

    /// @notice Amount a donor could reclaim right now (zero unless refunds are open).
    function refundableOf(address donor) external view returns (uint256) {
        Status s = status();
        if (s != Status.Failed && s != Status.Cancelled) return 0;
        return contributionOf[donor];
    }

    // ------------------------------------------------------------------
    // Donor actions
    // ------------------------------------------------------------------

    /// @notice Contribute `amount` of the campaign token. Requires a prior ERC-20 approval.
    /// @dev Rejects tokens that deliver less than `amount` (fee-on-transfer), so the recorded total always matches what arrived.
    function contribute(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (status() != Status.Open) revert NotOpen();

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - balanceBefore;
        if (received != amount) revert TransferAmountMismatch(amount, received);

        contributionOf[msg.sender] += amount;
        totalRaised += amount;

        emit Contributed(msg.sender, amount, totalRaised);
    }

    /// @notice Reclaim the caller's full contribution after the campaign failed or was cancelled.
    function claimRefund() external nonReentrant {
        Status s = status();
        if (s != Status.Failed && s != Status.Cancelled) revert RefundsNotOpen();

        uint256 amount = contributionOf[msg.sender];
        if (amount == 0) revert NothingToRefund();

        contributionOf[msg.sender] = 0;
        totalRefunded += amount;

        token.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    // ------------------------------------------------------------------
    // Recipient actions
    // ------------------------------------------------------------------

    /// @notice Pay the campaign balance to the recipient after a successful campaign.
    function withdraw() external {
        _withdraw(recipient);
    }

    /// @notice Same as `withdraw`, paying to another address chosen by the recipient
    ///         (for example if the recipient address has been blocked by the token issuer).
    function withdrawTo(address to) external {
        if (to == address(0)) revert ZeroAddress();
        _withdraw(to);
    }

    function _withdraw(address to) private nonReentrant {
        if (msg.sender != recipient) revert NotAuthorised();
        if (status() != Status.Successful) revert NotSuccessful();

        withdrawn = true;
        uint256 amount = token.balanceOf(address(this));

        token.safeTransfer(to, amount);
        emit Withdrawn(recipient, to, amount);
    }

    // ------------------------------------------------------------------
    // Cancellation
    // ------------------------------------------------------------------

    /// @notice Cancel the campaign and open refunds.
    /// @dev The organiser may cancel only while the campaign is open. A factory account holding CANCELLER_ROLE may cancel
    ///      at any time before withdrawal, so a campaign found to be fraudulent after its deadline can still be refunded.
    ///      Cancelling never moves funds; it only lets donors reclaim their own contributions.
    function cancel() external {
        if (withdrawn || cancelled) revert AlreadyFinalised();

        bool isCanceller = IAccessControl(factory).hasRole(CANCELLER_ROLE, msg.sender);
        if (!isCanceller) {
            if (msg.sender != organiser) revert NotAuthorised();
            if (block.timestamp >= deadline) revert NotOpen();
        }

        cancelled = true;
        emit Cancelled(msg.sender);
    }
}
