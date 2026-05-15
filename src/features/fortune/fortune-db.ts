export function isMissingFortuneTableError(
  error: { code?: string; message?: string } | null | undefined,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42P01" ||
    (error.message?.includes("fortune_generation_tasks") &&
      (error.message.includes("schema cache") ||
        error.message.includes("does not exist")))
  );
}
