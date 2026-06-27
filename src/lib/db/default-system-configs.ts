export const defaultSystemConfigs = [
  {
    key: "daily_success_limit_per_user",
    value: 2,
    description: "每个用户每日成功生成数量",
  },
  {
    key: "campaign_success_limit_per_user",
    value: 10,
    description: "每个用户活动期成功生成总数量",
  },
  {
    key: "daily_submit_limit_per_user",
    value: 5,
    description: "每个用户每日提交任务次数",
  },
  {
    key: "daily_platform_success_limit",
    value: 3000,
    description: "平台每日成功生成总量",
  },
  {
    key: "feature_enabled",
    value: true,
    description: "AI 写真功能总开关",
  },
  {
    key: "temp_image_retention_hours",
    value: 24,
    description: "临时原图保留小时数",
  },
  {
    key: "fortune_lifetime_success_limit_per_user",
    value: 1,
    description: "AI 算命每个用户总成功生成数量",
  },
  {
    key: "fortune_daily_success_limit_per_user",
    value: 1,
    description: "兼容旧配置：AI 算命每个用户总成功生成数量",
  },
  {
    key: "fortune_daily_submit_limit_per_user",
    value: 5,
    description: "AI 算命每个用户每日提交任务次数",
  },
  {
    key: "fortune_daily_platform_success_limit",
    value: 3000,
    description: "AI 算命平台每日成功生成总量",
  },
  {
    key: "fortune_feature_enabled",
    value: true,
    description: "AI 算命功能总开关",
  },
  {
    key: "fortune_palm_enabled",
    value: true,
    description: "AI 看手相功能开关",
  },
  {
    key: "fortune_face_enabled",
    value: true,
    description: "AI 看面相功能开关",
  },
];
