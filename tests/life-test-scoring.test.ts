import { describe, expect, it } from "vitest";

import {
  buildLifeTestQuestionFlow,
  getLifeTestEscapeState,
  lifeTestQuestionBank,
  lifeTestQuestionCount,
  lifeTestQuestions,
} from "@/features/life-test/config/questions";
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

  it("defines an 80+ question bank and serves 13 adaptive questions", () => {
    expect(lifeTestQuestionBank.length).toBeGreaterThanOrEqual(80);
    expect(lifeTestQuestions).toHaveLength(lifeTestQuestionCount);

    for (const question of lifeTestQuestionBank) {
      expect(question.feedback).toBeTruthy();
      expect(question.options).toHaveLength(4);
      expect(question.options.at(-1)?.isEscape).toBe(true);
    }
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

    expect(result.hiddenTag).toBe("宜宾隐藏款：不接受定义，但接受好耍");
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
        title: "one",
        feedback: "one",
        options: [
          {
            id: "a",
            label: "A",
            text: "stable",
            scores: { careerStable: 2 },
          },
        ],
      },
      {
        id: "two",
        branch: "core",
        title: "two",
        feedback: "two",
        options: [
          {
            id: "b",
            label: "B",
            text: "growth",
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
        title: "one",
        feedback: "one",
        options: [{ id: "a", label: "A", text: "neutral", scores: {} }],
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
