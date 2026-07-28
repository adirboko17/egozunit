alter table public.member_profiles
  add column if not exists monday_item_id text,
  add column if not exists monday_synced_at timestamptz;

comment on column public.member_profiles.monday_item_id is
  'Monday.com item ID used to make member synchronization idempotent';

comment on column public.member_profiles.monday_synced_at is
  'Last successful synchronization time with Monday.com';
