import { getStoredSessionFromCookies } from "@/features/auth/session";
import { LifeTestApp } from "@/features/life-test/components/life-test-app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LifeTestPlayPage() {
  const user = await getStoredSessionFromCookies();

  return (
    <LifeTestApp
      mode="play"
      currentUser={
        user ? { nickname: user.nickname, avatarUrl: user.avatarUrl } : null
      }
    />
  );
}
