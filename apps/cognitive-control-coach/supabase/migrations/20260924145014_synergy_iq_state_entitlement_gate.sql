-- Require an active Synergy Attention entitlement for cloud programme state.

drop policy if exists "users read own synergy programme" on public.synergy_programme_state;
create policy "entitled users read own synergy programme"
on public.synergy_programme_state
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.user_entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = 'synergy_attention'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);

drop policy if exists "users insert own synergy programme" on public.synergy_programme_state;
create policy "entitled users insert own synergy programme"
on public.synergy_programme_state
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.user_entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = 'synergy_attention'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);

drop policy if exists "users update own synergy programme" on public.synergy_programme_state;
create policy "entitled users update own synergy programme"
on public.synergy_programme_state
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.user_entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = 'synergy_attention'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.user_entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = 'synergy_attention'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);

drop policy if exists "users delete own synergy programme" on public.synergy_programme_state;
create policy "entitled users delete own synergy programme"
on public.synergy_programme_state
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.user_entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = 'synergy_attention'
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  )
);
