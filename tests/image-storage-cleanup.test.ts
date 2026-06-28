import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAliyunOssObject: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  config: {
    IMAGE_STORAGE_PROVIDER: "aliyun_oss",
    NEXT_PUBLIC_APP_URL: "https://ces.dayibin.cn/ai",
    ALIYUN_OSS_PUBLIC_BASE_URL: "https://img.dayibin.cn",
    CLOUDFLARE_R2_PUBLIC_BASE_URL: "https://r2.example.com",
    LOCAL_IMAGE_PUBLIC_BASE_URL: "https://ces.dayibin.cn/ai-upload",
  },
}));

vi.mock("@/lib/storage/aliyun-oss", () => ({
  buildAliyunOssPublicUrl: (objectKey: string) =>
    `https://img.dayibin.cn/${objectKey}`,
  deleteAliyunOssObject: mocks.deleteAliyunOssObject,
  putAliyunOssObject: vi.fn(),
}));

vi.mock("@/lib/storage/r2", () => ({
  buildR2PublicUrl: (objectKey: string) => `https://r2.example.com/${objectKey}`,
  createResultCardImageBuffer: vi.fn(),
  createResultPreviewImageBuffer: vi.fn(),
  createResultShareImageBuffer: vi.fn(),
  deleteObject: mocks.deleteObject,
  getResultCardImageObjectKey: (userId: string, taskId: string) =>
    `results-card/${userId}/${taskId}.jpg`,
  getResultImageObjectKey: (userId: string, taskId: string) =>
    `results/${userId}/${taskId}.png`,
  getResultPreviewImageObjectKey: (userId: string, taskId: string) =>
    `results-preview/${userId}/${taskId}.webp`,
  getResultShareImageObjectKey: (userId: string, taskId: string) =>
    `results-share/${userId}/${taskId}.webp`,
  persistRemoteImage: vi.fn(),
  uploadUserInputImage: vi.fn(),
}));

import { deleteTaskImages } from "@/lib/storage/image-storage";

describe("image storage cleanup", () => {
  beforeEach(() => {
    mocks.deleteAliyunOssObject.mockReset();
    mocks.deleteObject.mockReset();
  });

  it("deletes recorded result images, derived result images, and temp uploads", async () => {
    await deleteTaskImages({
      provider: "aliyun_oss",
      userId: "user-1",
      taskId: "task-1",
      originalObjectKey: "custom/original.png",
      previewObjectKey: "custom/preview.webp",
      tempInputUrls: ["https://img.dayibin.cn/temp/user-1/input.jpg"],
    });

    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "custom/original.png",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "custom/preview.webp",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "results/user-1/task-1.png",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "results-preview/user-1/task-1.webp",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "results-share/user-1/task-1.webp",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "results-card/user-1/task-1.jpg",
    );
    expect(mocks.deleteAliyunOssObject).toHaveBeenCalledWith(
      "temp/user-1/input.jpg",
    );
  });
});
