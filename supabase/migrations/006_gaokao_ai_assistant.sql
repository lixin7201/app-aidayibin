CREATE TABLE IF NOT EXISTS `gaokao_admission_records` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `source_id` VARCHAR(191) NULL UNIQUE,
  `province` VARCHAR(32) NOT NULL,
  `year` INT NOT NULL,
  `subject_type` VARCHAR(32) NOT NULL,
  `batch` VARCHAR(191) NULL,
  `school_name` TEXT NOT NULL,
  `major_name` TEXT NULL,
  `score` INT NULL,
  `rank` INT NULL,
  `quota` INT NULL,
  `source_file` TEXT NULL,
  `raw_payload` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY `idx_gaokao_adm_prov_subject_rank` (`province`, `subject_type`, `rank`),
  KEY `idx_gaokao_adm_prov_subject_score` (`province`, `subject_type`, `score`),
  KEY `idx_gaokao_adm_year_prov_subject` (`year`, `province`, `subject_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gaokao_batch_lines` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `year` INT NOT NULL,
  `province` VARCHAR(32) NOT NULL,
  `subject_type` VARCHAR(32) NOT NULL,
  `batch` VARCHAR(191) NOT NULL,
  `score` INT NOT NULL,
  `source_url` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uniq_gaokao_batch_line` (`year`, `province`, `subject_type`, `batch`),
  KEY `idx_gaokao_batch_line_lookup` (`year`, `province`, `subject_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gaokao_score_segments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `year` INT NOT NULL,
  `province` VARCHAR(32) NOT NULL,
  `subject_type` VARCHAR(32) NOT NULL,
  `score` INT NOT NULL,
  `same_score_count` INT NOT NULL,
  `cumulative_rank` INT NOT NULL,
  `line_type` VARCHAR(191) NULL,
  `source_url` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uniq_gaokao_score_segment` (`year`, `province`, `subject_type`, `score`),
  KEY `idx_gaokao_segment_lookup` (`province`, `subject_type`, `score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gaokao_reports` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `title` TEXT NOT NULL,
  `profile` JSON NOT NULL,
  `recommendations` JSON NOT NULL,
  `summary` TEXT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'succeeded',
  `submit_ip` VARCHAR(191) NULL,
  `device_id` VARCHAR(191) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  KEY `idx_gaokao_reports_user_created` (`user_id`, `created_at`),
  CONSTRAINT `gaokao_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
