import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  buildLifeTestQuestionFlow,
  getLifeTestEscapeState,
  isLifeTestMatchmakerSuppressed,
  lifeTestQuestionBank,
  lifeTestQuestionCount,
  lifeTestQuestions,
} from "@/features/life-test/config/questions";
import {
  defaultLifeTestCampaignId,
  normalizeLifeTestAttribution,
} from "@/features/life-test/life-test-attribution";
import { lifeTestResults } from "@/features/life-test/config/results";
import { renderLifeTestPosterJpeg } from "@/features/life-test/life-test-poster";
import {
  getLifeTestResultCode,
  scoreLifeTestAnswers,
} from "@/features/life-test/life-test-scoring";
import {
  escapeLifeTestCsvValue,
  validateLifeTestLeadContact,
} from "@/features/life-test/life-test-service";
import type {
  LifeTestAxes,
  LifeTestAnswer,
  LifeTestQuestion,
} from "@/features/life-test/types";

function answerAdaptiveFlow(optionId: string): LifeTestAnswer[] {
  const answers: LifeTestAnswer[] = [];

  for (let index = 0; index < lifeTestQuestionCount; index += 1) {
    const flow = buildLifeTestQuestionFlow(answers);
    answers.push({
      questionId: flow[index].id,
      optionId,
    });
  }

  return answers;
}

describe("life test scoring", () => {
  it("defines every 4-axis result combination", () => {
    const careers: LifeTestAxes["career"][] = ["stable", "growth"];
    const loves: LifeTestAxes["love"][] = ["slow", "open"];
    const paces: LifeTestAxes["pace"][] = ["soft", "fast"];
    const decisions: LifeTestAxes["decision"][] = ["real", "feel"];

    const codes = careers.flatMap((career) =>
      loves.flatMap((love) =>
        paces.flatMap((pace) =>
          decisions.map((decision) =>
            getLifeTestResultCode({ career, love, pace, decision }),
          ),
        ),
      ),
    );

    expect(codes).toHaveLength(16);
    expect(Object.keys(lifeTestResults).sort()).toEqual(codes.sort());
  });

  it("defines the v4 69-question bank and serves 13 adaptive questions", () => {
    expect(lifeTestQuestionBank.length).toBe(69);
    expect(lifeTestQuestions).toHaveLength(lifeTestQuestionCount);

    for (const question of lifeTestQuestionBank) {
      expect(question.eventKey).toBeTruthy();
      expect(question.sceneType).toBe(question.branch);
      expect(question.evidenceKey).toBeTruthy();
      expect(question.feedback).toBeTruthy();
      expect(question.tags?.length).toBeGreaterThanOrEqual(1);
      expect(question.options).toHaveLength(4);
      expect(question.options.at(-1)?.isEscape).toBe(true);

      for (const option of question.options) {
        expect(option.evidenceText).toBeTruthy();
        expect(option.evidenceText).not.toContain("你在“");
      }
    }

    expect(lifeTestQuestionBank.filter((question) => question.eventKey === question.id))
      .toEqual([]);
    expect(lifeTestQuestionBank.find((question) => question.id === "work-01")?.eventKey)
      .toBe("urgent_task_blame");
    expect(lifeTestQuestionBank.find((question) => question.id === "final-04")?.evidenceKey)
      .toBe("final:message_to_self");
    const firstQuestion = lifeTestQuestionBank.find((question) => question.id === "core-01");
    expect(firstQuestion).toMatchObject({
      eventKey: "after_hours_change",
      evidenceKey: "core:after_hours_change",
      tags: ["下班边界", "临时改动", "先说清楚", "今晚状态"],
      title: "刚下班进电梯，工作群又弹出一句“这个能不能今晚顺手改下？”你手已经摸到家门钥匙了，你会：",
      feedback: "这题不是测你懒不懒，是看你怎么守住下班后的边界。",
    });
    expect(firstQuestion?.options[0]).toMatchObject({
      text: "先问清楚改哪三处、今晚要不要交，不接糊涂活。",
      evidenceText: "你不是不愿意帮忙，是不想把模糊要求变成自己的锅。",
    });
  });

  it("does not repeat semantic events inside a generated question flow", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);

    for (const optionId of ["a", "b", "c", "d"]) {
      const answers = coreQuestions.map((question) => ({
        questionId: question.id,
        optionId,
      }));
      const flow = buildLifeTestQuestionFlow(answers);
      const eventKeys = flow.map((question) => question.eventKey);

      expect(new Set(eventKeys).size).toBe(flow.length);
      expect(flow.at(-1)?.id).toBe("final-04");
    }
  });

  it("keeps the full question bank and result copy away from banned old-topic fragments", () => {
    const blockedFragments = [
      "对红心",
      "不做人设",
      "人生哲无更新",
      "没平仄",
      "系统",
      "人生",
      "人设",
      "灵魂",
      "回血",
      "自动",
      "爪子",
      "哲学",
      "重启",
      "命运",
      "恋爱脑",
      "班味",
    ];
    const questionVisibleCopy = lifeTestQuestionBank.flatMap((question) => [
      `${question.id}:title:${question.title}`,
      `${question.id}:feedback:${question.feedback}`,
      ...question.options.map(
        (option) => `${question.id}:option-${option.id}:${option.text}`,
      ),
    ]);
    const resultVisibleCopy = Object.values(lifeTestResults).flatMap((result) => [
      `${result.code}:name:${result.name}`,
      `${result.code}:slogan:${result.slogan}`,
      `${result.code}:careerTitle:${result.careerTitle}`,
      `${result.code}:careerAdvice:${result.careerAdvice}`,
      `${result.code}:loveTitle:${result.loveTitle}`,
      `${result.code}:loveAdvice:${result.loveAdvice}`,
      `${result.code}:lifeAdvice:${result.lifeAdvice}`,
      `${result.code}:analysisTitle:${result.analysisTitle}`,
      `${result.code}:analysisBody:${result.analysisBody}`,
      `${result.code}:comfortZone:${result.comfortZone}`,
      `${result.code}:blindSpot:${result.blindSpot}`,
      `${result.code}:todayAdvice:${result.todayAdvice}`,
      `${result.code}:posterTitle:${result.posterTitle}`,
      `${result.code}:posterSubtitle:${result.posterSubtitle}`,
      `${result.code}:posterSealText:${result.posterSealText}`,
      `${result.code}:jobCtaText:${result.jobCtaText}`,
      `${result.code}:matchCtaText:${result.matchCtaText}`,
      `${result.code}:shareText:${result.shareText}`,
      ...result.keywords.map((keyword) => `${result.code}:keyword:${keyword}`),
      ...result.evidenceFallbacks.map((item) => `${result.code}:fallback:${item}`),
      ...result.posterTags.map((item) => `${result.code}:posterTag:${item}`),
      ...result.posterInsightLines.map((item) => `${result.code}:posterInsight:${item}`),
    ]);

    const badCopy = [...questionVisibleCopy, ...resultVisibleCopy].filter((text) =>
      blockedFragments.some((fragment) => text.includes(fragment)),
    );

    expect(badCopy).toEqual([]);
  });

  it("defines complete long-form result and poster copy for every result", () => {
    const analysisBodies = Object.values(lifeTestResults).map((result) => result.analysisBody);

    expect(new Set(analysisBodies).size).toBe(analysisBodies.length);

    for (const result of Object.values(lifeTestResults)) {
      expect(Array.from(result.analysisBody).length).toBeGreaterThanOrEqual(250);
      expect(result.analysisBody).not.toContain("这个结果，不是为了给你下结论");
      expect(result.comfortZone).toBeTruthy();
      expect(result.blindSpot).toBeTruthy();
      expect(result.todayAdvice).toBeTruthy();
      expect(result.evidenceFallbacks.length).toBeGreaterThanOrEqual(2);
      expect(result.posterTitle).toBeTruthy();
      expect(result.posterSubtitle).toBeTruthy();
      expect(result.posterTags).toHaveLength(3);
      expect(result.posterInsightLines).toHaveLength(2);
      expect(result.posterSealText).toBeTruthy();
    }
  });

  it("renders a share poster with a visible QR code area", async () => {
    const image = await renderLifeTestPosterJpeg({
      nickname: "测试用户",
      result: lifeTestResults["stable-slow-soft-real"],
      pageUrl: "https://www.aidayibin.com/ai/life-test/result/test-session",
    });
    const metadata = await sharp(image).metadata();

    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1536);

    const raw = await sharp(image).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = raw;
    let darkPixels = 0;

    for (let y = 338; y < 474; y += 1) {
      for (let x = 770; x < 906; x += 1) {
        const offset = (y * info.width + x) * info.channels;
        const red = data[offset] ?? 255;
        const green = data[offset + 1] ?? 255;
        const blue = data[offset + 2] ?? 255;

        if (red < 90 && green < 100 && blue < 100) {
          darkPixels += 1;
        }
      }
    }

    expect(darkPixels).toBeGreaterThan(1800);
  });

  it("uses dedicated option copy for every adaptive branch question", () => {
    const adaptiveBranches = [
      "work",
      "job",
      "love",
      "social",
      "recovery",
      "antiRoutine",
      "local",
    ];

    for (const branch of adaptiveBranches) {
      const branchQuestions = lifeTestQuestionBank.filter(
        (question) => question.branch === branch,
      );
      const optionSignatures = branchQuestions.map((question) =>
        question.options.map((option) => option.text).join("|"),
      );

      expect(new Set(optionSignatures).size).toBe(branchQuestions.length);
    }
  });

  it("uses the v4 copy for the core launch questions", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);

    expect(coreQuestions.map((question) => question.title)).toEqual([
      "刚下班进电梯，工作群又弹出一句“这个能不能今晚顺手改下？”你手已经摸到家门钥匙了，你会：",
      "刷到一个宜宾本地岗位，工资看起还行，地点也不远，但要求写了一长串。你第一反应是：",
      "红娘问你“想找什么样的人”，你脑壳里最先冒出来的是：",
      "周末你刚躺下，朋友突然喊你出去吃饭摆两句，你会：",
      "路上遇到熟人，对方笑起问“最近咋样嘛？”你最可能：",
    ]);
    expect(coreQuestions.flatMap((question) => question.options.map((option) => option.text)))
      .not.toContain("没平仄，看今天班味浓不浓。");
    expect(coreQuestions.every((question) => !question.feedback.startsWith("系统提示")))
      .toBe(true);
  });

  it("switches the later question branch from early answers", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);
    const workAnswers = coreQuestions.map((question) => ({
      questionId: question.id,
      optionId: "a",
    }));
    const escapeAnswers = coreQuestions.map((question) => ({
      questionId: question.id,
      optionId: "d",
    }));

    expect(buildLifeTestQuestionFlow(workAnswers)[5].branch).toBe("work");
    expect(buildLifeTestQuestionFlow(escapeAnswers)[5].branch).toBe("antiRoutine");
    expect(getLifeTestEscapeState(escapeAnswers).hiddenPrompt).toBe(true);
  });

  it("suppresses the matchmaker branch after the married or partnered answer", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);
    const answers = coreQuestions.map((question, index) => ({
      questionId: question.id,
      optionId: index === 2 ? "d" : "a",
    }));
    const laterBranches = buildLifeTestQuestionFlow(answers)
      .slice(5, -1)
      .map((question) => question.branch);

    expect(isLifeTestMatchmakerSuppressed(answers)).toBe(true);
    expect(laterBranches).not.toContain("love");
    expect(isLifeTestMatchmakerSuppressed([{ questionId: "love-04", optionId: "d" }]))
      .toBe(true);
  });

  it("scores the adaptive 13-question flow deterministically", () => {
    const answers = answerAdaptiveFlow("c");

    const first = scoreLifeTestAnswers(answers);
    const second = scoreLifeTestAnswers(answers);

    expect(second).toEqual(first);
    expect(lifeTestResults[first.resultCode].name).toBeTruthy();
  });

  it("routes repeated escape answers into the hidden result", () => {
    const answers = answerAdaptiveFlow("d");

    const result = scoreLifeTestAnswers(answers);

    expect(result.hiddenTag).toBe("宜宾隐藏款：不想被框住，但接受好耍");
    expect(result.resultCode).toBe("growth-open-fast-feel");
  });

  it("rejects missing answers", () => {
    expect(() => scoreLifeTestAnswers([])).toThrow("请完成全部题目");
  });

  it("rejects unknown option ids", () => {
    const answers = lifeTestQuestions.map((question) => ({
      questionId: question.id,
      optionId: "a",
    }));
    answers[0] = { questionId: lifeTestQuestions[0].id, optionId: "x" };

    expect(() => scoreLifeTestAnswers(answers)).toThrow("答案不完整");
  });

  it("uses the latest related answer to break ties", () => {
    const questions: LifeTestQuestion[] = [
      {
        id: "one",
        branch: "core",
        eventKey: "one",
        sceneType: "core",
        evidenceKey: "core:one",
        title: "one",
        feedback: "one",
        options: [
          {
            id: "a",
            label: "A",
            text: "stable",
            evidenceText: "stable",
            scores: { careerStable: 2 },
          },
        ],
      },
      {
        id: "two",
        branch: "core",
        eventKey: "two",
        sceneType: "core",
        evidenceKey: "core:two",
        title: "two",
        feedback: "two",
        options: [
          {
            id: "b",
            label: "B",
            text: "growth",
            evidenceText: "growth",
            scores: { careerGrowth: 2 },
          },
        ],
      },
    ];

    const result = scoreLifeTestAnswers(
      [
        { questionId: "one", optionId: "a" },
        { questionId: "two", optionId: "b" },
      ],
      questions,
    );

    expect(result.axes.career).toBe("growth");
    expect(result.tieBroken).toBe(true);
  });

  it("falls back to the shareable axis when a tie has no related recent answer", () => {
    const questions: LifeTestQuestion[] = [
      {
        id: "one",
        branch: "core",
        eventKey: "one",
        sceneType: "core",
        evidenceKey: "core:one",
        title: "one",
        feedback: "one",
        options: [{ id: "a", label: "A", text: "neutral", evidenceText: "neutral", scores: {} }],
      },
    ];

    const result = scoreLifeTestAnswers(
      [{ questionId: "one", optionId: "a" }],
      questions,
    );

    expect(result.resultCode).toBe("growth-open-fast-feel");
    expect(result.tieBroken).toBe(true);
  });
});

describe("life test attribution", () => {
  it("normalizes campaign and share attribution with safe defaults", () => {
    expect(
      normalizeLifeTestAttribution({
        channel: "wechat_group",
        regionCode: "cuiping",
        shareCode: " AbC123 ",
        referrerSessionId: "session-1",
      }),
    ).toEqual({
      source: "wechat_group",
      campaign: defaultLifeTestCampaignId,
      campaignId: defaultLifeTestCampaignId,
      entryScene: "share_landing",
      channel: "wechat_group",
      regionCode: "cuiping",
      shareCode: "AbC123",
      referrerSessionId: "session-1",
      posterVariant: null,
    });
  });
});

describe("life test admin export", () => {
  it("escapes CSV values that contain quotes and commas", () => {
    expect(escapeLifeTestCsvValue('宜宾"搭子,测试')).toBe(
      '"宜宾""搭子,测试"',
    );
    expect(escapeLifeTestCsvValue(null)).toBe('""');
  });
});

describe("life test lead contact validation", () => {
  it("requires at least one valid contact method", () => {
    expect(() => validateLifeTestLeadContact({})).toThrow("至少填写一个");
    expect(() =>
      validateLifeTestLeadContact({ mobile: "12345" }),
    ).toThrow("手机号格式不正确");
    expect(() =>
      validateLifeTestLeadContact({ wechat: "123456" }),
    ).toThrow("微信号格式不正确");

    expect(
      validateLifeTestLeadContact({ mobile: "13800138000", wechat: "dayibin_01" }),
    ).toEqual({ mobile: "13800138000", wechat: "dayibin_01" });
  });
});
