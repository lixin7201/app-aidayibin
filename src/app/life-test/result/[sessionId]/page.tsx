import { getStoredSessionFromCookies } from "@/features/auth/session";
import { LifeTestApp } from "@/features/life-test/components/life-test-app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function LifeTestResultPage({ params }: Props) {
  const [{ sessionId }, user] = await Promise.all([
    params,
    getStoredSessionFromCookies(),
  ]);

  return (
    <LifeTestApp
      mode="result"
      sessionId={sessionId}
      currentUser={
        user ? { nickname: user.nickname, avatarUrl: user.avatarUrl } : null
      }
    />
  );
}
