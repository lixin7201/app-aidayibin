type MysqlLockClient = {
  $queryRaw: <T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

type MysqlLockRow = {
  lock_status: number | string | bigint | null;
};

export async function acquireMysqlAdvisoryLock(
  client: MysqlLockClient,
  lockKey: string,
  timeoutSeconds = 5,
) {
  const rows = await client.$queryRaw<MysqlLockRow[]>`
    SELECT GET_LOCK(${lockKey}, ${timeoutSeconds}) as lock_status
  `;
  const status = rows[0]?.lock_status;

  return String(status) === "1";
}

export async function releaseMysqlAdvisoryLock(
  client: MysqlLockClient,
  lockKey: string,
) {
  await client.$queryRaw`SELECT RELEASE_LOCK(${lockKey})`;
}
