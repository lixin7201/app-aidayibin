create table if not exists public.fortune_generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id),
  fortune_type text not null check (fortune_type in ('palm', 'face')),
  feature_type text not null check (feature_type in ('fortune_palm', 'fortune_face')),
  prompt_type text not null check (prompt_type in ('palm_report', 'face_report')),
  provider text not null default 'apimart' check (provider in ('apimart', 'mock')),
  provider_task_id text,
  status text not null check (status in ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  ratio text not null default '3:4' check (ratio in ('1:1', '3:4', '4:5', '9:16', '16:9')),
  resolution text not null default '2k' check (resolution in ('1k', '2k', '4k')),
  input_image_count integer not null default 1,
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
  metadata jsonb not null default '{}',
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_fortune_generation_tasks_user_created
  on public.fortune_generation_tasks(user_id, created_at desc);

create index if not exists idx_fortune_generation_tasks_status_created
  on public.fortune_generation_tasks(status, created_at);

create index if not exists idx_fortune_generation_tasks_provider_task
  on public.fortune_generation_tasks(provider_task_id);

create index if not exists idx_fortune_generation_tasks_feature_created
  on public.fortune_generation_tasks(feature_type, created_at desc);

insert into public.system_configs(key, value, description)
values
  ('fortune_daily_success_limit_per_user', '2', 'AI 算命每个用户每日成功生成数量'),
  ('fortune_campaign_success_limit_per_user', '20', 'AI 算命每个用户活动期成功生成数量'),
  ('fortune_daily_submit_limit_per_user', '5', 'AI 算命每个用户每日提交任务次数'),
  ('fortune_daily_platform_success_limit', '3000', 'AI 算命平台每日成功生成总量'),
  ('fortune_feature_enabled', 'true', 'AI 算命功能总开关'),
  ('fortune_palm_enabled', 'true', 'AI 看手相功能开关'),
  ('fortune_face_enabled', 'true', 'AI 看面相功能开关')
on conflict (key) do nothing;
