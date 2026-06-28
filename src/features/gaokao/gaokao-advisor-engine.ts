import { gaokaoProfileSchema } from "@/features/gaokao/gaokao-schemas";
import type { GaokaoProfile } from "@/features/gaokao/types";
import { config } from "@/lib/config";

export type GaokaoAdvisorResult = {
  reply: string;
  profilePatch: Partial<GaokaoProfile>;
  advisorNotes: string[];
};

function parseAdvisorResult(value: unknown): GaokaoAdvisorResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as {
    reply?: unknown;
    assistantMessage?: unknown;
    profilePatch?: unknown;
    advisorNotes?: unknown;
  };
  const reply =
    typeof payload.reply === "string"
      ? payload.reply.trim()
      : typeof payload.assistantMessage === "string"
        ? payload.assistantMessage.trim()
        : "";

  if (!reply) {
    return null;
  }

  const profilePatch = gaokaoProfileSchema
    .partial()
    .safeParse(payload.profilePatch ?? {});
  const advisorNotes = Array.isArray(payload.advisorNotes)
    ? payload.advisorNotes
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    reply,
    profilePatch: profilePatch.success ? profilePatch.data : {},
    advisorNotes,
  };
}

export async function callGaokaoAdvisorEngine(input: {
  userMessage: string;
  profile: GaokaoProfile;
}): Promise<GaokaoAdvisorResult | null> {
  const baseUrl = config.GAOKAO_ADVISOR_BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.GAOKAO_ADVISOR_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${baseUrl}/gaokao/advisor`, {
      method: "POST",
      headers: {
        ...(config.GAOKAO_ADVISOR_API_KEY
          ? { authorization: `Bearer ${config.GAOKAO_ADVISOR_API_KEY}` }
          : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: input.userMessage,
        profile: input.profile,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return parseAdvisorResult(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
