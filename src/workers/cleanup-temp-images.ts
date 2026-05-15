import { subHours } from "date-fns";

import { isMissingFortuneTableError } from "@/features/fortune/fortune-db";
import { requireSupabaseAdmin } from "@/lib/db/supabase";

export async function cleanupTempImages(retentionHours = 24) {
  const supabase = requireSupabaseAdmin();
  const cutoff = subHours(new Date(), retentionHours).toISOString();
  const { data: tasks, error } = await supabase
    .from("generation_tasks")
    .select("id,temp_input_urls")
    .in("status", ["succeeded", "failed", "canceled"])
    .lt("completed_at", cutoff)
    .not("temp_input_urls", "eq", "{}")
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  for (const task of tasks ?? []) {
    await supabase
      .from("generation_tasks")
      .update({ temp_input_urls: [] })
      .eq("id", task.id);
  }

  const { data: fortuneTasks, error: fortuneError } = await supabase
    .from("fortune_generation_tasks")
    .select("id,temp_input_urls")
    .in("status", ["succeeded", "failed", "canceled"])
    .lt("completed_at", cutoff)
    .not("temp_input_urls", "eq", "{}")
    .limit(100);

  if (fortuneError) {
    if (isMissingFortuneTableError(fortuneError)) {
      return {
        cleaned: tasks?.length ?? 0,
        fortuneCleaned: 0,
      };
    }

    throw new Error(fortuneError.message);
  }

  for (const task of fortuneTasks ?? []) {
    await supabase
      .from("fortune_generation_tasks")
      .update({ temp_input_urls: [] })
      .eq("id", task.id);
  }

  return {
    cleaned: tasks?.length ?? 0,
    fortuneCleaned: fortuneTasks?.length ?? 0,
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
