export type LifeTestCareerAxis = "stable" | "growth";
export type LifeTestLoveAxis = "slow" | "open";
export type LifeTestPaceAxis = "soft" | "fast";
export type LifeTestDecisionAxis = "real" | "feel";

export type LifeTestResultCode =
  `${LifeTestCareerAxis}-${LifeTestLoveAxis}-${LifeTestPaceAxis}-${LifeTestDecisionAxis}`;

export type LifeTestScoreKey =
  | "careerStable"
  | "careerGrowth"
  | "loveSlow"
  | "loveOpen"
  | "paceSoft"
  | "paceFast"
  | "decisionReal"
  | "decisionFeel";

export type LifeTestScores = Record<LifeTestScoreKey, number>;

export type LifeTestQuestionBranch =
  | "core"
  | "work"
  | "job"
  | "love"
  | "social"
  | "recovery"
  | "antiRoutine"
  | "local"
  | "final";

export type LifeTestBranchScoreKey =
  | "workFlavor"
  | "jobRadar"
  | "loveBrain"
  | "socialBattery"
  | "recoveryNeed"
  | "antiRoutine"
  | "localFlavor";

export type LifeTestAxes = {
  career: LifeTestCareerAxis;
  love: LifeTestLoveAxis;
  pace: LifeTestPaceAxis;
  decision: LifeTestDecisionAxis;
};

export type LifeTestAnswer = {
  questionId: string;
  optionId: string;
};

export type LifeTestQuestionOption = {
  id: string;
  label: string;
  text: string;
  evidenceText: string;
  scores: Partial<LifeTestScores>;
  branchScores?: Partial<Record<LifeTestBranchScoreKey, number>>;
  isEscape?: boolean;
};

export type LifeTestQuestion = {
  id: string;
  branch: LifeTestQuestionBranch;
  eventKey: string;
  sceneType: LifeTestQuestionBranch;
  evidenceKey: string;
  title: string;
  feedback: string;
  options: LifeTestQuestionOption[];
  tags?: string[];
};

export type LifeTestScoreResult = {
  scores: LifeTestScores;
  axes: LifeTestAxes;
  resultCode: LifeTestResultCode;
  tieBroken: boolean;
  hiddenTag: string | null;
};

export type LifeTestResultType = {
  code: LifeTestResultCode;
  name: string;
  slogan: string;
  keywords: string[];
  citySymbol: string;
  careerTitle: string;
  careerAdvice: string;
  loveTitle: string;
  loveAdvice: string;
  lifeAdvice: string;
  analysisTitle: string;
  analysisBody: string;
  comfortZone: string;
  blindSpot: string;
  todayAdvice: string;
  evidenceFallbacks: string[];
  posterTitle: string;
  posterSubtitle: string;
  posterTags: string[];
  posterInsightLines: [string, string];
  posterSealText: string;
  jobCtaText: string;
  jobCtaUrl: string;
  matchCtaText: string;
  matchCtaUrl: string;
  shareText: string;
  posterBaseImageUrl: string;
  imagePrompt: string;
};

export type LifeTestSessionPayload = {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  campaignId: string | null;
  entryScene: string | null;
  channel: string | null;
  regionCode: string | null;
  shareCode: string | null;
  referrerSessionId: string | null;
  status: string;
  answers: LifeTestAnswer[];
  score: LifeTestScoreResult | null;
  result: LifeTestResultType | null;
  createdAt: string;
  completedAt: string | null;
  repeatHigh: boolean;
};
