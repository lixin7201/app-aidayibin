import { subHours } from "date-fns";

import { prisma } from "@/lib/db/prisma";
import { deleteObject } from "@/lib/storage/r2";

export async function cleanupTempImages(retentionHours = 24) {
  const cutoff = subHours(new Date(), retentionHours);
  const tasks = await prisma.generationTask.findMany({
    where: {
      status: { in: ["succeeded", "failed", "canceled"] },
      completed_at: { lt: cutoff },
    },
    select: { id: true, user_id: true, temp_input_urls: true },
    take: 100,
  });

  for (const task of tasks) {
    if (Array.isArray(task.temp_input_urls) && task.temp_input_urls.length > 0) {
      // 先删除 R2 上的临时对象
      for (const url of task.temp_input_urls) {
        if (typeof url !== "string") continue;
        try {
          const objectKey = extractObjectKeyFromUrl(url);
          if (objectKey) {
            await deleteObject(objectKey);
          }
        } catch (error) {
          console.warn(`Failed to delete temp image for task ${task.id}:`, error);
        }
      }

      await prisma.generationTask.update({
        where: { id: task.id },
        data: { temp_input_urls: [] },
      });
    }
  }

  const fortuneTasks = await prisma.fortuneGenerationTask.findMany({
    where: {
      status: { in: ["succeeded", "failed", "canceled"] },
      completed_at: { lt: cutoff },
    },
    select: { id: true, user_id: true, temp_input_urls: true },
    take: 100,
  });

  for (const task of fortuneTasks) {
    if (Array.isArray(task.temp_input_urls) && task.temp_input_urls.length > 0) {
      for (const url of task.temp_input_urls) {
        if (typeof url !== "string") continue;
        try {
          const objectKey = extractObjectKeyFromUrl(url);
          if (objectKey) {
            await deleteObject(objectKey);
          }
        } catch (error) {
          console.warn(`Failed to delete temp image for fortune task ${task.id}:`, error);
        }
      }

      await prisma.fortuneGenerationTask.update({
        where: { id: task.id },
        data: { temp_input_urls: [] },
      });
    }
  }

  return {
    cleaned: tasks.length,
    fortuneCleaned: fortuneTasks.length,
  };
}

function extractObjectKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // R2 public URL 格式: https://{account}.r2.cloudflarestorage.com/{bucket}/{objectKey}
    // 或自定义域名: https://cdn.example.com/{objectKey}
    // 我们只需要路径部分去掉开头的 /
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

if (process.env.RUN_WORKER_ONCE === "true") {
  cleanupTempImages()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
