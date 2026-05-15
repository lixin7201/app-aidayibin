import type {
  AgeRangeOption,
  GenderOption,
  GenerationStatus,
  ImageRatio,
  ResolutionOption,
} from "@/features/generation/types";
import type {
  FortuneFeatureType,
  FortuneType,
} from "@/features/fortune/types";

export type AppUserRecord = {
  id: string;
  app_user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  status: "normal" | "blocked";
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
};

export type PhotoTemplateRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cover_url: string;
  animated_cover_url: string | null;
  tagline: string;
  description: string;
  prompt: string;
  negative_prompt: string;
  recommended_ratios: ImageRatio[];
  supported_ratios: ImageRatio[];
  gender_options: GenderOption[];
  age_options: AgeRangeOption[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GenerationTaskRecord = {
  id: string;
  user_id: string;
  template_id: string;
  provider: "apimart" | "mock";
  provider_task_id: string | null;
  status: GenerationStatus;
  gender: GenderOption;
  age_range: AgeRangeOption;
  ratio: ImageRatio;
  resolution: ResolutionOption;
  input_image_count: number;
  temp_input_urls: string[];
  provider_result_url: string | null;
  stored_image_url: string | null;
  error_code: string | null;
  error_message: string | null;
  submit_ip: string | null;
  device_id: string | null;
  user_agent: string | null;
  counts_quota: boolean;
  quota_counted_at: string | null;
  lock_until: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
};

export type FortuneGenerationTaskRecord = {
  id: string;
  user_id: string;
  fortune_type: FortuneType;
  feature_type: FortuneFeatureType;
  prompt_type: "palm_report" | "face_report";
  provider: "apimart" | "mock";
  provider_task_id: string | null;
  status: GenerationStatus;
  ratio: ImageRatio;
  resolution: ResolutionOption;
  input_image_count: number;
  temp_input_urls: string[];
  provider_result_url: string | null;
  stored_image_url: string | null;
  error_code: string | null;
  error_message: string | null;
  submit_ip: string | null;
  device_id: string | null;
  user_agent: string | null;
  counts_quota: boolean;
  quota_counted_at: string | null;
  metadata: Record<string, unknown>;
  lock_until: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
};

export type DailyUsageRecord = {
  id: string;
  user_id: string;
  usage_date: string;
  success_count: number;
  submit_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
};

export type SystemConfigRecord = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

export type AdminUserRecord = {
  id: string;
  username: string;
  password_hash: string;
  role: "owner" | "admin" | "operator";
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
};

export type AdminAuditLogRecord = {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: AppUserRecord;
        Insert: Partial<AppUserRecord> & { app_user_id: string };
        Update: Partial<AppUserRecord>;
        Relationships: [];
      };
      photo_templates: {
        Row: PhotoTemplateRecord;
        Insert: Partial<PhotoTemplateRecord> & {
          id: string;
          name: string;
          slug: string;
          prompt: string;
          negative_prompt: string;
        };
        Update: Partial<PhotoTemplateRecord>;
        Relationships: [];
      };
      generation_tasks: {
        Row: GenerationTaskRecord;
        Insert: Partial<GenerationTaskRecord> & {
          user_id: string;
          template_id: string;
          status: GenerationStatus;
          gender: GenderOption;
          age_range: AgeRangeOption;
          ratio: ImageRatio;
          resolution: ResolutionOption;
          input_image_count: number;
        };
        Update: Partial<GenerationTaskRecord>;
        Relationships: [];
      };
      fortune_generation_tasks: {
        Row: FortuneGenerationTaskRecord;
        Insert: Partial<FortuneGenerationTaskRecord> & {
          user_id: string;
          fortune_type: FortuneType;
          feature_type: FortuneFeatureType;
          prompt_type: "palm_report" | "face_report";
          status: GenerationStatus;
          ratio: ImageRatio;
          resolution: ResolutionOption;
          input_image_count: number;
        };
        Update: Partial<FortuneGenerationTaskRecord>;
        Relationships: [];
      };
      daily_usage: {
        Row: DailyUsageRecord;
        Insert: Partial<DailyUsageRecord> & {
          user_id: string;
          usage_date: string;
        };
        Update: Partial<DailyUsageRecord>;
        Relationships: [];
      };
      system_configs: {
        Row: SystemConfigRecord;
        Insert: Partial<SystemConfigRecord> & { key: string; value: unknown };
        Update: Partial<SystemConfigRecord>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRecord;
        Insert: Partial<AdminUserRecord> & {
          username: string;
          password_hash: string;
        };
        Update: Partial<AdminUserRecord>;
        Relationships: [];
      };
      admin_audit_logs: {
        Row: AdminAuditLogRecord;
        Insert: Partial<AdminAuditLogRecord> & {
          action: string;
          target_type: string;
        };
        Update: Partial<AdminAuditLogRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
