export type GaokaoSubjectType = "物理类" | "历史类";

export type GaokaoRiskPreference = "aggressive" | "balanced" | "safe";

export type GaokaoProfile = {
  province: "四川";
  examYear: 2026;
  subjectType: GaokaoSubjectType | null;
  score: number | null;
  rank: number | null;
  batch: string | null;
  preferredMajors: string[];
  rejectedMajors: string[];
  preferredCities: string[];
  rejectedCities: string[];
  riskPreference: GaokaoRiskPreference;
  tuitionLimit: number | null;
  acceptPrivate: boolean | null;
  acceptSinoForeign: boolean | null;
  acceptAdjustment: boolean | null;
  notes: string | null;
};

export type GaokaoRecommendationItem = {
  id: string;
  schoolName: string;
  majorName: string | null;
  year: number;
  subjectType: GaokaoSubjectType;
  batch: string | null;
  score: number | null;
  rank: number | null;
  quota: number | null;
  rankGap: number | null;
  riskLabel: string;
  reason: string;
};

export type GaokaoRecommendationBucket = "chong" | "wen" | "bao";

export type GaokaoRecommendations = Record<
  GaokaoRecommendationBucket,
  GaokaoRecommendationItem[]
>;

export type GaokaoDataStatus = {
  province: "四川";
  importedCount: number;
  sourceCount: number;
  batchLineCount: number;
  scoreSegmentCount: number;
  years: number[];
  missingSichuanData: boolean;
};

export type GaokaoReportListItem = {
  id: string;
  title: string;
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
  summary: string;
  createdAt: string;
  sharePageUrl: string;
};

export function createEmptyGaokaoProfile(): GaokaoProfile {
  return {
    province: "四川",
    examYear: 2026,
    subjectType: null,
    score: null,
    rank: null,
    batch: null,
    preferredMajors: [],
    rejectedMajors: [],
    preferredCities: [],
    rejectedCities: [],
    riskPreference: "balanced",
    tuitionLimit: null,
    acceptPrivate: null,
    acceptSinoForeign: null,
    acceptAdjustment: null,
    notes: null,
  };
}

export function getRiskPreferenceLabel(value: GaokaoRiskPreference) {
  if (value === "aggressive") {
    return "偏冲";
  }

  if (value === "safe") {
    return "稳妥";
  }

  return "均衡";
}
