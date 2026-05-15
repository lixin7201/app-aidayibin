import { describe, expect, it } from "vitest";

import {
  buildFortunePrompt,
  fortuneNegativePrompt,
} from "@/features/fortune/fortune-prompts";

describe("fortune prompts", () => {
  it("builds a palm prompt that keeps professional palmistry sections while requiring concrete life events", () => {
    const prompt = buildFortunePrompt("palm");

    expect(prompt).toContain("根据这只手的手掌、掌纹、掌丘、手型和指形");
    expect(prompt).toContain("推测这个人一生的命运走势");
    expect(prompt).toContain("像把原照片中的手掌抠出来放进报告图里");
    expect(prompt).toContain("固定的专业栏目");
    expect(prompt).toContain("生命线：根基与早年起伏");
    expect(prompt).toContain("智慧线：性格与选择方式");
    expect(prompt).toContain("感情线：亲密关系与人际模式");
    expect(prompt).toContain("事业线：事业节点与中年走势");
    expect(prompt).toContain("30 岁以前可能经历过方向摇摆");
    expect(prompt).toContain("30 岁前可能遇到的阻力");
    expect(prompt).toContain("每张卡片至少出现 1 个具体年龄点或阶段");
    expect(prompt).toContain("每张卡片至少出现 1 个具体事件类型");
    expect(prompt).toContain("每张卡片至少出现 1 个掌纹依据");
    expect(prompt).not.toContain("不能固定成“生命线 / 智慧线 / 感情线”");
    expect(prompt).not.toContain("9–12 个关键分析点");
  });

  it("keeps face prompt available while face entry is hidden from public UI", () => {
    const prompt = buildFortunePrompt("face");

    expect(prompt).toContain("面部照片");
    expect(prompt).toContain("东方面相趋势观察报告图");
    expect(prompt.length).toBeGreaterThan(200);
  });

  it("blocks common palm image hallucinations in the negative prompt", () => {
    expect(fortuneNegativePrompt).toContain("六根手指");
    expect(fortuneNegativePrompt).toContain("额外手指");
    expect(fortuneNegativePrompt).toContain("错误左右手");
    expect(fortuneNegativePrompt).toContain("虚构掌纹");
    expect(fortuneNegativePrompt).toContain("重绘手掌");
  });
});
