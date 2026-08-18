-- ═══════════════════════════════════════════════════════════
-- AutoMarketer — Multi-Tenant Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════
-- 1. ORGANIZATIONS
-- ═══════════════════════════════════════════════════════════
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'free' check (plan in ('free','pro','agency')),
  owner_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- 2. ORGANIZATION MEMBERS
-- ═══════════════════════════════════════════════════════════
create table if not exists public.organization_members (
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null default 'member' check (role in ('owner','admin','member')),
  created_at       timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists idx_org_members_user on public.organization_members(user_id);

-- ═══════════════════════════════════════════════════════════
-- 3. ORGANIZATION CREDENTIALS (server-side encrypted)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.organization_credentials (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  service          text not null check (service in (
    'anthropic','openai','serper','serpapi','apify',
    'telegram','whatsapp','linkedin','facebook','instagram',
    'twitter','buffer','gmail','slack'
  )),
  encrypted_value  text not null,
  created_at       timestamptz not null default now(),
  unique (organization_id, service)
);

-- ═══════════════════════════════════════════════════════════
-- 4. BRANDS (tenant-scoped)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.brands (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null,
  industry            text,
  website             text,
  products            text,
  target_audience     text,
  platforms           text[] default '{}',
  content_pillars     text[] default '{}',
  notification_email  text,
  telegram_chat_id    text,
  whatsapp_number     text,
  auto_approve_hours  int default 24,
  is_active           boolean default true,
  faqs                text,
  keywords            text,
  avoid               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_brands_org on public.brands(organization_id);

-- ═══════════════════════════════════════════════════════════
-- 5. BRAND INTELLIGENCE (tenant-scoped)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.brand_intelligence (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  brand_id            uuid not null references public.brands(id) on delete cascade,
  voice_profile       text,
  competitor_analysis text,
  strategy            text,
  keywords            text[] default '{}',
  hashtag_banks       jsonb default '{}',
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_intel_brand on public.brand_intelligence(brand_id);
create index if not exists idx_intel_org on public.brand_intelligence(organization_id);

-- ═══════════════════════════════════════════════════════════
-- 6. POSTS (tenant-scoped)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  brand_id            uuid not null references public.brands(id) on delete cascade,
  platform            text not null,
  content             text not null default '',
  hashtags            text[] default '{}',
  image_url           text,
  image_prompt        text,
  content_pillar      text,
  best_time           text,
  status              text not null default 'draft' check (status in (
    'draft','pending_approval','approved','auto_approved','rejected','published','scheduled'
  )),
  approval_deadline   timestamptz,
  scheduled_at        timestamptz,
  published_at        timestamptz,
  approved_at         timestamptz,
  approved_by         text,
  author              text default 'AutoMarketer AI',
  likes               int default 0,
  comments            int default 0,
  shares              int default 0,
  reach               int default 0,
  engagement_rate     numeric default 0,
  platform_post_id    text,
  publish_error       text,
  is_thread           boolean default false,
  thread_tweets       jsonb default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_posts_org on public.posts(organization_id);
create index if not exists idx_posts_brand on public.posts(brand_id);
create index if not exists idx_posts_status on public.posts(status);

-- ═══════════════════════════════════════════════════════════
-- 7. WEEKLY REPORTS (tenant-scoped)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.weekly_reports (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id        uuid not null references public.brands(id) on delete cascade,
  week_start      date not null,
  week_end        date not null,
  report_text     text,
  total_posts     int default 0,
  avg_engagement  numeric default 0,
  best_platform   text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_reports_org on public.weekly_reports(organization_id);
create index if not exists idx_reports_brand on public.weekly_reports(brand_id);

-- ═══════════════════════════════════════════════════════════
-- 8. BLOG POSTS (tenant-scoped — SEO Blog Writer output)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id        uuid references public.brands(id) on delete set null,
  title           text not null,
  content         text not null,
  primary_keyword text,
  keywords        jsonb default '[]',
  word_count      int default 0,
  source          text default 'claude' check (source in ('claude','n8n')),
  infographic_url text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_blogs_org on public.blog_posts(organization_id);

-- ═══════════════════════════════════════════════════════════
-- 9. NOTIFICATION SETTINGS (tenant-scoped)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.notification_settings (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  brand_id            uuid references public.brands(id) on delete cascade,
  telegram_enabled    boolean default false,
  whatsapp_enabled    boolean default false,
  slack_enabled       boolean default false,
  email_enabled       boolean default true,
  slack_webhook_url   text,
  weekly_report_day   int default 1,
  unique (organization_id, brand_id)
);

-- ═══════════════════════════════════════════════════════════
-- 10. UPDATED_AT trigger
-- ═══════════════════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brands_updated on public.brands;
create trigger trg_brands_updated before update on public.brands
  for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- 11. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- Helper function: get the user's organization IDs
create or replace function public.user_org_ids()
returns uuid[] as $$
  select coalesce(array_agg(organization_id), '{}')
  from public.organization_members
  where user_id = auth.uid();
$$ language sql security definer stable;

-- ── Organizations ──
alter table public.organizations enable row level security;
drop policy if exists "org_select" on public.organizations;
create policy "org_select" on public.organizations
  for select using ( id = any(public.user_org_ids()) );
drop policy if exists "org_insert" on public.organizations;
create policy "org_insert" on public.organizations
  for insert with check ( owner_id = auth.uid() );
drop policy if exists "org_update" on public.organizations;
create policy "org_update" on public.organizations
  for update using ( id = any(public.user_org_ids()) );

-- ── Organization Members ──
alter table public.organization_members enable row level security;
drop policy if exists "members_select" on public.organization_members;
create policy "members_select" on public.organization_members
  for select using ( organization_id = any(public.user_org_ids()) or user_id = auth.uid() );
drop policy if exists "members_insert" on public.organization_members;
create policy "members_insert" on public.organization_members
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "members_delete" on public.organization_members;
create policy "members_delete" on public.organization_members
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Organization Credentials ──
alter table public.organization_credentials enable row level security;
drop policy if exists "creds_select" on public.organization_credentials;
create policy "creds_select" on public.organization_credentials
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "creds_insert" on public.organization_credentials;
create policy "creds_insert" on public.organization_credentials
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "creds_update" on public.organization_credentials;
create policy "creds_update" on public.organization_credentials
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "creds_delete" on public.organization_credentials;
create policy "creds_delete" on public.organization_credentials
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Brands ──
alter table public.brands enable row level security;
drop policy if exists "brands_select" on public.brands;
create policy "brands_select" on public.brands
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "brands_insert" on public.brands;
create policy "brands_insert" on public.brands
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "brands_update" on public.brands;
create policy "brands_update" on public.brands
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "brands_delete" on public.brands;
create policy "brands_delete" on public.brands
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Brand Intelligence ──
alter table public.brand_intelligence enable row level security;
drop policy if exists "intel_select" on public.brand_intelligence;
create policy "intel_select" on public.brand_intelligence
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "intel_insert" on public.brand_intelligence;
create policy "intel_insert" on public.brand_intelligence
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "intel_update" on public.brand_intelligence;
create policy "intel_update" on public.brand_intelligence
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "intel_delete" on public.brand_intelligence;
create policy "intel_delete" on public.brand_intelligence
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Posts ──
alter table public.posts enable row level security;
drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Weekly Reports ──
alter table public.weekly_reports enable row level security;
drop policy if exists "reports_select" on public.weekly_reports;
create policy "reports_select" on public.weekly_reports
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "reports_insert" on public.weekly_reports;
create policy "reports_insert" on public.weekly_reports
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "reports_update" on public.weekly_reports;
create policy "reports_update" on public.weekly_reports
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "reports_delete" on public.weekly_reports;
create policy "reports_delete" on public.weekly_reports
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Blog Posts ──
alter table public.blog_posts enable row level security;
drop policy if exists "blogs_select" on public.blog_posts;
create policy "blogs_select" on public.blog_posts
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "blogs_insert" on public.blog_posts;
create policy "blogs_insert" on public.blog_posts
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "blogs_update" on public.blog_posts;
create policy "blogs_update" on public.blog_posts
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "blogs_delete" on public.blog_posts;
create policy "blogs_delete" on public.blog_posts
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ── Notification Settings ──
alter table public.notification_settings enable row level security;
drop policy if exists "notif_select" on public.notification_settings;
create policy "notif_select" on public.notification_settings
  for select using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "notif_insert" on public.notification_settings;
create policy "notif_insert" on public.notification_settings
  for insert with check ( organization_id = any(public.user_org_ids()) );
drop policy if exists "notif_update" on public.notification_settings;
create policy "notif_update" on public.notification_settings
  for update using ( organization_id = any(public.user_org_ids()) );
drop policy if exists "notif_delete" on public.notification_settings;
create policy "notif_delete" on public.notification_settings
  for delete using ( organization_id = any(public.user_org_ids()) );

-- ═══════════════════════════════════════════════════════════
-- 12. AUTO-PROVISION ORG ON SIGNUP
-- Trigger: when a new user signs up, create org + membership
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
declare
  org_id uuid;
  agency_name text;
begin
  agency_name := coalesce(new.raw_user_meta_data->>'agency_name', new.email || "'s Agency");

  insert into public.organizations (name, owner_id)
  values (agency_name, new.id)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- 13. STORAGE BUCKET FOR POST IMAGES
-- ═══════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Post images public read"
  on storage.objects for select
  to anon, authenticated
  using ( bucket_id = 'post-images' );

create policy "Post images authenticated upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'post-images' );

create policy "Post images authenticated update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'post-images' );

create policy "Post images authenticated delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'post-images' );
