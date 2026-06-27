import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { prisma } from "@/lib/db/prisma";
import { config } from "@/lib/config";
import { persistRemoteResultImage } from "@/lib/storage/image-storage";

type MigrationKind = "photo" | "fortune";

type CliOptions = {
  dryRun: boolean;
  limit: number;
  kind: MigrationKind | "all";
};

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (config.IMAGE_STORAGE_PROVIDER === "r2" && !options.dryRun) {
    throw new Error(
      "IMAGE_STORAGE_PROVIDER 当前是 r2。请先切到 aliyun_oss 或 local 后再执行正式迁移。",
    );
  }

  let remaining = options.limit;
  let migrated = 0;

  if (options.kind === "photo" || options.kind === "all") {
    const count = await migratePhotoTasks({
      dryRun: options.dryRun,
      limit: remaining,
    });
    migrated += count;
    remaining -= count;
  }

  if (remaining > 0 && (options.kind === "fortune" || options.kind === "all")) {
    const count = await migrateFortuneTasks({
      dryRun: options.dryRun,
      limit: remaining,
    });
    migrated += count;
  }

  console.log(
    `${options.dryRun ? "Dry run scanned" : "Migrated"} ${migrated} image task(s).`,
  );
}

async function migratePhotoTasks(input: { dryRun: boolean; limit: number }) {
  const tasks = await prisma.generationTask.findMany({
    where: {
      status: "succeeded",
      deleted_at: null,
      stored_image_url: { not: null },
      OR: [
        { storage_provider: null },
        { storage_provider: "r2" },
        { preview_image_url: null },
        { share_image_url: null },
        { card_image_url: null },
      ],
    },
    orderBy: { completed_at: "asc" },
    take: input.limit,
  });

  let count = 0;

  for (const task of tasks) {
    count++;
    console.log(`[photo] ${task.id} -> ${config.IMAGE_STORAGE_PROVIDER}`);

    if (input.dryRun) {
      continue;
    }

    const storedImage = await persistRemoteResultImage({
      imageUrl: task.stored_image_url!,
      userId: task.user_id,
      taskId: task.id,
    });

    await prisma.generationTask.update({
      where: { id: task.id },
      data: {
        stored_image_url: storedImage.originalUrl,
        public_image_url: storedImage.shareUrl ?? storedImage.originalUrl,
        preview_image_url: storedImage.previewUrl,
        share_image_url: storedImage.shareUrl,
        card_image_url: storedImage.cardUrl,
        storage_provider: storedImage.provider,
        storage_object_key: storedImage.originalObjectKey,
        preview_object_key: storedImage.previewObjectKey,
        share_object_key: storedImage.shareObjectKey,
        card_object_key: storedImage.cardObjectKey,
      },
    });
  }

  return count;
}

async function migrateFortuneTasks(input: { dryRun: boolean; limit: number }) {
  const tasks = await prisma.fortuneGenerationTask.findMany({
    where: {
      status: "succeeded",
      deleted_at: null,
      stored_image_url: { not: null },
      OR: [
        { storage_provider: null },
        { storage_provider: "r2" },
        { preview_image_url: null },
        { share_image_url: null },
        { card_image_url: null },
      ],
    },
    orderBy: { completed_at: "asc" },
    take: input.limit,
  });

  let count = 0;

  for (const task of tasks) {
    count++;
    console.log(`[fortune] ${task.id} -> ${config.IMAGE_STORAGE_PROVIDER}`);

    if (input.dryRun) {
      continue;
    }

    const storedImage = await persistRemoteResultImage({
      imageUrl: task.stored_image_url!,
      userId: task.user_id,
      taskId: task.id,
    });

    await prisma.fortuneGenerationTask.update({
      where: { id: task.id },
      data: {
        stored_image_url: storedImage.originalUrl,
        public_image_url: storedImage.shareUrl ?? storedImage.originalUrl,
        preview_image_url: storedImage.previewUrl,
        share_image_url: storedImage.shareUrl,
        card_image_url: storedImage.cardUrl,
        storage_provider: storedImage.provider,
        storage_object_key: storedImage.originalObjectKey,
        preview_object_key: storedImage.previewObjectKey,
        share_object_key: storedImage.shareObjectKey,
        card_object_key: storedImage.cardObjectKey,
      },
    });
  }

  return count;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    limit: 50,
    kind: "all",
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));
      options.limit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50;
      continue;
    }

    if (arg.startsWith("--kind=")) {
      const kind = arg.slice("--kind=".length);
      if (kind === "photo" || kind === "fortune" || kind === "all") {
        options.kind = kind;
      }
    }
  }

  return options;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
