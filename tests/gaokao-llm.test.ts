import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  config: {},
}));

import { generateGaokaoAssistantReply } from "@/features/gaokao/gaokao-llm";
import { createEmptyGaokaoProfile } from "@/features/gaokao/types";

describe("gaokao llm fallback", () => {
  it("uses hidden auto-filled rank without showing the exact rank in chat", async () => {
    const reply = await generateGaokaoAssistantReply({
      userMessage: "历史类548分",
      profile: {
        ...createEmptyGaokaoProfile(),
        studentName: "王同学",
        firstChoiceSubject: "历史",
        subjectType: "历史类",
        score: 548,
        rank: 19646,
      },
      fallbackQuestion: "再说一下专业和城市偏好。",
    });

    expect(reply).toContain("系统定位的位次");
    expect(reply).not.toContain("19646");
  });
});
