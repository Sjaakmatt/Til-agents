-- Sprint 1 — Insiders Lab Platform schema
-- All platform state lives in its own schema, separate from trade-data.
create schema if not exists insiders_lab_platform;

set search_path to insiders_lab_platform, public;

-- Enum types -----------------------------------------------------------------

do $$ begin
  create type agent_id as enum (
    'signal','analyst','historian','profiler','editor','community','growth_analyst','video'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_run_status as enum ('running','completed','failed','skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type triggered_by as enum ('cron','event','manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type channel as enum (
    'email','x_post','x_thread','instagram_post','youtube_short','tiktok','instagram_reel','reddit_suggestion'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending','approved','rejected','published','edited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority as enum ('low','normal','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trigger_type as enum (
    'cluster','big_dollar','timing_anomaly','committee_match','comeback_trade'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type suggested_angle as enum (
    'cross_filing','track_record','sector_rotation','timing','missed_opportunity'
  );
exception when duplicate_object then null; end $$;

-- Tables ---------------------------------------------------------------------

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id agent_id not null,
  triggered_by triggered_by not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status agent_run_status not null default 'running',
  output_summary text,
  cost_usd numeric(10,6) not null default 0,
  tool_calls jsonb not null default '[]'::jsonb,
  error_message text
);
create index if not exists agent_runs_agent_started_idx
  on agent_runs (agent_id, started_at desc);

-- Signal events produced by the Signal Agent. These are not publishable; they
-- are triggers that downstream agents (Analyst, Historian) subscribe to.
create table if not exists signal_events (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references agent_runs(id) on delete set null,
  trigger_type trigger_type not null,
  viral_score numeric(4,3) not null check (viral_score between 0 and 1),
  related_trades text[] not null default '{}',
  related_insiders text[] not null default '{}',
  related_tickers text[] not null default '{}',
  analysis_brief text not null,
  suggested_angle suggested_angle not null,
  has_been_covered_recently boolean not null default false,
  consumed_by_agent agent_id,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists signal_events_score_idx
  on signal_events (viral_score desc, created_at desc)
  where consumed_at is null;

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  agent_id agent_id not null,
  source_trigger_id uuid references signal_events(id) on delete set null,
  text text not null,
  channels channel[] not null,
  confidence_score numeric(4,3) not null check (confidence_score between 0 and 1),
  angle_tags text[] not null default '{}',
  numeric_claims jsonb not null default '[]'::jsonb,
  source_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists drafts_agent_created_idx on drafts (agent_id, created_at desc);

create table if not exists approval_queue (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references drafts(id) on delete cascade,
  kanaal channel not null,
  status approval_status not null default 'pending',
  priority priority not null default 'normal',
  bundle_id uuid,
  approved_by text,
  approved_at timestamptz,
  edited_text text,
  created_at timestamptz not null default now()
);
create index if not exists approval_queue_status_created_idx
  on approval_queue (status, created_at desc);
create index if not exists approval_queue_bundle_idx
  on approval_queue (bundle_id) where bundle_id is not null;

create table if not exists published_content (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references drafts(id) on delete restrict,
  approval_item_id uuid references approval_queue(id) on delete set null,
  kanaal channel not null,
  published_at timestamptz not null default now(),
  external_url text,
  external_id text,
  autonomous boolean not null default false
);
create index if not exists published_content_channel_published_idx
  on published_content (kanaal, published_at desc);

-- Single-row table holding the global kill-switch state. All Publisher
-- adapters must check this before every outbound call.
create table if not exists kill_switch_state (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  reason text,
  updated_at timestamptz not null default now(),
  updated_by text
);
insert into kill_switch_state (id, enabled, reason)
values (1, false, 'initial state')
on conflict (id) do nothing;
