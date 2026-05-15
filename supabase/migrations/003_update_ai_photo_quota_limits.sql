insert into public.system_configs(key, value, description, updated_at)
values
  ('daily_success_limit_per_user', '2', '每个用户每日成功生成数量', now()),
  ('campaign_success_limit_per_user', '10', '每个用户活动期成功生成总数量', now())
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = excluded.updated_at;
