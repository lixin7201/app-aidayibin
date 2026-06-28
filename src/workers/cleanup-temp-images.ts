import { subHours } from "date-fns";

import { prisma } from "@/lib/db/prisma";
import { deleteImageUrlObject } from "@/lib/storage/image-storage";

export async function cleanupTempImages(retentionHours = 24) {
  const cutoff = subHours(new Date(), retentionHours);
  const tasks = await prisma.generationTask.findMany({
    where: {
      status: { in: ["succeeded", "failed", "canceled"] },
      completed_at: { lt: cutoff },
    },
    select: {
      id: true,
      temp_input_urls: true,
    },
    take: 100,
  });

  for (const task of tasks) {
    if (Array.isArray(task.temp_input_urls) && task.temp_input_urls.length > 0) {
      // 先删除 R2 上的临时对象
      for (const url of task.temp_input_urls) {
        if (typeof url !== "string") continue;
        try {
          await deleteImageUrlObject({ url });
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
    select: {
      id: true,
      temp_input_urls: true,
    },
    take: 100,
  });

  for (const task of fortuneTasks) {
    if (Array.isArray(task.temp_input_urls) && task.temp_input_urls.length > 0) {
      for (const url of task.temp_input_urls) {
        if (typeof url !== "string") continue;
        try {
          await deleteImageUrlObject({ url });
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
