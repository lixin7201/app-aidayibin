import { describe, expect, it } from "vitest";

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

  it("defines the v3 69-question bank and serves 13 adaptive questions", () => {
    expect(lifeTestQuestionBank.length).toBe(69);
    expect(lifeTestQuestions).toHaveLength(lifeTestQuestionCount);

    for (const question of lifeTestQuestionBank) {
      expect(question.eventKey).toBeTruthy();
      expect(question.sceneType).toBe(question.branch);
      expect(question.evidenceKey).toBeTruthy();
      expect(question.feedback).toBeTruthy();
      expect(question.options).toHaveLength(4);
      expect(question.options.at(-1)?.isEscape).toBe(true);

      for (const option of question.options) {
        expect(option.evidenceText).toContain(option.text);
      }
    }
  });

  it("keeps the full question bank and result copy in the v2 plain-spoken style", () => {
    const blockedFragments = [
      "系统提示",
      "系统",
      "朋友们",
      "人生",
      "人设",
      "定义",
      "没平仄",
      "恢复出厂",
      "开小会",
      "小剧场",
      "OS",
      "上线",
      "加载",
      "说明书",
      "压力锅",
      "逃生路线",
      "静音模式",
      "脑内",
      "命运",
      "灵魂",
      "回血",
      "本体",
      "待办",
      "皮肤",
      "营业",
      "雷达",
      "警报",
      "样本研究",
      "云端文件",
      "城市级散热",
      "人类体验卡",
      "低速格式化",
      "方向正在摆龙门阵",
      "凑合精确",
      "精神地图",
      "隐藏题库",
      "检测值",
      "需求自由繁殖",
      "情绪有个碳水",
      "画进锅里",
      "五粮液味",
      "社交任务",
      "国家大事",
      "是否做人",
      "隐身模式",
      "人类连接",
      "反向协商",
      "防空洞",
      "反向开朗",
      "灰度发布",
      "PDF",
      "CPU",
      "自动",
      "爪子",
      "重启",
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
    for (const result of Object.values(lifeTestResults)) {
      expect(Array.from(result.analysisBody).length).toBeGreaterThanOrEqual(250);
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

  it("uses the clearer v3 copy for the core launch questions", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);

    expect(coreQuestions.map((question) => question.title)).toEqual([
      "刚到家，工作群弹出一句“方便改一下吗？”你一般会怎么回？",
      "你刷到一个宜宾本地岗位，工资看起还行，但要求写了很多。",
      "红娘问你“想找什么样的人”，你最先想到的是：",
      "饭局上大家开始轮流讲近况，马上轮到你。",
      "周末终于空一天，你最想怎么过？",
    ]);
    expect(coreQuestions.flatMap((question) => question.options.map((option) => option.text)))
      .not.toContain("没平仄，看今天班味浓不浓。");
    expect(coreQuestions.every((question) => !question.feedback.startsWith("系统提示")))
      .toBe(true);
  });

  it("switches the later question branch from early answers", () => {
    const coreQuestions = buildLifeTestQuestionFlow().slice(0, 5);
    const jobAnswers = coreQuestions.map((question) => ({
      questionId: question.id,
      optionId: "c",
    }));
    const escapeAnswers = coreQuestions.map((question) => ({
      questionId: question.id,
      optionId: "d",
    }));

    expect(buildLifeTestQuestionFlow(jobAnswers)[5].branch).toBe("job");
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
