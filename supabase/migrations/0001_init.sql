-- FadhiliChain database.
-- The blockchain is the source of truth for money. These tables hold campaign stories,
-- the review queue and a searchable copy of contributions, which the app re-checks against the chain.

create table public.campaigns (
  id                 text primary key,                 -- short public id used in URLs
  chain_id           integer not null,
  address            text,                             -- set once the campaign contract exists
  status             text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  title              text not null check (char_length(title) between 8 and 90),
  summary            text not null check (char_length(summary) between 20 and 200),
  story              text not null check (char_length(story) between 100 and 8000),
  category           text not null,
  location           text not null,
  beneficiary        text not null,
  organiser_name     text not null,
  image_url          text,
  organiser          text not null,                    -- organiser wallet address (lowercase)
  recipient          text not null,                    -- payout wallet address (lowercase)
  token              text not null,
  -- Token amounts are stored as digit strings: JSON numbers lose precision above 2^53 (1 KESm = 10^18 units).
  target             text not null check (target ~ '^[0-9]+$'),  -- smallest token units
  deadline           timestamptz not null,
  metadata_hash      text not null,                    -- keccak256 of the story fields, signed by the organiser
  request            jsonb not null,                   -- the EIP-712 CampaignRequest as signed
  signature          text not null,
  review_note        text,
  created_at         timestamptz not null default now(),
  reviewed_at        timestamptz,
  created_tx         text,
  -- The factory has the same address on every network, so campaign addresses repeat across chains.
  unique (chain_id, address)
);

create index campaigns_status_idx on public.campaigns (status, created_at desc);
create index campaigns_organiser_idx on public.campaigns (organiser);

-- Private details for reviewers only. No policies: the browser can never read this table.
create table public.campaign_private (
  campaign_id        text primary key references public.campaigns (id) on delete cascade,
  organiser_contact  text not null,                    -- phone or email the reviewer uses to verify the organiser
  documents_note     text                              -- what evidence the organiser says they can provide
);

create table public.contributions (
  id             bigint generated always as identity primary key,
  ref            text not null unique,                 -- receipt reference shown to the donor
  chain_id       integer not null,
  campaign       text not null,                        -- campaign contract address (lowercase)
  tx_hash        text not null,
  log_index      integer not null,
  donor          text not null,
  amount         text not null check (amount ~ '^[0-9]+$'),  -- smallest token units, as a digit string
  block_number   bigint not null,
  block_time     timestamptz not null,
  display_name   text,
  message        text check (char_length(message) <= 280),
  created_at     timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

create index contributions_campaign_idx on public.contributions (chain_id, campaign, block_number desc);
create index contributions_donor_idx on public.contributions (donor);

create table public.gas_grants (
  id          bigint generated always as identity primary key,
  chain_id    integer not null,
  address     text not null,
  tx_hash     text not null,
  created_at  timestamptz not null default now()
);

create index gas_grants_lookup_idx on public.gas_grants (address, chain_id, created_at desc);

create table public.sync_state (
  chain_id    integer primary key,
  last_block  bigint not null
);

-- Newer Supabase projects do not grant table privileges to API roles automatically.
-- The server uses service_role; the browser (anon, authenticated) gets read access only, filtered by the policies below.
grant usage on schema public to service_role, anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select on public.campaigns to anon, authenticated;

-- Row level security: the browser may only read public data. All writes go through the server
-- with the service role key after checks (signatures, on-chain receipts, roles).
alter table public.campaigns enable row level security;
alter table public.campaign_private enable row level security;
alter table public.contributions enable row level security;
alter table public.gas_grants enable row level security;
alter table public.sync_state enable row level security;

create policy "approved campaigns are public" on public.campaigns
  for select using (status = 'approved');

-- Contributions have no public policy: donor accounts and messages are only served through the server,
-- which shows amounts without identities.

-- Public bucket for campaign photos (uploads go through the server).
insert into storage.buckets (id, name, public) values ('campaign-images', 'campaign-images', true)
  on conflict (id) do nothing;
