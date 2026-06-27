-- 2026-05-17: AI 体验、安全、分享链路优化

-- 1. 新增 api_rate_limits 表（带唯一约束，支持 INSERT ... ON DUPLICATE KEY UPDATE）
CREATE TABLE IF NOT EXISTS `api_rate_limits` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `rate_key` VARCHAR(191) NOT NULL,
  `window_start` DATETIME(3) NOT NULL,
  `count` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE KEY `idx_rate_limits_key_window_unique` (`rate_key`, `window_start`),
  KEY `idx_rate_limits_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. generation_tasks 新增 public_image_url 字段
ALTER TABLE `generation_tasks`
  ADD COLUMN IF NOT EXISTS `public_image_url` TEXT NULL AFTER `stored_image_url`;

-- 3. fortune_generation_tasks 新增 public_image_url 字段
ALTER TABLE `fortune_generation_tasks`
  ADD COLUMN IF NOT EXISTS `public_image_url` TEXT NULL AFTER `stored_image_url`;
