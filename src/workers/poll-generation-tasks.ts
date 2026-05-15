import { syncPendingGenerationTasks } from "@/features/generation/generation-sync";
import { syncPendingFortuneTasks } from "@/features/fortune/fortune-sync";

export async function pollGenerationTasks(batchSize = 20) {
  const [portrait, fortune] = await Promise.all([
    syncPendingGenerationTasks({ batchSize }),
    syncPendingFortuneTasks({ batchSize }),
  ]);

  return { portrait, fortune };
}

if (process.env.RUN_WORKER_ONCE === "true") {
  pollGenerationTasks()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
