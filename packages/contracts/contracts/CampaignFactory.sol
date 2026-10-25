// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Campaign} from "./Campaign.sol";

/// @title CampaignFactory
/// @notice Creates approved campaigns as minimal clones of one Campaign implementation and keeps the list of accepted tokens.
/// @dev Roles:
///  - DEFAULT_ADMIN_ROLE: manages roles and the token list; transfer is two-step with a delay (AccessControlDefaultAdminRules).
///  - APPROVER_ROLE: creates campaigns after off-chain review.
///  - CANCELLER_ROLE: may cancel any campaign before withdrawal (read by Campaign.cancel).
///
/// The organiser signs the campaign terms (EIP-712). An approver can only submit terms exactly as the organiser signed them,
/// so approval cannot redirect the recipient, change the target or move the deadline.
/// No role can move campaign funds. Removing a token from the list does not affect campaigns already created with it.
contract CampaignFactory is AccessControlDefaultAdminRules, EIP712 {
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    bytes32 public constant CAMPAIGN_REQUEST_TYPEHASH = keccak256(
        "CampaignRequest(address token,address organiser,address recipient,uint256 target,uint64 deadline,bytes32 metadataHash,uint256 nonce,uint64 expiry)"
    );

    /// @notice Shortest and longest campaign duration accepted at creation.
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 365 days;

    /// @notice Highest platform fee the admin can set: 5%.
    uint16 public constant MAX_FEE_BPS = 500;

    struct CampaignRequest {
        address token;
        address organiser;
        address recipient;
        uint256 target;
        uint64 deadline;
        bytes32 metadataHash;
        uint256 nonce;
        uint64 expiry; // last timestamp at which the signed request may be used
    }

    address public immutable implementation;

    /// @notice Fee in basis points applied to campaigns created from now on. Existing campaigns keep their own rate.
    uint16 public feeBps;
    /// @notice Receives the platform fee when a successful campaign is withdrawn.
    address public treasury;

    mapping(address token => bool) public isTokenAllowed;
    mapping(address campaign => bool) public isCampaign;
    mapping(address organiser => uint256) public nonces;
    address[] private _campaigns;

    event TokenAllowed(address indexed token, bool allowed);
    event FeeUpdated(uint16 feeBps, address treasury);
    event CampaignCreated(
        address indexed campaign,
        address indexed organiser,
        address indexed recipient,
        address token,
        uint256 target,
        uint64 deadline,
        bytes32 metadataHash
    );

    error TokenNotAllowed(address token);
    error InvalidDuration();
    error ZeroAddress();
    error RequestExpired();
    error InvalidNonce(uint256 expected, uint256 provided);
    error InvalidOrganiserSignature();
    error FeeTooHigh();

    constructor(address admin, uint48 adminTransferDelay)
        AccessControlDefaultAdminRules(adminTransferDelay, admin)
        EIP712("FadhiliChain CampaignFactory", "1")
    {
        implementation = address(new Campaign());
    }

    function setTokenAllowed(address token, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        isTokenAllowed[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    /// @notice Set the platform fee for future campaigns and the address that receives fees.
    /// @dev Changing the rate never affects campaigns that already exist. Changing the treasury redirects fees
    ///      of existing campaigns that have not been withdrawn yet, but can never take more than their fixed rate.
    function setFee(uint16 feeBps_, address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        if (feeBps_ != 0 && treasury_ == address(0)) revert ZeroAddress();
        feeBps = feeBps_;
        treasury = treasury_;
        emit FeeUpdated(feeBps_, treasury_);
    }

    /// @notice EIP-712 digest the organiser signs for `req`.
    function hashRequest(CampaignRequest calldata req) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    CAMPAIGN_REQUEST_TYPEHASH,
                    req.token,
                    req.organiser,
                    req.recipient,
                    req.target,
                    req.deadline,
                    req.metadataHash,
                    req.nonce,
                    req.expiry
                )
            )
        );
    }

    /// @notice Create a reviewed campaign from terms signed by its organiser.
    /// @dev `req.target` is in the token's smallest unit (18 decimals for KESm, 6 for USDC).
    ///      `req.metadataHash` is the hash of the off-chain description, so the text shown later can be checked against it.
    ///      The signature may come from an EOA or, via ERC-1271, from a smart account.
    function createCampaign(CampaignRequest calldata req, bytes calldata organiserSignature)
        external
        onlyRole(APPROVER_ROLE)
        returns (address campaign)
    {
        if (block.timestamp > req.expiry) revert RequestExpired();
        if (!isTokenAllowed[req.token]) revert TokenNotAllowed(req.token);
        if (req.deadline < block.timestamp + MIN_DURATION || req.deadline > block.timestamp + MAX_DURATION) {
            revert InvalidDuration();
        }
        uint256 expectedNonce = nonces[req.organiser];
        if (req.nonce != expectedNonce) revert InvalidNonce(expectedNonce, req.nonce);
        if (!SignatureChecker.isValidSignatureNow(req.organiser, hashRequest(req), organiserSignature)) {
            revert InvalidOrganiserSignature();
        }
        nonces[req.organiser] = expectedNonce + 1;

        campaign = Clones.clone(implementation);
        Campaign(campaign).initialize(
            IERC20(req.token), req.organiser, req.recipient, req.target, req.deadline, req.metadataHash, feeBps
        );

        isCampaign[campaign] = true;
        _campaigns.push(campaign);

        emit CampaignCreated(
            campaign, req.organiser, req.recipient, req.token, req.target, req.deadline, req.metadataHash
        );
    }

    function campaignCount() external view returns (uint256) {
        return _campaigns.length;
    }

    /// @notice Paginated list of campaigns, oldest first.
    function campaigns(uint256 offset, uint256 limit) external view returns (address[] memory page) {
        uint256 total = _campaigns.length;
        if (offset >= total) return new address[](0);
        uint256 remaining = total - offset;
        uint256 count = limit < remaining ? limit : remaining;
        page = new address[](count);
        for (uint256 i; i < count; ++i) {
            page[i] = _campaigns[offset + i];
        }
    }
}
