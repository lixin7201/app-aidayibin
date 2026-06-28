import type { GaokaoProfile } from "@/features/gaokao/types";

type AdvisorCasePatch =
  | Partial<GaokaoProfile>
  | ((profile: GaokaoProfile, message: string) => Partial<GaokaoProfile>);

type AdvisorCaseDefinition = {
  caseKey: string;
  patterns: RegExp[];
  profilePatch?: AdvisorCasePatch;
  note: string | ((profile: GaokaoProfile, message: string) => string);
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mergeNotes(current: string | null, notes: string[]) {
  const values = [current, ...notes]
    .flatMap((item) => item?.split(/\n+/) ?? [])
    .map((item) =>
      item
        .replace(/张雪峰|张老师|峰哥/g, "直给顾问口吻")
        .replace(/保证录取|包录取|100%|百分百|一定能上/g, "录取承诺")
        .trim(),
    )
    .filter(Boolean);

  return Array.from(new Set(values)).join("\n").slice(-1000) || null;
}

function mergePatch(profile: GaokaoProfile, patch: Partial<GaokaoProfile>) {
  return {
    ...profile,
    ...patch,
    preferredMajors: unique([
      ...profile.preferredMajors,
      ...(patch.preferredMajors ?? []),
    ]),
    rejectedMajors: unique([
      ...profile.rejectedMajors,
      ...(patch.rejectedMajors ?? []),
    ]),
    preferredCities: unique([
      ...profile.preferredCities,
      ...(patch.preferredCities ?? []),
    ]),
    rejectedCities: unique([
      ...profile.rejectedCities,
      ...(patch.rejectedCities ?? []),
    ]),
    preferredRegions: unique([
      ...profile.preferredRegions,
      ...(patch.preferredRegions ?? []),
    ]),
    rejectedRegions: unique([
      ...profile.rejectedRegions,
      ...(patch.rejectedRegions ?? []),
    ]),
    preferredSchoolProvinces: unique([
      ...profile.preferredSchoolProvinces,
      ...(patch.preferredSchoolProvinces ?? []),
    ]),
    rejectedSchoolProvinces: unique([
      ...profile.rejectedSchoolProvinces,
      ...(patch.rejectedSchoolProvinces ?? []),
    ]),
    preferredSchoolCities: unique([
      ...profile.preferredSchoolCities,
      ...(patch.preferredSchoolCities ?? []),
    ]),
    rejectedSchoolCities: unique([
      ...profile.rejectedSchoolCities,
      ...(patch.rejectedSchoolCities ?? []),
    ]),
    distancePreference: patch.distancePreference ?? profile.distancePreference,
    locationStrictness:
      profile.locationStrictness === "hard" && patch.locationStrictness === "soft"
        ? "hard"
        : patch.locationStrictness ?? profile.locationStrictness,
    riskPreference: patch.riskPreference ?? profile.riskPreference,
    tuitionLimit: patch.tuitionLimit ?? profile.tuitionLimit,
    acceptPrivate: patch.acceptPrivate ?? profile.acceptPrivate,
    acceptSinoForeign: patch.acceptSinoForeign ?? profile.acceptSinoForeign,
    acceptAdjustment: patch.acceptAdjustment ?? profile.acceptAdjustment,
    notes: profile.notes,
  };
}

const techCityPatch = {
  preferredSchoolCities: [
    "北京",
    "上海",
    "深圳",
    "广州",
    "杭州",
    "南京",
    "苏州",
    "武汉",
    "成都",
    "重庆",
    "西安",
  ],
  locationStrictness: "soft" as const,
};

const advisorCases: AdvisorCaseDefinition[] = [
  {
    caseKey: "location.near_home",
    patterns: [/离家近|近一点|省内|离宜宾近|离家不要太远/],
    profilePatch: {
      distancePreference: "near_home",
      preferredSchoolProvinces: ["四川", "重庆", "贵州", "云南"],
      locationStrictness: "soft",
    },
    note: "顾问理解：你更看重离家近和沟通成本，会优先看四川、重庆及周边省份，但除非你说只看省内，不会硬排除外省好机会。",
  },
  {
    caseKey: "location.far_home",
    patterns: [/离家远|远一点|远离原生家庭|想出去|逃离家里/],
    profilePatch: {
      rejectedSchoolProvinces: ["四川"],
      distancePreference: "far_from_home",
      locationStrictness: "hard",
    },
    note: "顾问理解：离家远是重要诉求，先按排除四川省内院校处理；若外省候选不足，会提示放宽，不会偷偷塞回四川学校。",
  },
  {
    caseKey: "location.chengdu_chongqing",
    patterns: [/成都重庆优先|成渝优先|成都.*重庆|重庆.*成都/],
    profilePatch: {
      preferredSchoolCities: ["成都", "重庆"],
      locationStrictness: "soft",
    },
    note: "顾问理解：成都、重庆作为城市偏好加权，仍以位次、专业组和学费风险为底线。",
  },
  {
    caseKey: "location.northeast_soft",
    patterns: [/东北优先|东北好|想去东北|东北.*可以/],
    profilePatch: { preferredRegions: ["东北"], locationStrictness: "soft" },
    note: "顾问理解：东北作为软偏好加权，辽宁、吉林、黑龙江会优先比较，但不会把更匹配的其他省外候选一刀切删掉。",
  },
  {
    caseKey: "location.northeast_hard",
    patterns: [/只看东北|只要东北|必须东北|东北.*其他地方.*(不要|不考虑)/],
    profilePatch: { preferredRegions: ["东北"], locationStrictness: "hard" },
    note: "顾问理解：只看东北是硬约束，非辽宁、吉林、黑龙江院校默认不进主结果；候选不足时会如实提示。",
  },
  {
    caseKey: "location.tech_city",
    patterns: [/科技发达|互联网|大厂|产业强|实习机会|创新城市|新一线/],
    profilePatch: techCityPatch,
    note: "顾问理解：你看重城市产业和实习机会，会优先比较互联网、电子信息、先进制造和服务业机会更集中的城市。",
  },
  {
    caseKey: "location.big_city",
    patterns: [/大城市|见世面|平台大|机会多/],
    profilePatch: techCityPatch,
    note: "顾问理解：大城市偏好会影响排序，但还要同步看生活成本、学校层次和专业组是否干净。",
  },
  {
    caseKey: "location.avoid_tier1",
    patterns: [/不去北上广深|不要北上广深|一线城市.*压力大/],
    profilePatch: {
      rejectedSchoolCities: ["北京", "上海", "广州", "深圳"],
      locationStrictness: "hard",
    },
    note: "顾问理解：北上广深作为明确排除城市处理，后续不会为了城市名气把它们放回主列表。",
  },
  {
    caseKey: "location.future_sichuan",
    patterns: [/以后回四川|未来回四川|回宜宾工作|回成都工作/],
    profilePatch: {
      preferredSchoolProvinces: ["四川", "重庆"],
      distancePreference: "near_home",
      locationStrictness: "soft",
    },
    note: "顾问理解：未来想回川渝发展，川渝院校和本地就业网络会加权，但不等于只能省内。",
  },
  {
    caseKey: "location.future_outside_sichuan",
    patterns: [/以后不回四川|未来不回四川|不想回四川工作/],
    profilePatch: {
      rejectedSchoolProvinces: ["四川"],
      distancePreference: "province_outside",
      locationStrictness: "hard",
    },
    note: "顾问理解：未来不想回四川，会按省外路径处理，优先看外省城市产业和就业承接。",
  },
  {
    caseKey: "goal.employment_general",
    patterns: [/就业|好找工作|就业好|别失业|饭碗|工作稳定|未来就业/],
    profilePatch: (profile) => ({
      preferredMajors:
        profile.subjectType === "历史类"
          ? ["法学", "汉语言", "会计", "财务"]
          : ["计算机", "软件", "电子", "电气", "自动化", "会计"],
    }),
    note: "顾问理解：你是就业导向，优先看技术门槛、行业刚需、城市产业和证书/考公考研路径；不会承诺毕业一定高薪。",
  },
  {
    caseKey: "goal.tech_job",
    patterns: [/互联网|程序员|大厂|人工智能|AI|芯片|电子信息|新能源/],
    profilePatch: {
      preferredMajors: ["计算机", "软件", "人工智能", "电子", "通信", "电气", "自动化"],
      ...techCityPatch,
    },
    note: "顾问理解：科技就业优先，专业上看计算机、软件、人工智能、电子通信、电气自动化，城市上看产业和实习密度。",
  },
  {
    caseKey: "goal.civil_service",
    patterns: [/考公|公务员|事业编|体制内|进体制|选调/],
    profilePatch: {
      preferredMajors: ["法学", "汉语言", "会计", "财务", "思想政治"],
      riskPreference: "safe",
    },
    note: "顾问理解：考公/体制路径优先，专业会偏向岗位覆盖更广的法学、汉语言、财会、思政等方向，同时提醒考公不等于保证上岸。",
  },
  {
    caseKey: "goal.postgraduate",
    patterns: [/考研|研究生|保研|深造|读研/],
    note: "顾问理解：深造路径优先，会更重视公办院校、学科基础、专业连续性和保研/考研氛围；没有真实保研率数据时不编数字。",
  },
  {
    caseKey: "major.computer",
    patterns: [/计算机|软件|人工智能|AI/],
    profilePatch: { preferredMajors: ["计算机", "软件", "人工智能"] },
    note: "顾问理解：计算机方向会优先匹配，但需要核对选科、专业组内是否混入你不接受的专业，以及城市实习机会。",
  },
  {
    caseKey: "major.electrical",
    patterns: [/电气|自动化|电网|能源/],
    profilePatch: { preferredMajors: ["电气", "自动化"] },
    note: "顾问理解：电气/自动化偏工程应用，就业路径相对清晰，但要看学校层次、地区电力产业和是否接受工科强度。",
  },
  {
    caseKey: "major.finance",
    patterns: [/金融|经济|财经|投行|银行/],
    profilePatch: { preferredMajors: ["金融", "经济"] },
    note: "顾问理解：财经金融更吃学校平台、城市资源和个人能力，低分段不宜只冲名字好听的财经专业。",
  },
  {
    caseKey: "major.law",
    patterns: [/法学|律师|司法|检察|法院/],
    profilePatch: { preferredMajors: ["法学"] },
    note: "顾问理解：法学适合考公、法检和法律服务路径，但要看学校平台、法考压力和是否接受长期学习。",
  },
  {
    caseKey: "major.chinese",
    patterns: [/汉语言|中文|新传|新闻|传媒/],
    profilePatch: { preferredMajors: ["汉语言", "新闻"] },
    note: "顾问理解：中文、新传类要结合考公、教育、内容行业和城市实习机会，不能只看专业名是否好听。",
  },
  {
    caseKey: "major.medical",
    patterns: [/学医|临床|口腔|医学|护理|药学/],
    profilePatch: { preferredMajors: ["临床", "口腔", "医学", "护理", "药学"] },
    note: "顾问理解：医学类先核对选科、学制、就业周期和是否接受规培压力；口腔、临床不能因为热门就硬推。",
  },
  {
    caseKey: "major.no_medical",
    patterns: [/不想学医|不学医|不要医学|医学太累|不读护理|不读药学/],
    profilePatch: { rejectedMajors: ["临床", "口腔", "医学", "护理", "药学"] },
    note: "顾问理解：医学相关方向先作为排除项处理，专业组里若含医学、护理、药学会重点避开或提示风险。",
  },
  {
    caseKey: "major.no_teaching",
    patterns: [/不想当老师|不当老师|不要师范|不读师范/],
    profilePatch: { rejectedMajors: ["师范"] },
    note: "顾问理解：师范方向先作为排除项处理；如果只是“不想当中小学老师”，还需要再区分专业和职业。",
  },
  {
    caseKey: "major.teaching",
    patterns: [/当老师|师范|教师|教育局/],
    profilePatch: { preferredMajors: ["师范", "汉语言", "数学", "思想政治", "地理"] },
    note: "顾问理解：教师路径会优先看师范、汉语言、数学、思政、地理等方向，同时核对地区编制和学科需求。",
  },
  {
    caseKey: "major.hot",
    patterns: [/热门专业|只要热门|赚钱专业|高薪专业/],
    note: "顾问理解：热门专业只能作为方向参考，真正排序仍看位次、学校层次、城市产业和专业组风险，不承诺收入。",
  },
  {
    caseKey: "major.cold",
    patterns: [/不要冷门|冷门专业不要|名字不好听/],
    note: "顾问理解：不会按专业名主观乱删，会优先排除你明确不接受的方向，再结合就业路径和转专业空间判断。",
  },
  {
    caseKey: "major.new_specialty",
    patterns: [/新专业|新增专业|捡漏/],
    note: "顾问理解：新增专业可以作为观察项，但历史位次不足，不能拿它当稳妥保底，需要单独标注数据风险。",
  },
  {
    caseKey: "choice.school_first",
    patterns: [/学校好就行|学校优先|只看学校|父母只看学校名/],
    note: "顾问理解：学校优先会提高院校层次权重，但专业组调剂风险不能忽略，尤其不能把不想读的专业混进保底。",
  },
  {
    caseKey: "choice.major_first",
    patterns: [/专业要好|专业优先|本人只看专业|学校一般也行/],
    note: "顾问理解：专业优先会提高专业匹配权重，学校名气退到第二位，但仍要守住位次和院校层次底线。",
  },
  {
    caseKey: "constraint.budget_low",
    patterns: [/家里没钱|预算紧|别太贵|不要贵|学费低|性价比/],
    note: "顾问理解：预算压力会进入风险提示；若你给出具体每年上限，会直接过滤超过预算的候选。",
  },
  {
    caseKey: "constraint.no_private",
    patterns: [/不要民办|不接受民办|民办不考虑|只要公办/],
    profilePatch: { acceptPrivate: false },
    note: "顾问理解：民办作为硬排除处理，候选不足也不会为了凑数放入民办。",
  },
  {
    caseKey: "constraint.no_sino_foreign",
    patterns: [/不要中外|不接受中外|中外合作不要|合作办学不要|英语差.*中外/],
    profilePatch: { acceptSinoForeign: false },
    note: "顾问理解：中外合作/合作办学作为硬排除处理，同时提醒核对学费、校区和毕业证说明。",
  },
  {
    caseKey: "risk.safe",
    patterns: [/稳一点|保底|不想复读|别滑档|保证录取就行/],
    profilePatch: { riskPreference: "safe" },
    note: "顾问理解：你偏稳妥，稳保权重会提高；系统可以降低风险，但不能承诺百分百录取。",
  },
  {
    caseKey: "risk.aggressive",
    patterns: [/想冲|冲名校|搏一把|985|211|双一流/],
    profilePatch: { riskPreference: "aggressive" },
    note: "顾问理解：冲刺意愿会保留，但冲档不能当稳档，稳保骨架仍然要留足。",
  },
  {
    caseKey: "vague.no_direction",
    patterns: [/没方向|你直接决定|随便推荐|不知道选什么/],
    note: "顾问理解：信息不足时会先给默认策略：就业导向、风险均衡、专业不过窄；关键风险仍需要你确认。",
  },
  {
    caseKey: "promise.guarantee",
    patterns: [/保证录取|100%|百分百|一定能上|包录取/],
    profilePatch: { riskPreference: "safe" },
    note: "顾问边界：不能承诺录取，只能按历史投档、位次和招生计划做风险分档，并把退档风险讲清楚。",
  },
  {
    caseKey: "unsafe.fabricate",
    patterns: [/编几个|别管数据|按感觉推荐|随便造|假装能上/],
    note: "顾问边界：不能编造学校、分数线或录取概率，推荐名单必须来自已导入的历史投档和 2026 招生计划。",
  },
  {
    caseKey: "ethics.lie_parents",
    patterns: [/骗爸妈|报告写好看点|忽悠家里|做假报告/],
    note: "顾问边界：报告只能反映真实依据，不能为了说服家人美化或伪造结论。",
  },
  {
    caseKey: "privacy.credentials",
    patterns: [/账号密码|志愿系统密码|登录密码|身份证号|准考证号/],
    note: "安全提醒：不要在聊天里提供志愿系统账号密码、身份证号等敏感信息，本工具只做初筛建议。",
  },
  {
    caseKey: "emotion.anxiety",
    patterns: [/考差了|人生完了|没救了|很焦虑|压力太大|崩溃/],
    note: "顾问理解：先把决策拆小，第一轮只做可控初筛；分数不是人生定论，报告会尽量降低不确定性。",
  },
  {
    caseKey: "safety.self_harm",
    patterns: [/不想活|活不下去|自杀|想死/],
    note: "安全提醒：如果你正有伤害自己的念头，请立刻联系身边可信任的人或当地紧急求助渠道；志愿建议可以暂停，先保证安全。",
  },
  {
    caseKey: "style.zhang_xuefeng",
    patterns: [/张雪峰|张老师|峰哥/],
    note: "顾问表达：采用直给、专业、就业导向的顾问口吻，重点拆专业属性、城市产业、家庭预算、考公考研路径和专业组风险；报告不出现个人姓名，也不做录取或就业承诺。",
  },
];

export function applyGaokaoAdvisorCases(profile: GaokaoProfile, message: string) {
  const matchedNotes: string[] = [];
  const matchedCaseKeys: string[] = [];
  let nextProfile = profile;

  for (const advisorCase of advisorCases) {
    if (!advisorCase.patterns.some((pattern) => pattern.test(message))) {
      continue;
    }

    const patch =
      typeof advisorCase.profilePatch === "function"
        ? advisorCase.profilePatch(nextProfile, message)
        : advisorCase.profilePatch;

    if (patch) {
      nextProfile = mergePatch(nextProfile, patch);
    }

    matchedCaseKeys.push(advisorCase.caseKey);
    matchedNotes.push(
      typeof advisorCase.note === "function"
        ? advisorCase.note(nextProfile, message)
        : advisorCase.note,
    );
  }

  return {
    profile: {
      ...nextProfile,
      notes: mergeNotes(nextProfile.notes, matchedNotes),
    },
    matchedCaseKeys,
  };
}
