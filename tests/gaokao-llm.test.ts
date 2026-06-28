import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  config: {},
}));

import { generateGaokaoAssistantReply } from "@/features/gaokao/gaokao-llm";
import { mergeGaokaoProfile } from "@/features/gaokao/gaokao-profile";
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

  it("uses direct advisor tone without naming external people or making promises", async () => {
    const profile = mergeGaokaoProfile(
      undefined,
      "物理类560分，按张雪峰那种风格直给，科技城市，好找工作，但不要保证录取。",
    );
    const reply = await generateGaokaoAssistantReply({
      userMessage: "按这种风格直给",
      profile,
      fallbackQuestion: "再确认一下能不能接受民办和中外合作。",
    });

    expect(reply).toContain("直给");
    expect(reply).toContain("就业导向");
    expect(reply).not.toContain("张雪峰");
    expect(reply).not.toContain("保证录取");
  });
});
