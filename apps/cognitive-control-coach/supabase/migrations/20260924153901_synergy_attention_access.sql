-- Reassert the Synergy Attention commerce grant contract and record it in migration history.

alter table private.iq_coach_checkout_purchases
  drop constraint if exists iq_coach_checkout_purchases_purchased_product_code_check;
alter table private.iq_coach_checkout_purchases
  add constraint iq_coach_checkout_purchases_purchased_product_code_check
  check (purchased_product_code in ('g_track', 'cognitive_control_coach', 'complete_cognitive_route', 'synergy_attention'));

alter table private.iq_coach_access_grants
  drop constraint if exists iq_coach_access_grants_product_code_check;
alter table private.iq_coach_access_grants
  add constraint iq_coach_access_grants_product_code_check
  check (product_code in ('g_track', 'cognitive_control_coach', 'synergy_attention'));

alter table public.user_entitlements
  drop constraint if exists user_entitlements_product_code_check;
alter table public.user_entitlements
  add constraint user_entitlements_product_code_check
  check (product_code in ('g_track', 'cognitive_control_coach', 'synergy_attention'));

create or replace function public.record_iq_coach_checkout(
  p_email text,
  p_stripe_customer_id text,
  p_checkout_session_id text,
  p_product_code text,
  p_purchased_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(p_email));
  purchase_time timestamptz := coalesce(p_purchased_at, now());
  entitlement_code text;
  entitlement_codes text[];
  email_sent_at timestamptz;
begin
  if normalized_email is null
    or length(normalized_email) > 320
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or nullif(btrim(p_checkout_session_id), '') is null
    or p_product_code not in ('g_track', 'cognitive_control_coach', 'complete_cognitive_route', 'synergy_attention') then
    raise exception 'Invalid IQ Coach checkout grant';
  end if;

  insert into private.iq_coach_checkout_purchases as purchases (
    checkout_session_id, email, purchased_product_code, stripe_customer_id, purchased_at, updated_at
  ) values (
    p_checkout_session_id, normalized_email, p_product_code,
    nullif(btrim(p_stripe_customer_id), ''), purchase_time, now()
  )
  on conflict (checkout_session_id) do update
  set stripe_customer_id = coalesce(excluded.stripe_customer_id, purchases.stripe_customer_id),
      updated_at = now()
  returning access_email_sent_at into email_sent_at;

  entitlement_codes := case p_product_code
    when 'complete_cognitive_route' then array['g_track', 'cognitive_control_coach']
    else array[p_product_code]
  end;

  foreach entitlement_code in array entitlement_codes loop
    insert into private.iq_coach_access_grants as grants (
      email, product_code, status, source, source_reference, stripe_customer_id,
      purchased_at, expires_at, updated_at
    ) values (
      normalized_email, entitlement_code, 'active', 'stripe_checkout',
      p_checkout_session_id, nullif(btrim(p_stripe_customer_id), ''),
      purchase_time, purchase_time + interval '1 year', now()
    )
    on conflict (email, product_code) do update
    set status = 'active',
        source = 'stripe_checkout',
        source_reference = excluded.source_reference,
        stripe_customer_id = coalesce(excluded.stripe_customer_id, grants.stripe_customer_id),
        purchased_at = excluded.purchased_at,
        expires_at = case
          when grants.expires_at is null then null
          when grants.source_reference = excluded.source_reference then greatest(grants.expires_at, excluded.expires_at)
          else greatest(grants.expires_at, excluded.purchased_at) + interval '1 year'
        end,
        updated_at = now();
  end loop;

  return email_sent_at is null;
end;
$$;

revoke all on function public.record_iq_coach_checkout(text, text, text, text, timestamptz) from public;
grant execute on function public.record_iq_coach_checkout(text, text, text, text, timestamptz) to service_role;
