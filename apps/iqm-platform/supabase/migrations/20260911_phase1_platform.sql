-- IQ Mindware shared Phase-1 platform schema.
-- Authentication is Supabase Auth; node modules never own auth/session state.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (node_id in (
    'attention','relational-memory','binding-memory','predictive-mapping','generative-search','reasoning'
  )),
  status text not null check (status in ('active','inactive','refunded','admin-granted')),
  source text not null default 'unknown',
  product_key text not null,
  activated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, node_id, product_key)
);

create table if not exists public.node_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (node_id in (
    'attention','relational-memory','binding-memory','predictive-mapping','generative-search','reasoning'
  )),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  wrapper_phase text not null default 'A_BASELINE' check (wrapper_phase in (
    'A_BASELINE','A_TRAIN','B_INTRO','B_RECOVERY','A_RETURN','A_REOPEN','AB_MIXED','AB_MAINTENANCE'
  )),
  sessions_in_phase integer not null default 0 check (sessions_in_phase >= 0),
  a_plateau_reference double precision,
  b_current_reference double precision,
  a_return_reference double precision,
  strategy_status text not null default 'not_started' check (strategy_status in ('not_started','learned','practising')),
  mission_status text not null default 'none' check (mission_status in ('none','planned','checked-in')),
  last_session_at timestamptz,
  next_action text,
  raw_progress_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (node_id in (
    'attention','relational-memory','binding-memory','predictive-mapping','generative-search','reasoning'
  )),
  game_version text not null,
  protocol_version text not null,
  wrapper_phase text not null,
  wrapper_mode text not null check (wrapper_mode in ('A','B','AB_MIXED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  progression_score double precision check (progression_score between 0 and 1),
  valid_trials integer check (valid_trials >= 0),
  display_metrics_json jsonb not null default '[]'::jsonb,
  raw_summary_json jsonb not null default '{}'::jsonb
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (node_id in (
    'attention','relational-memory','binding-memory','predictive-mapping','generative-search','reasoning'
  )),
  context text not null,
  target_cue text not null,
  intended_policy text not null,
  niche_change_type text,
  niche_change_note text,
  status text not null default 'planned' check (status in ('planned','done','expired','reschedule')),
  created_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.mission_checkins (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null check (node_id in (
    'attention','relational-memory','binding-memory','predictive-mapping','generative-search','reasoning'
  )),
  opportunity_occurred boolean not null,
  strategy_use text check (strategy_use in ('yes','partly','no')),
  effect text check (effect in ('helped','no-clear-difference','made-it-harder','not-sure')),
  environment_help text check (environment_help in ('yes','no','no-change')),
  barrier text check (barrier in ('forgot','did-not-notice-cue','too-busy-under-pressure','environment-got-in-way','strategy-did-not-fit','other')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.node_progress enable row level security;
alter table public.training_sessions enable row level security;
alter table public.missions enable row level security;
alter table public.mission_checkins enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Entitlements are read-only to normal clients; Stripe/webhook/admin service roles write them.
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements for select using (auth.uid() = user_id);

drop policy if exists "node_progress_select_own" on public.node_progress;
create policy "node_progress_select_own" on public.node_progress for select using (auth.uid() = user_id);
drop policy if exists "node_progress_insert_own" on public.node_progress;
create policy "node_progress_insert_own" on public.node_progress for insert with check (auth.uid() = user_id);
drop policy if exists "node_progress_update_own" on public.node_progress;
create policy "node_progress_update_own" on public.node_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "training_sessions_select_own" on public.training_sessions;
create policy "training_sessions_select_own" on public.training_sessions for select using (auth.uid() = user_id);
drop policy if exists "training_sessions_insert_own" on public.training_sessions;
create policy "training_sessions_insert_own" on public.training_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "training_sessions_update_own" on public.training_sessions;
create policy "training_sessions_update_own" on public.training_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "missions_select_own" on public.missions;
create policy "missions_select_own" on public.missions for select using (auth.uid() = user_id);
drop policy if exists "missions_insert_own" on public.missions;
create policy "missions_insert_own" on public.missions for insert with check (auth.uid() = user_id);
drop policy if exists "missions_update_own" on public.missions;
create policy "missions_update_own" on public.missions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "missions_delete_own" on public.missions;
create policy "missions_delete_own" on public.missions for delete using (auth.uid() = user_id);

drop policy if exists "mission_checkins_select_own" on public.mission_checkins;
create policy "mission_checkins_select_own" on public.mission_checkins for select using (auth.uid() = user_id);
drop policy if exists "mission_checkins_insert_own" on public.mission_checkins;
create policy "mission_checkins_insert_own" on public.mission_checkins for insert with check (auth.uid() = user_id);
