import {
  buildLifeTestQuestionFlow,
  getLifeTestEscapeState,
} from "@/features/life-test/config/questions";
import { lifeTestResults } from "@/features/life-test/config/results";
import type {
  LifeTestAnswer,
  LifeTestAxes,
  LifeTestQuestion,
  LifeTestResultCode,
  LifeTestScoreKey,
  LifeTestScoreResult,
  LifeTestScores,
} from "@/features/life-test/types";

const scoreKeys: LifeTestScoreKey[] = [
  "careerStable",
  "careerGrowth",
  "loveSlow",
  "loveOpen",
  "paceSoft",
  "paceFast",
  "decisionReal",
  "decisionFeel",
];

type AxisConfig<T extends string> = {
  left: LifeTestScoreKey;
  right: LifeTestScoreKey;
  leftValue: T;
  rightValue: T;
  fallback: T;
};

const axisConfigs = {
  career: {
    left: "careerStable",
    right: "careerGrowth",
    leftValue: "stable",
    rightValue: "growth",
    fallback: "growth",
  },
  love: {
    left: "loveSlow",
    right: "loveOpen",
    leftValue: "slow",
    rightValue: "open",
    fallback: "open",
  },
  pace: {
    left: "paceSoft",
    right: "paceFast",
    leftValue: "soft",
    rightValue: "fast",
    fallback: "fast",
  },
  decision: {
    left: "decisionReal",
    right: "decisionFeel",
    leftValue: "real",
    rightValue: "feel",
    fallback: "feel",
  },
} satisfies {
  career: AxisConfig<LifeTestAxes["career"]>;
  love: AxisConfig<LifeTestAxes["love"]>;
  pace: AxisConfig<LifeTestAxes["pace"]>;
  decision: AxisConfig<LifeTestAxes["decision"]>;
};

export function emptyLifeTestScores(): LifeTestScores {
  return Object.fromEntries(scoreKeys.map((key) => [key, 0])) as LifeTestScores;
}

export function getLifeTestResultCode(axes: LifeTestAxes): LifeTestResultCode {
  return `${axes.career}-${axes.love}-${axes.pace}-${axes.decision}`;
}

export function scoreLifeTestAnswers(
  answers: LifeTestAnswer[],
  questions: LifeTestQuestion[] = buildLifeTestQuestionFlow(answers),
): LifeTestScoreResult {
  if (answers.length !== questions.length) {
    throw new Error("请完成全部题目后再查看结果");
  }

  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scores = emptyLifeTestScores();
  const scoredOptions = questions.map((question) => {
    const answer = answersByQuestion.get(question.id);
    const option = question.options.find((item) => item.id === answer?.optionId);

    if (!answer || !option) {
      throw new Error("答案不完整，请重新选择");
    }

    for (const [key, value] of Object.entries(option.scores)) {
      scores[key as LifeTestScoreKey] += value ?? 0;
    }

    return { questionId: question.id, option };
  });

  let tieBroken = false;
  const axes = {
    career: resolveAxis(axisConfigs.career, scores, scoredOptions.slice(-3)),
    love: resolveAxis(axisConfigs.love, scores, scoredOptions.slice(-3)),
    pace: resolveAxis(axisConfigs.pace, scores, scoredOptions.slice(-3)),
    decision: resolveAxis(axisConfigs.decision, scores, scoredOptions.slice(-3)),
  };

  tieBroken = axes.career.tieBroken || axes.love.tieBroken || axes.pace.tieBroken || axes.decision.tieBroken;

  const resolvedAxes: LifeTestAxes = {
    career: axes.career.value,
    love: axes.love.value,
    pace: axes.pace.value,
    decision: axes.decision.value,
  };
  const escapeState = getLifeTestEscapeState(answers);
  const resultCode: LifeTestResultCode = escapeState.hiddenTag
    ? "growth-open-fast-feel"
    : getLifeTestResultCode(resolvedAxes);

  if (!lifeTestResults[resultCode]) {
    throw new Error("结果类型不存在");
  }

  return {
    scores,
    axes: resolvedAxes,
    resultCode,
    tieBroken,
    hiddenTag: escapeState.hiddenTag,
  };
}

function resolveAxis<T extends string>(
  config: AxisConfig<T>,
  scores: LifeTestScores,
  recentOptions: Array<{
    option: {
      scores: Partial<LifeTestScores>;
    };
  }>,
) {
  const leftScore = scores[config.left];
  const rightScore = scores[config.right];

  if (leftScore > rightScore) {
    return { value: config.leftValue, tieBroken: false };
  }

  if (rightScore > leftScore) {
    return { value: config.rightValue, tieBroken: false };
  }

  for (const item of [...recentOptions].reverse()) {
    const left = item.option.scores[config.left] ?? 0;
    const right = item.option.scores[config.right] ?? 0;

    if (left > right) {
      return { value: config.leftValue, tieBroken: true };
    }

    if (right > left) {
      return { value: config.rightValue, tieBroken: true };
    }
  }

  return { value: config.fallback, tieBroken: true };
}
