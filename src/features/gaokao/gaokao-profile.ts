import { applyGaokaoAdvisorCases } from "@/features/gaokao/gaokao-advisor-cases";
import {
  createEmptyGaokaoProfile,
  type GaokaoFirstChoiceSubject,
  type GaokaoOptionalSubject,
  type GaokaoProfile,
  type GaokaoRiskPreference,
  type GaokaoSubjectType,
} from "@/features/gaokao/types";

const majorKeywords = [
  "计算机",
  "软件",
  "人工智能",
  "电子",
  "通信",
  "电气",
  "自动化",
  "临床",
  "口腔",
  "医学",
  "法学",
  "会计",
  "财务",
  "师范",
  "汉语言",
  "新闻",
  "土木",
  "机械",
  "车辆",
  "金融",
  "经济",
  "护理",
  "药学",
  "建筑",
  "数学",
  "物理",
  "化学",
  "生物",
  "农学",
];

const cityKeywords = [
  "成都",
  "重庆",
  "宜宾",
  "绵阳",
  "德阳",
  "南充",
  "泸州",
  "乐山",
  "自贡",
  "雅安",
  "西昌",
  "遂宁",
  "内江",
  "达州",
  "北京",
  "上海",
  "广州",
  "深圳",
  "沈阳",
  "大连",
  "长春",
  "哈尔滨",
  "天津",
  "石家庄",
  "太原",
  "杭州",
  "南京",
  "苏州",
  "合肥",
  "济南",
  "青岛",
  "厦门",
  "福州",
  "武汉",
  "长沙",
  "郑州",
  "珠海",
  "佛山",
  "昆明",
  "贵阳",
  "西安",
  "兰州",
  "银川",
  "乌鲁木齐",
];

const regionProvinceMap = {
  东北: ["辽宁", "吉林", "黑龙江"],
  华北: ["北京", "天津", "河北", "山西", "内蒙古"],
  华东: ["上海", "江苏", "浙江", "安徽", "福建", "江西", "山东"],
  华中: ["河南", "湖北", "湖南"],
  华南: ["广东", "广西", "海南"],
  西南: ["重庆", "四川", "贵州", "云南", "西藏"],
  西北: ["陕西", "甘肃", "青海", "宁夏", "新疆"],
} as const;

const regionKeywords = Object.keys(regionProvinceMap);
const provinceKeywords = Array.from(new Set(Object.values(regionProvinceMap).flat()));

export function getGaokaoRegionProvinces(region: string): string[] {
  return [...(regionProvinceMap[region as keyof typeof regionProvinceMap] ?? [])];
}

const optionalSubjectKeywords: GaokaoOptionalSubject[] = [
  "化学",
  "生物",
  "思想政治",
  "地理",
];

function messageIncludesOptionalSubject(
  message: string,
  subject: GaokaoOptionalSubject,
) {
  if (subject === "思想政治") {
    return /(?:^|[+＋、，,和\s])(?:思想政治|政治)(?:$|[+＋、，,和\s])/.test(message);
  }

  return message.includes(subject);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function parseNumber(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/[,\s，]/g, "");
  if (/万/.test(normalized)) {
    const value = Number(normalized.replace(/万.*/, ""));
    return Number.isFinite(value) ? Math.round(value * 10_000) : null;
  }

  const value = Number(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? Math.round(value) : null;
}

function mergeBoolean(current: boolean | null | undefined, next: boolean | null) {
  return next === null ? current ?? null : next;
}

function inferSubjectType(text: string): GaokaoSubjectType | null {
  if (/历史|文科|首选历史/.test(text)) {
    return "历史类";
  }

  if (/物理|理科|首选物理/.test(text)) {
    return "物理类";
  }

  return null;
}

function inferFirstChoiceSubject(text: string): GaokaoFirstChoiceSubject | null {
  if (/历史|文科|首选历史/.test(text)) {
    return "历史";
  }

  if (/物理|理科|首选物理/.test(text)) {
    return "物理";
  }

  return null;
}

function toSubjectType(firstChoiceSubject: GaokaoFirstChoiceSubject | null) {
  if (firstChoiceSubject === "历史") {
    return "历史类";
  }

  if (firstChoiceSubject === "物理") {
    return "物理类";
  }

  return null;
}

function inferRiskPreference(text: string): GaokaoRiskPreference | null {
  if (/冲|激进|好学校|名校|985|211/.test(text)) {
    return "aggressive";
  }

  if (/稳|保守|稳妥|别滑档|不冒险/.test(text)) {
    return "safe";
  }

  if (/均衡|都看看|折中/.test(text)) {
    return "balanced";
  }

  return null;
}

function inferScore(text: string) {
  const match =
    text.match(/(?:高考|考了|分数|成绩)?\s*([1-7]\d{2})\s*分/) ??
    text.match(/(?:^|[^\d])([1-7]\d{2})(?:$|[^\d])/);
  return parseNumber(match?.[1]);
}

function inferRank(text: string) {
  const match =
    text.match(/(?:位次|排名|排位|全省)\D*([\d,，.]+万?)/) ??
    text.match(/([\d,，.]+万?)\s*(?:名|位)/);
  return parseNumber(match?.[1]);
}

function inferTuitionLimit(text: string) {
  const match = text.match(/(?:学费|预算|一年)\D*([\d.]+万?)/);
  return parseNumber(match?.[1]);
}

function inferStudentName(text: string) {
  const match = text.match(/(?:我叫|姓名是|名字叫|学生叫)\s*([\u4e00-\u9fa5A-Za-z]{2,20})/);
  return match?.[1] ?? null;
}

function inferAccepted(text: string, positive: RegExp, negative: RegExp) {
  if (negative.test(text)) {
    return false;
  }

  if (positive.test(text)) {
    return true;
  }

  return null;
}

function rejectsKeyword(text: string, keyword: string) {
  return new RegExp(
    `不想[^，。,.；;]*${keyword}|不要[^，。,.；;]*${keyword}|不去[^，。,.；;]*${keyword}|不留[^，。,.；;]*${keyword}|排除[^，。,.；;]*${keyword}|远离[^，。,.；;]*${keyword}|${keyword}[^，。,.；;]*(不要|不去|不考虑|先不考虑)`,
  ).test(text);
}

function prefersKeyword(text: string, keyword: string) {
  return text.includes(keyword) && !rejectsKeyword(text, keyword);
}

function prefersProvince(text: string, province: string) {
  if (!prefersKeyword(text, province)) {
    return false;
  }

  if (province === "四川" && /四川(物理类|历史类|考生|高考|省考生)/.test(text)) {
    return /四川(学校|院校|省内|本地|周边|优先|也可以|可以)|留四川|去四川|在四川/.test(text);
  }

  return new RegExp(
    `${province}(学校|院校|省内|本地|周边|优先|也可以|可以)|留${province}|去${province}|在${province}`,
  ).test(text);
}

function prefersMajor(text: string, major: string) {
  if (!text.includes(major)) {
    return false;
  }

  if (["物理", "化学", "生物"].includes(major)) {
    return new RegExp(`(想学|学|专业|方向|喜欢|优先|考虑)[^，。,.；;]*${major}|${major}[^，。,.；;]*(专业|方向|优先)`).test(text);
  }

  return true;
}

function inferLocationPreference(text: string) {
  const allowSichuan = /不排除四川|不拒绝四川|不限制四川|四川也可以|四川可以|可以四川/.test(text);
  const provinceOutside = /省外|远离四川|不想留四川|不要留四川|不留四川|不要四川学校|不去四川/.test(text);
  const hardProvinceOutside = /远离四川|不想留四川|不要留四川|不留四川|不要四川学校|不去四川|只看省外|必须省外/.test(text);
  const farFromHome = /离家远|远一点|远离原生家庭|逃离家里|想出去/.test(text);
  const nearHome = /离家近|近一点|省内|离宜宾近/.test(text);
  const hardOnlyRegion = regionKeywords.some((region) =>
    new RegExp(`只看${region}|只要${region}|必须${region}|${region}[^，。,.；;]*(其他地方|其他省份|别的地方).*(不要|不考虑)`).test(text),
  );
  const rejectedRegions = regionKeywords.filter((region) => rejectsKeyword(text, region));
  const preferredRegions = regionKeywords.filter((region) => prefersKeyword(text, region));
  const rejectedSchoolProvinces = provinceKeywords.filter((province) =>
    rejectsKeyword(text, province),
  );
  const preferredSchoolProvinces = provinceKeywords.filter((province) =>
    prefersProvince(text, province),
  );
  const rejectedSchoolCities = cityKeywords.filter((city) => rejectsKeyword(text, city));
  const preferredSchoolCities = cityKeywords.filter((city) => prefersKeyword(text, city));

  if ((hardProvinceOutside || farFromHome) && !allowSichuan) {
    rejectedSchoolProvinces.push("四川");
  }

  const hasLocationHit = Boolean(
    provinceOutside ||
      farFromHome ||
      nearHome ||
      preferredRegions.length ||
      rejectedRegions.length ||
      preferredSchoolProvinces.length ||
      rejectedSchoolProvinces.length ||
      preferredSchoolCities.length ||
      rejectedSchoolCities.length,
  );

  return {
    allowSichuan,
    preferredRegions,
    rejectedRegions,
    preferredSchoolProvinces,
    rejectedSchoolProvinces,
    preferredSchoolCities,
    rejectedSchoolCities,
    distancePreference: provinceOutside
      ? "province_outside" as const
      : farFromHome
        ? "far_from_home" as const
        : nearHome
          ? "near_home" as const
          : null,
    locationStrictness:
      hasLocationHit &&
      (hardOnlyRegion ||
        hardProvinceOutside ||
        farFromHome ||
        rejectedRegions.length > 0 ||
        rejectedSchoolProvinces.length > 0 ||
        rejectedSchoolCities.length > 0 ||
        /只看省内|只要省内|必须省内/.test(text))
        ? "hard" as const
        : null,
  };
}

function mergeNotes(current: string | null | undefined, message: string) {
  const notes = [current, message]
    .flatMap((item) => item?.split(/\n+/) ?? [])
    .map((item) =>
      item
        .replace(/张雪峰|张老师|峰哥/g, "直给顾问口吻")
        .replace(/保证录取|包录取|100%|百分百|一定能上/g, "录取承诺")
        .trim(),
    )
    .filter(Boolean);

  return Array.from(new Set(notes)).join("\n").slice(-1000) || null;
}

export function mergeGaokaoProfile(
  current: Partial<GaokaoProfile> | undefined,
  message: string,
): GaokaoProfile {
  const base = {
    ...createEmptyGaokaoProfile(),
    ...current,
  };
  const subjectType = inferSubjectType(message);
  const firstChoiceSubject = inferFirstChoiceSubject(message);
  const score = inferScore(message);
  const rank = inferRank(message);
  const tuitionLimit = inferTuitionLimit(message);
  const riskPreference = inferRiskPreference(message);
  const studentName = inferStudentName(message);
  const optionalSubjects = optionalSubjectKeywords.filter((subject) =>
    messageIncludesOptionalSubject(message, subject),
  );
  const preferredMajors = majorKeywords.filter((keyword) => prefersMajor(message, keyword));
  const locationPreference = inferLocationPreference(message);
  const preferredCities = cityKeywords.filter((city) => prefersKeyword(message, city));
  const rejectedMajors = majorKeywords.filter((keyword) =>
    new RegExp(`不想.*${keyword}|不要.*${keyword}|排除.*${keyword}`).test(message),
  );
  const rejectedCities = cityKeywords.filter((city) => rejectsKeyword(message, city));
  const baseRejectedSchoolProvinces = locationPreference.allowSichuan
    ? (base.rejectedSchoolProvinces ?? []).filter((province) => province !== "四川")
    : base.rejectedSchoolProvinces ?? [];

  const extractedProfile: GaokaoProfile = {
    ...base,
    province: "四川",
    examYear: 2026,
    studentName: studentName ?? base.studentName,
    firstChoiceSubject: firstChoiceSubject ?? base.firstChoiceSubject,
    optionalSubjects: unique([
      ...(base.optionalSubjects ?? []),
      ...optionalSubjects,
    ]) as GaokaoOptionalSubject[],
    subjectType:
      subjectType ??
      toSubjectType(firstChoiceSubject) ??
      base.subjectType,
    score: score ?? base.score,
    rank: rank ?? base.rank,
    batch:
      /本科/.test(message) ? "本科批" : /专科/.test(message) ? "专科批" : base.batch,
    preferredMajors: unique([
      ...(base.preferredMajors ?? []),
      ...preferredMajors,
    ]),
    rejectedMajors: unique([...(base.rejectedMajors ?? []), ...rejectedMajors]),
    preferredCities: unique([
      ...(base.preferredCities ?? []),
      ...preferredCities,
    ]),
    rejectedCities: unique([...(base.rejectedCities ?? []), ...rejectedCities]),
    preferredRegions: unique([
      ...(base.preferredRegions ?? []),
      ...locationPreference.preferredRegions,
    ]),
    rejectedRegions: unique([
      ...(base.rejectedRegions ?? []),
      ...locationPreference.rejectedRegions,
    ]),
    preferredSchoolProvinces: unique([
      ...(base.preferredSchoolProvinces ?? []),
      ...locationPreference.preferredSchoolProvinces,
    ]),
    rejectedSchoolProvinces: unique([
      ...baseRejectedSchoolProvinces,
      ...locationPreference.rejectedSchoolProvinces,
    ]),
    preferredSchoolCities: unique([
      ...(base.preferredSchoolCities ?? []),
      ...locationPreference.preferredSchoolCities,
    ]),
    rejectedSchoolCities: unique([
      ...(base.rejectedSchoolCities ?? []),
      ...locationPreference.rejectedSchoolCities,
    ]),
    distancePreference:
      locationPreference.allowSichuan
        ? null
        : locationPreference.distancePreference ?? base.distancePreference ?? null,
    locationStrictness:
      locationPreference.allowSichuan
        ? "soft"
        : locationPreference.locationStrictness ?? base.locationStrictness ?? "soft",
    riskPreference: riskPreference ?? base.riskPreference ?? "balanced",
    tuitionLimit: tuitionLimit ?? base.tuitionLimit,
    acceptPrivate: mergeBoolean(
      base.acceptPrivate,
      inferAccepted(
        message,
        /接受民办|可以民办|民办可以/,
        /不接受民办|不要民办|不考虑民办|不读民办|民办不行/,
      ),
    ),
    acceptSinoForeign: mergeBoolean(
      base.acceptSinoForeign,
      inferAccepted(
        message,
        /接受中外|可以中外|中外可以|接受合作办学|可以合作办学/,
        /不接受中外|不要中外|不考虑中外|不接受合作办学|不要合作办学/,
      ),
    ),
    acceptAdjustment: mergeBoolean(
      base.acceptAdjustment,
      inferAccepted(
        message,
        /接受调剂|可以调剂|服从调剂/,
        /不接受调剂|不要调剂|不服从/,
      ),
    ),
    notes: mergeNotes(base.notes, message),
  };

  return applyGaokaoAdvisorCases(extractedProfile, message).profile;
}

export function getMissingGaokaoFields(profile: GaokaoProfile) {
  const fields: string[] = [];

  if (!profile.subjectType) {
    fields.push("科类");
  }

  if (!profile.studentName) {
    fields.push("姓名");
  }

  if (!profile.score && !profile.rank) {
    fields.push("分数或位次");
  }

  return fields;
}

export function buildNextGaokaoQuestion(profile: GaokaoProfile) {
  const missing = getMissingGaokaoFields(profile);

  if (missing.includes("科类")) {
    return "先确认一个硬信息：你是四川物理类还是历史类？这个不说清楚，后面推荐就像拿错地图导航。";
  }

  if (missing.includes("姓名")) {
    return "再补一个姓名，用在报告和分享卡片上。放心，这里只做本次志愿初筛展示。";
  }

  if (missing.includes("分数或位次")) {
    return "把高考分数发我一下。知道全省位次也可以一起发，不知道的话我会按 2026 一分一段表自动补。";
  }

  if (profile.preferredMajors.length === 0) {
    return "成绩信息够了。接下来聊偏好：你更想优先专业、学校、城市，还是先保证录取？有没有明确想学或坚决不学的方向？";
  }

  return "信息基本齐了。我可以先按四川历史投档数据给你做冲稳保初筛，再把每档风险讲清楚。";
}
