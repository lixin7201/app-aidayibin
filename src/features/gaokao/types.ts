export type GaokaoSubjectType = "物理类" | "历史类";

export type GaokaoRiskPreference = "aggressive" | "balanced" | "safe";

export type GaokaoFirstChoiceSubject = "物理" | "历史";

export type GaokaoOptionalSubject = "化学" | "生物" | "思想政治" | "地理";

export type GaokaoDistancePreference =
  | "near_home"
  | "far_from_home"
  | "province_outside";

export type GaokaoLocationStrictness = "hard" | "soft";

export type GaokaoProfile = {
  province: "四川";
  examYear: 2026;
  studentName: string | null;
  firstChoiceSubject: GaokaoFirstChoiceSubject | null;
  optionalSubjects: GaokaoOptionalSubject[];
  subjectType: GaokaoSubjectType | null;
  score: number | null;
  rank: number | null;
  batch: string | null;
  preferredMajors: string[];
  rejectedMajors: string[];
  preferredCities: string[];
  rejectedCities: string[];
  preferredRegions: string[];
  rejectedRegions: string[];
  preferredSchoolProvinces: string[];
  rejectedSchoolProvinces: string[];
  preferredSchoolCities: string[];
  rejectedSchoolCities: string[];
  distancePreference: GaokaoDistancePreference | null;
  locationStrictness: GaokaoLocationStrictness;
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
  schoolProvince?: string | null;
  schoolCity?: string | null;
  majorSuggestions?: GaokaoMajorSuggestion[];
};

export type GaokaoMajorSuggestion = {
  majorName: string;
  majorNote: string | null;
  subjectRequirement: string | null;
  planCount: number | null;
  tuition: number | null;
  duration: string | null;
  estimatedRank: number | null;
  previousRank: number | null;
  groupRank: number | null;
  fitReason: string;
  riskNote: string | null;
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
  shareImageUrl: string;
};

export type GaokaoGenerationStatus = {
  totalReports: number;
  activeReports: number;
  deletedReports: number;
  canGenerate: boolean;
  isUnlimitedTestUser: boolean;
  message: string;
};

export function createEmptyGaokaoProfile(): GaokaoProfile {
  return {
    province: "四川",
    examYear: 2026,
    studentName: null,
    firstChoiceSubject: null,
    optionalSubjects: [],
    subjectType: null,
    score: null,
    rank: null,
    batch: null,
    preferredMajors: [],
    rejectedMajors: [],
    preferredCities: [],
    rejectedCities: [],
    preferredRegions: [],
    rejectedRegions: [],
    preferredSchoolProvinces: [],
    rejectedSchoolProvinces: [],
    preferredSchoolCities: [],
    rejectedSchoolCities: [],
    distancePreference: null,
    locationStrictness: "soft",
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
