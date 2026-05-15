create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null unique,
  nickname text,
  avatar_url text,
  status text not null default 'normal' check (status in ('normal', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.photo_templates (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null default '写真',
  cover_url text not null,
  animated_cover_url text,
  tagline text not null default '',
  description text not null default '',
  prompt text not null,
  negative_prompt text not null,
  recommended_ratios text[] not null default array['3:4'],
  supported_ratios text[] not null default array['1:1', '3:4', '4:5', '9:16', '16:9'],
  gender_options text[] not null default array['female', 'male', 'unspecified'],
  age_options text[] not null default array['18-25', '26-35', '36-45', '46+'],
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id),
  template_id text not null references public.photo_templates(id),
  provider text not null default 'apimart' check (provider in ('apimart', 'mock')),
  provider_task_id text,
  status text not null check (status in ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  gender text not null check (gender in ('female', 'male', 'unspecified')),
  age_range text not null check (age_range in ('18-25', '26-35', '36-45', '46+')),
  ratio text not null check (ratio in ('1:1', '3:4', '4:5', '9:16', '16:9')),
  resolution text not null default '1k' check (resolution in ('1k', '2k', '4k')),
  input_image_count integer not null default 0,
  temp_input_urls text[] not null default '{}',
  provider_result_url text,
  stored_image_url text,
  error_code text,
  error_message text,
  submit_ip text,
  device_id text,
  user_agent text,
  counts_quota boolean not null default false,
  quota_counted_at timestamptz,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_generation_tasks_user_created
  on public.generation_tasks(user_id, created_at desc);

create index if not exists idx_generation_tasks_status_created
  on public.generation_tasks(status, created_at);

create index if not exists idx_generation_tasks_provider_task
  on public.generation_tasks(provider_task_id);

create table if not exists public.daily_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id),
  usage_date date not null,
  success_count integer not null default 0,
  submit_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, usage_date)
);

create table if not exists public.system_configs (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.system_configs(key, value, description)
values
  ('daily_success_limit_per_user', '2', '每个用户每日成功生成数量'),
  ('campaign_success_limit_per_user', '10', '每个用户活动期成功生成总数量'),
  ('daily_submit_limit_per_user', '5', '每个用户每日提交任务次数'),
  ('daily_platform_success_limit', '3000', '平台每日成功生成总量'),
  ('feature_enabled', 'true', 'AI 写真功能总开关'),
  ('temp_image_retention_hours', '24', '临时原图保留小时数')
on conflict (key) do nothing;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'operator' check (role in ('owner', 'admin', 'operator')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.admin_users(id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
