import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  getImageGenerationTask: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    generationTask: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/apimart/client", () => ({
  getImageGenerationTask: mocks.getImageGenerationTask,
}));

const baseTask = {
  id: "task-1",
  user_id: "user-1",
  template_id: "template-1",
  provider: "apimart",
  provider_task_id: "provider-1",
  status: "processing",
  gender: "female",
  age_range: "18-25",
  ratio: "3:4",
  resolution: "1k",
  input_image_count: 1,
  temp_input_urls: [],
  provider_result_url: null,
  stored_image_url: null,
  public_image_url: null,
  preview_image_url: null,
  share_image_url: null,
  card_image_url: null,
  storage_provider: null,
  storage_object_key: null,
  preview_object_key: null,
  share_object_key: null,
  card_object_key: null,
  error_code: null,
  error_message: null,
  submit_ip: null,
  device_id: null,
  user_agent: null,
  counts_quota: false,
  quota_counted_at: null,
  lock_until: null,
  created_at: new Date("2026-06-28T00:00:00Z"),
  submitted_at: null,
  completed_at: null,
  deleted_at: null,
};

import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";

describe("generation sync locking", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.updateMany.mockReset();
    mocks.update.mockReset();
    mocks.getImageGenerationTask.mockReset();
  });

  it("skips a task when another worker already claimed it", async () => {
    mocks.findMany.mockResolvedValue([baseTask]);
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await syncPendingGenerationTasks();

    expect(result).toEqual([
      {
        taskId: "task-1",
        status: "skipped",
        message: "Task is locked by another worker",
      },
    ]);
    expect(mocks.getImageGenerationTask).not.toHaveBeenCalled();
  });

  it("clears the lock after syncing a still-processing task", async () => {
    mocks.findMany.mockResolvedValue([baseTask]);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.getImageGenerationTask.mockResolvedValue({ status: "processing" });
    mocks.update.mockResolvedValue({});

    const result = await syncPendingGenerationTasks();

    expect(result).toEqual([{ taskId: "task-1", status: "processing" }]);
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { lock_until: expect.any(Date) },
      }),
    );
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "processing",
          lock_until: null,
        },
      }),
    );
  });
});
