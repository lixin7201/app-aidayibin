import type {
  LifeTestAnswer,
  LifeTestBranchScoreKey,
  LifeTestQuestion,
  LifeTestQuestionBranch,
  LifeTestQuestionOption,
  LifeTestScores,
} from "@/features/life-test/types";

type OptionId = "a" | "b" | "c" | "d";
type AdaptiveBranch = Exclude<LifeTestQuestionBranch, "core" | "final">;
type BranchScores = Record<LifeTestBranchScoreKey, number>;
type OptionInput = {
  id: OptionId;
  text: string;
  evidenceText?: string;
  scores: Partial<LifeTestScores>;
  branchScores?: Partial<BranchScores>;
  isEscape?: boolean;
};
type QuestionSeed = {
  title: string;
  feedback: string;
  eventKey?: string;
  evidenceKey?: string;
  tags?: string[];
};

export const lifeTestQuestionCount = 13;
export const lifeTestHiddenTag = "宜宾隐藏款：不想被框住，但接受好耍";


const adaptiveBranchOrder: AdaptiveBranch[] = [
  "work",
  "job",
  "love",
  "social",
  "local",
  "recovery",
  "antiRoutine",
];

const branchScoreKeyByBranch: Record<AdaptiveBranch, LifeTestBranchScoreKey> = {
  work: "workFlavor",
  job: "jobRadar",
  love: "loveBrain",
  social: "socialBattery",
  recovery: "recoveryNeed",
  antiRoutine: "antiRoutine",
  local: "localFlavor",
};

function buildEvidenceText(questionTitle: string, optionText: string) {
  const question = questionTitle.replace(/[：:？?。.]$/u, "");

  return `你在“${question}”这题里选了“${optionText}”，说明你处理事情会先照顾自己的真实感受。`;
}

function option(input: OptionInput, questionTitle: string): LifeTestQuestionOption {
  return {
    id: input.id,
    label: input.id.toUpperCase(),
    text: input.text,
    evidenceText: input.evidenceText ?? buildEvidenceText(questionTitle, input.text),
    scores: input.scores,
    branchScores: input.branchScores,
    isEscape: input.isEscape,
  };
}

function escapeOption(input: Omit<OptionInput, "id" | "isEscape">, questionTitle: string) {
  return option({ id: "d", ...input, isEscape: true }, questionTitle);
}

function question(
  branch: LifeTestQuestionBranch,
  id: string,
  title: string,
  feedback: string,
  options: OptionInput[],
  tags?: string[],
): LifeTestQuestion {
  return {
    id,
    branch,
    eventKey: id,
    sceneType: branch,
    evidenceKey: `${branch}:${id}`,
    title,
    feedback,
    options: options.map((item) =>
      item.id === "d" ? escapeOption(item, title) : option(item, title),
    ),
    tags,
  };
}

function branchQuestions(
  branch: AdaptiveBranch,
  prefix: string,
  seeds: QuestionSeed[],
  optionSets: OptionInput[][],
) {
  return seeds.map((seed, index) =>
    question(
      branch,
      `${prefix}-${String(index + 1).padStart(2, "0")}`,
      seed.title,
      seed.feedback,
      optionSets[index % optionSets.length],
      seed.tags,
    ),
  );
}

const coreQuestions: LifeTestQuestion[] = [
  question(
    "core",
    "core-01",
    "刚到家，工作群弹出一句“方便改一下吗？”你一般会怎么回？",
    "先缓一哈，也算一种自我保护。",
    [
      {
        id: "a",
        text: "先问清楚改哪儿，今晚要不要交。",
        scores: { careerStable: 2, decisionReal: 2 },
        branchScores: { workFlavor: 3 },
      },
      {
        id: "b",
        text: "回个“收到”，但心里已经叹气。",
        scores: { careerStable: 1, paceSoft: 1, decisionFeel: 1 },
        branchScores: { workFlavor: 2, recoveryNeed: 1 },
      },
      {
        id: "c",
        text: "直接说现在不方便，晚点再看。",
        scores: { careerGrowth: 1, paceFast: 1, decisionReal: 2 },
        branchScores: { jobRadar: 3, workFlavor: 1 },
      },
      {
        id: "d",
        text: "先吃饭，吃完再说。",
        scores: { paceSoft: 2, decisionFeel: 1 },
        branchScores: { antiRoutine: 3, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-02",
    "你刷到一个宜宾本地岗位，工资看起还行，但要求写了很多。",
    "找工作这事，心动可以，账也要算。",
    [
      {
        id: "a",
        text: "先看休息和社保，别只盯着工资。",
        scores: { careerStable: 2, decisionReal: 2 },
        branchScores: { jobRadar: 3 },
      },
      {
        id: "b",
        text: "发给朋友看看，问问这家公司稳不稳。",
        scores: { loveOpen: 1, decisionFeel: 1, decisionReal: 1 },
        branchScores: { jobRadar: 2, socialBattery: 1 },
      },
      {
        id: "c",
        text: "符合大半就先投，等有回音再说。",
        scores: { careerGrowth: 2, paceFast: 2, decisionReal: 1 },
        branchScores: { jobRadar: 3 },
      },
      {
        id: "d",
        text: "先收藏，今天没精力研究。",
        scores: { careerGrowth: 1, paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-03",
    "红娘问你“想找什么样的人”，你最先想到的是：",
    "关系这东西，舒服和清楚都重要。",
    [
      {
        id: "a",
        text: "相处舒服，话能说到一起。",
        scores: { loveSlow: 2, careerStable: 1, decisionReal: 1 },
        branchScores: { loveBrain: 3 },
      },
      {
        id: "b",
        text: "性格合得来，别一聊天就像面试。",
        scores: { loveOpen: 2, decisionFeel: 1, paceSoft: 1 },
        branchScores: { loveBrain: 2, socialBattery: 1 },
      },
      {
        id: "c",
        text: "有事说清楚，不要让我猜来猜去。",
        scores: { loveOpen: 1, decisionReal: 2 },
        branchScores: { loveBrain: 3 },
      },
      {
        id: "d",
        text: "我已经结婚/有对象了，这题就当帮朋友参考。",
        scores: { careerStable: 1, paceSoft: 1, decisionReal: 1 },
        branchScores: { antiRoutine: 2, socialBattery: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-04",
    "饭局上大家开始轮流讲近况，马上轮到你。",
    "有些近况，不是不想讲，是不想讲太满。",
    [
      {
        id: "a",
        text: "简单说几句，听起过得还行。",
        scores: { careerStable: 2, paceSoft: 1, decisionReal: 1 },
        branchScores: { socialBattery: 2, workFlavor: 1 },
      },
      {
        id: "b",
        text: "讲点好耍的，让场子不尴尬。",
        scores: { loveOpen: 2, paceFast: 1, decisionFeel: 1 },
        branchScores: { socialBattery: 3, localFlavor: 1 },
      },
      {
        id: "c",
        text: "只说能说的，私事就不展开。",
        scores: { loveSlow: 1, decisionReal: 2 },
        branchScores: { socialBattery: 2, workFlavor: 1 },
      },
      {
        id: "d",
        text: "笑一下，说最近就是上班下班。",
        scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, socialBattery: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-05",
    "周末终于空一天，你最想怎么过？",
    "难得空一天，怎么过都算数。",
    [
      {
        id: "a",
        text: "睡到自然醒，谁都不要喊我。",
        scores: { paceSoft: 2, decisionFeel: 1 },
        branchScores: { recoveryNeed: 3 },
      },
      {
        id: "b",
        text: "约朋友吃顿饭，把最近的事摆一摆。",
        scores: { loveOpen: 2, paceFast: 1, decisionFeel: 1 },
        branchScores: { socialBattery: 3 },
      },
      {
        id: "c",
        text: "出去逛一圈，顺便吃点想吃的。",
        scores: { paceFast: 1, decisionFeel: 1, careerGrowth: 1 },
        branchScores: { localFlavor: 2, socialBattery: 1 },
      },
      {
        id: "d",
        text: "不安排，今天就想在屋头待起。",
        scores: { loveSlow: 1, paceSoft: 2, decisionFeel: 1 },
        branchScores: { antiRoutine: 3, recoveryNeed: 1 },
      },
    ],
  ),
];

const workSeeds: QuestionSeed[] = [
  {
    title: "领导说“我们简单聊两句”，你通常会：",
    feedback: "“简单”不简单，打工人最清楚。",
  },
  {
    title: "周一早会领导说“我们简单聊两句”，你听到“简单”两个字时：",
    feedback: "简单聊聊，通常不简单。",
  },
  {
    title: "同事问你“这个需求急不急”，你看着对方真诚的眼睛：",
    feedback: "成年人的急，通常写在沉默里。",
  },
  {
    title: "老板开始画饼，说未来空间很大，你心里先想到的是：",
    feedback: "饼很圆，胃很现实。",
  },
  {
    title: "下午五点半通知开个短会，你电脑已经准备关机：",
    feedback: "越说短会，越要留个心眼。",
  },
  {
    title: "你准备安静摸鱼三分钟，旁边同事突然问“你现在忙不忙”：",
    feedback: "这句话一出，事情多半不小。",
  },
  {
    title: "绩效自评要写“本季度亮点”，你盯着空白文档：",
    feedback: "空白文档比你还沉默。",
  },
  {
    title: "客户说“最后再改一版”，你已经听过三次“最后”：",
    feedback: "最后一版，是职场版连续剧。",
  },
  {
    title: "同事离职前把一堆交接甩给你，还说“很简单”：",
    feedback: "听起来轻松，接起来不一定轻松。",
  },
  {
    title: "周末团建投票来了，你看见“自愿参加”四个字：",
    feedback: "自愿两个字，正在考验中文理解。",
  },
];

const workOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "认真听完，顺手记几个重点。",
      scores: { careerStable: 2, decisionReal: 2 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "表面点头，心里开始算几点能走。",
      scores: { careerStable: 1, paceSoft: 1 },
      branchScores: { workFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "直接问下一步哪个负责，免得后面扯不清。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2, jobRadar: 1 },
    },
    {
      id: "d",
      text: "先问清楚是啥事，免得越聊越长。",
      scores: { decisionFeel: 2, loveSlow: 1 },
      branchScores: { antiRoutine: 2, socialBattery: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先听完重点，别漏掉关键信息。",
      scores: { careerStable: 2, decisionReal: 2 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "表面点头，内心开始计算今天几点能走。",
      scores: { careerStable: 1, paceSoft: 1 },
      branchScores: { workFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "问清楚优先级，免得全部都说急。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2, jobRadar: 1 },
    },
    {
      id: "d",
      text: "先撑住场面，回头再慢慢处理。",
      scores: { decisionFeel: 2, loveSlow: 1 },
      branchScores: { antiRoutine: 2, socialBattery: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先接住问题，再找时间慢慢处理。",
      scores: { careerStable: 2, paceSoft: 1 },
      branchScores: { workFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "马上问清楚边界，别让事情越说越多。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "c",
      text: "先看这事今天到底要不要做。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "先不急着回，等我缓一哈再说。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先听着，心里再算靠不靠谱。",
      scores: { careerStable: 1, decisionFeel: 1 },
      branchScores: { workFlavor: 1 },
    },
    {
      id: "b",
      text: "直接问清楚实际安排，别只听好听的。",
      scores: { careerGrowth: 2, decisionReal: 2 },
      branchScores: { jobRadar: 2, workFlavor: 1 },
    },
    {
      id: "c",
      text: "先看大家反应，不急着表态。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { socialBattery: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "先不激动，先看有没有实际好处。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "参加，至少面子上过得去。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "能线上就线上，能沉默就沉默。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2, workFlavor: 1 },
    },
    {
      id: "c",
      text: "先问清楚有没有调休，没有就当没看见。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "自愿是吧，那我自愿在屋头休息。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先问啥事，别一上来就答应。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "说我手头有事，等下再看。",
      scores: { careerStable: 1, paceSoft: 1 },
      branchScores: { workFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "直接问要不要今天处理。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "d",
      text: "先装没听见，给自己十分钟。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把做过的事列出来，能写多少写多少。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "问同事怎么写，别一个人硬编。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, workFlavor: 1 },
    },
    {
      id: "c",
      text: "拿数据说话，少写空话。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "d",
      text: "盯着空白文档，先去倒杯水。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先确认这次到底改哪几处。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "问清楚截止时间，别默认今晚。",
      scores: { decisionReal: 2, paceSoft: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "c",
      text: "让对方一次性列清楚，别一会儿补一条。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "d",
      text: "先深呼吸，别把烦写在脸上。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "让他把资料和进度先发全。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "约个时间当面过一遍，别靠几句话交接。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { workFlavor: 2, socialBattery: 1 },
    },
    {
      id: "c",
      text: "列个清单，哪些能接哪些要问清楚。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "d",
      text: "简单两个字一出来，我先不轻易信。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "先看时间地点，别占掉整天休息。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { workFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "问问大家去不去，别自己太突出。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "c",
      text: "先问有没有调休，没有就再考虑。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { jobRadar: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "自愿参加，那我也想自愿休息。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const jobSeeds: QuestionSeed[] = [
  {
    title: "你看到一个岗位写着“薪资面议”，你会：",
    feedback: "找工作这事，心动可以，账也要算。",
  },
  {
    title: "岗位写着“团队年轻有活力”，你心里会先想：",
    feedback: "年轻有活力，也可能是都在硬扛。",
  },
  {
    title: "你想换工作，但想到重新面试、自我介绍、谈薪：",
    feedback: "想换工作的念头有了，胆子还在路上。",
  },
  {
    title: "朋友说某公司机会不错，让你赶紧投简历，你会：",
    feedback: "朋友给了建议，但你还想再看清楚点。",
  },
  {
    title: "你看到“能接受加班”四个字，手指悬在屏幕上：",
    feedback: "这四个字自带提醒声。",
  },
  {
    title: "你收藏了 18 个岗位，但一个都没投，主要原因是：",
    feedback: "收藏不等于投简历，这事你也晓得。",
  },
  {
    title: "临港新机会又来了，你一边心动一边算通勤时间：",
    feedback: "机会很近，起床很远。",
  },
  {
    title: "HR 问你“为什么想离开上一家公司”，你最想说：",
    feedback: "真实原因不好直接说，只能先组织语言。",
  },
  {
    title: "你准备更新简历，打开旧版本发现它像上个世纪的自己：",
    feedback: "旧简历一打开，过去几年都在里面。",
  },
  {
    title: "有人说“现在工作不好找，先稳到起”，你内心：",
    feedback: "稳和困住，有时候只隔一个月薪。",
  },
];

const jobOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "先问范围，工资不能靠猜。",
      scores: { careerGrowth: 2, decisionReal: 2 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先看地点，通勤太远真的遭不住。",
      scores: { careerStable: 1, decisionReal: 1, paceSoft: 1 },
      branchScores: { jobRadar: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先收藏，等晚上有空再认真看。",
      scores: { careerGrowth: 1, paceSoft: 1, decisionFeel: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "面议两个字一出来，我就想先冷静哈。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "问清楚工资范围，成年人先谈饭碗。",
      scores: { careerGrowth: 2, decisionReal: 2 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "问通勤，毕竟每天多睡十分钟也是福利。",
      scores: { careerStable: 1, decisionReal: 1, paceSoft: 1 },
      branchScores: { jobRadar: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "问团队氛围，怕每天都闷起做事。",
      scores: { loveOpen: 1, decisionReal: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "d",
      text: "我先不问，我让这个岗位在收藏夹里冷静。",
      scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, jobRadar: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先把简历改一版，至少迈出一步。",
      scores: { careerGrowth: 2, paceFast: 1, decisionReal: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先问问朋友内部情况，别只看招聘话术。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { jobRadar: 2, socialBattery: 1 },
    },
    {
      id: "c",
      text: "算一下现公司还能忍多久，得出答案：看钱。",
      scores: { careerStable: 1, careerGrowth: 1, decisionReal: 2 },
      branchScores: { workFlavor: 1, jobRadar: 1 },
    },
    {
      id: "d",
      text: "不是不投，是还没准备好。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "机会合适就投，别一直放收藏夹。",
      scores: { careerGrowth: 2, paceFast: 2 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先稳住，等我把手头这摊事收一下。",
      scores: { careerStable: 2, paceSoft: 1 },
      branchScores: { workFlavor: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "做个表，把工资、距离、风险全部算清楚。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "先吃点东西，等脑壳清醒了再想。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把问题记下来，面试时问清楚。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先发给朋友看看，这岗位靠不靠谱。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "再看看别的岗位，货比三家不丢人。",
      scores: { careerGrowth: 1, decisionReal: 1, paceSoft: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "关掉页面，今天先不想这件事。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "挑一个最合适的，今天先投出去。",
      scores: { careerGrowth: 2, paceFast: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "发给朋友看看，别只靠自己判断。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "按工资、距离、休息排个顺序。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "收藏太多，看起更不想动。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先算通勤时间，天天跑太远遭不住。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { jobRadar: 2, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "问问住附近的人，真实情况更准。",
      scores: { loveOpen: 1, decisionReal: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "工资如果够香，远一点也能考虑。",
      scores: { careerGrowth: 2, paceFast: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "一想到早起赶路，心已经凉了一半。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "说想换个平台发展，体面一点。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "说节奏不太合适，别把话讲死。",
      scores: { careerStable: 1, decisionReal: 1 },
      branchScores: { jobRadar: 1, workFlavor: 1 },
    },
    {
      id: "c",
      text: "提前准备好答案，免得现场嘴瓢。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "真实原因很多，但面试不能全说。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "把最近做过的事补上去。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "找朋友帮忙看一眼，别自己觉得还行。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "按目标岗位改一版，不再一份简历打天下。",
      scores: { careerGrowth: 2, decisionReal: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "先关掉，明天再面对过去的自己。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先看现在这份工作还能不能谈。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 1, jobRadar: 1 },
    },
    {
      id: "b",
      text: "问问朋友行情，别被一句话劝住。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "先稳着，但简历照样投。",
      scores: { careerGrowth: 2, decisionReal: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "听完更烦，先不讨论工作。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const loveSeeds: QuestionSeed[] = [
  {
    title: "聊天时，对方突然回你一个“嗯”，你会：",
    feedback: "一个“嗯”，能让人想半天。",
  },
  {
    title: "对方说“有空出来喝咖啡”，你心里马上开始：",
    feedback: "一句邀约，确实会让人多想一下。",
  },
  {
    title: "你聊天时最怕对方突然发一个“嗯”，因为：",
    feedback: "一个字，也会让人想半天。",
  },
  {
    title: "相亲局上对方一直讲工作，你心里想的是：",
    feedback: "刚见面就只聊工作，确实有点累。",
  },
  {
    title: "你遇到一个挺合适的人，但对方回复很慢：",
    feedback: "你的耐心和想象力开始同台竞技。",
  },
  {
    title: "朋友问你到底喜欢哪种类型，你说不出来，因为：",
    feedback: "你的标准不是没有，是太会变形。",
  },
  {
    title: "你收到一句“早点休息”，最想怎么理解：",
    feedback: "一句普通晚安，也会让人多想一下。",
  },
  {
    title: "红娘问你能不能主动一点，你的真实想法是：",
    feedback: "不是不想主动，是怕主动得太明显。",
  },
  {
    title: "对方约你去散步，你心里先闪过：",
    feedback: "有点心动，也有点怕尴尬。",
  },
  {
    title: "你喜欢的人突然夸你“挺有意思”，你会：",
    feedback: "一句夸奖，足够让你回味一路。",
  },
];

const loveOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "直接问清楚，别靠猜。",
      scores: { loveOpen: 1, decisionReal: 2, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "先放着，可能人家只是忙。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2, loveBrain: 1 },
    },
    {
      id: "c",
      text: "发给朋友看看，这个“嗯”到底啥意思。",
      scores: { loveOpen: 1, decisionFeel: 2 },
      branchScores: { socialBattery: 1, loveBrain: 1 },
    },
    {
      id: "d",
      text: "算了，这个天好像已经被聊死了。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "答应，现实一点见面比脑补靠谱。",
      scores: { loveOpen: 2, decisionReal: 1, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "先聊几天，别让尴尬来得太快。",
      scores: { loveSlow: 2, paceSoft: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "问朋友帮我分析，这算有戏还是礼貌。",
      scores: { decisionFeel: 2, loveOpen: 1 },
      branchScores: { socialBattery: 1, loveBrain: 1 },
    },
    {
      id: "d",
      text: "我先想一下见面会不会尴尬。",
      scores: { loveSlow: 1, paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "直接问清楚，少猜一点，多活一年。",
      scores: { loveOpen: 1, decisionReal: 2, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "表面没事，心里已经想了好多。",
      scores: { loveOpen: 1, decisionFeel: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "先放下手机，假装自己很成熟。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2, loveBrain: 1 },
    },
    {
      id: "d",
      text: "TA 回嗯我也回嗯，这个天就算聊到这儿。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "慢慢了解，不急着马上定下来。",
      scores: { loveSlow: 2, paceSoft: 1, decisionReal: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "感觉对了就继续，别一开始想太多。",
      scores: { loveOpen: 2, decisionFeel: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "看对方会不会照顾人，细节比嘴甜重要。",
      scores: { loveSlow: 1, decisionReal: 2 },
      branchScores: { loveBrain: 2, localFlavor: 1 },
    },
    {
      id: "d",
      text: "我不是挑，只是怕多一件麻烦事。",
      scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "想聊就主动一点，别一直憋着。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "先观察，靠谱的人不怕慢慢来。",
      scores: { loveSlow: 2, decisionReal: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "约出去走走，比坐着干聊自然点。",
      scores: { loveOpen: 1, paceSoft: 1, decisionFeel: 1 },
      branchScores: { recoveryNeed: 1, localFlavor: 1 },
    },
    {
      id: "d",
      text: "我先缓一哈，等状态好点再说。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "说几个不能接受的点，先把底线讲清楚。",
      scores: { loveOpen: 1, decisionReal: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "让朋友帮我总结，旁观者可能更清楚。",
      scores: { loveOpen: 1, decisionFeel: 2 },
      branchScores: { socialBattery: 1, loveBrain: 1 },
    },
    {
      id: "c",
      text: "先相处看看，很多标准见面才晓得。",
      scores: { loveSlow: 2, paceSoft: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "d",
      text: "说不出来就不硬编，别把自己绕进去。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "当普通关心，别马上想太多。",
      scores: { loveSlow: 1, decisionReal: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "回一句晚安，顺手把话接住。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { loveBrain: 1 },
    },
    {
      id: "c",
      text: "发给朋友看看，是不是我想多了。",
      scores: { decisionFeel: 2, loveOpen: 1 },
      branchScores: { socialBattery: 1, loveBrain: 1 },
    },
    {
      id: "d",
      text: "不研究了，听话去睡。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "主动发一句，先别想输赢。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "慢慢聊，别一上来太用力。",
      scores: { loveSlow: 2, paceSoft: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "问红娘怎么推进，听听建议。",
      scores: { decisionReal: 1, loveOpen: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "d",
      text: "先不主动，我怕自己显得太急。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "答应去走走，见面比猜来猜去强。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { loveBrain: 2, localFlavor: 1 },
    },
    {
      id: "b",
      text: "先问时间地点，别让自己太赶。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { loveBrain: 1 },
    },
    {
      id: "c",
      text: "约个轻松点的地方，别搞得像面试。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { loveBrain: 2, localFlavor: 1 },
    },
    {
      id: "d",
      text: "有点想去，但我需要先做心理准备。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "回一句谢谢，顺便继续聊两句。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "表面淡定，心里其实有点高兴。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "c",
      text: "发给朋友看看，我这算不算有戏。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, loveBrain: 1 },
    },
    {
      id: "d",
      text: "先装作普通夸奖，不让自己太上头。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
];

const socialSeeds: QuestionSeed[] = [
  {
    title: "公司群、朋友群、家族群同时 99+，你先看哪个？",
    feedback: "消息太多时，先保住重点。",
  },
  {
    title: "在南岸遇到不太熟的熟人，对方好像也看见你了：",
    feedback: "你已经开始判断要不要打招呼。",
  },
  {
    title: "群里突然有人艾特你，说“你来讲两句”：",
    feedback: "被点到名字，回不回都要想一下。",
  },
  {
    title: "朋友突然拉你进一个新群，说“都是自己人”：",
    feedback: "熟人局也会消耗力气。",
  },
  {
    title: "有人问你“怎么最近都不出来耍”，你最想说：",
    feedback: "不是不想耍，是最近确实有点累。",
  },
  {
    title: "聚会结束后，大家说“下次再约”，你心里：",
    feedback: "这句客气话，大家都懂一点。",
  },
  {
    title: "别人发来一大段语音，你看到 59 秒时：",
    feedback: "语音越长，越考验耐心。",
  },
  {
    title: "朋友让你帮忙活跃气氛，你发现全场都看着你：",
    feedback: "气氛突然交到你手上了。",
  },
  {
    title: "你发朋友圈前，反复删改三遍，主要是怕：",
    feedback: "发不发朋友圈，也要看今天想不想被看见。",
  },
  {
    title: "饭桌上有人突然 cue 你讲两句，你会：",
    feedback: "突然被点名，谁都会愣一下。",
  },
];

const socialOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "先看公司群，毕竟饭碗还在里面。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 1, socialBattery: 1 },
    },
    {
      id: "b",
      text: "先看朋友群，万一有瓜。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "c",
      text: "挑有@我的回，其他晚点再说。",
      scores: { decisionReal: 2, paceSoft: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "全部先放着，我今天消息太多了。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "主动打招呼，正常打个招呼。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "低头看手机，假装没看见。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "看对方有没有先开口，再决定打不打招呼。",
      scores: { decisionReal: 2, loveSlow: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "能躲就躲，今天不想寒暄。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先回一句在，别让对方一直等。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "顺着话题接两句，让群里别冷场。",
      scores: { loveOpen: 2, decisionFeel: 1 },
      branchScores: { socialBattery: 2, localFlavor: 1 },
    },
    {
      id: "c",
      text: "只回重点，其他不展开。",
      scores: { loveSlow: 1, paceSoft: 1, decisionReal: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "d",
      text: "先不回，等想清楚再说。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "接住话题，别让场子冷下来。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "先观察三分钟，判断这是友好局还是尬局。",
      scores: { decisionReal: 2, loveSlow: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先找熟人坐近点，没那么尴尬。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "d",
      text: "人在群里，心里只想先安静。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "马上回复，关系要靠及时维护。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "晚点回，给自己留一点缓冲区。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "回一个表情包，先把话接住。",
      scores: { decisionFeel: 1, paceFast: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "先不回，不代表不在意，只是想歇一会儿。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "真想约就顺手定个时间。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "回一句“要得”，先把客气接住。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "c",
      text: "看大家有没有人先行动，我再跟。",
      scores: { decisionReal: 1, loveSlow: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "心里晓得，下次可能又是下次。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "耐心听完，万一真有重要事。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "b",
      text: "先转文字，看重点再决定回啥。",
      scores: { decisionReal: 2, paceSoft: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "c",
      text: "回一句“我等下听”，先给对方交代。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "d",
      text: "看到 59 秒，先放着晚点再说。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "讲个轻松话题，先把气氛接住。",
      scores: { loveOpen: 2, paceFast: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "拉熟人一起说，别让我一个人扛。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "c",
      text: "开个小玩笑，够用就行。",
      scores: { decisionFeel: 1, paceFast: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "d",
      text: "今天状态一般，真不适合控场。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "想发就发，别改到不像自己。",
      scores: { loveOpen: 1, decisionFeel: 2 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "b",
      text: "先给朋友看一眼，免得自己想太多。",
      scores: { loveOpen: 1, decisionReal: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "c",
      text: "只发照片少写字，省得解释。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "删到最后不发了，清净。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "简单讲两句，别让大家等太久。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "开个玩笑带过去，别搞太正式。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "c",
      text: "把话题递给更会讲的人。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { socialBattery: 1 },
    },
    {
      id: "d",
      text: "笑一下，说我先吃两口。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const recoverySeeds: QuestionSeed[] = [
  {
    title: "周末终于空一天，你最想怎么休息？",
    feedback: "难得空一天，怎么过都算数。",
  },
  {
    title: "你下班后最想要的不是热闹，而是：",
    feedback: "下班以后，安静也算一种需要。",
  },
  {
    title: "周末只有一天休息，你最想怎么缓一缓？",
    feedback: "休息日不是浪费，是把状态补回来。",
  },
  {
    title: "你走在老城区的小巷里，突然觉得世界安静了一点：",
    feedback: "安静下来以后，人也会松一点。",
  },
  {
    title: "你说“我没事”，朋友追问“真的没事吗”，你会：",
    feedback: "没事两个字，里面装了很多事。",
  },
  {
    title: "你点开外卖软件，发现想吃的和不想动的在打架：",
    feedback: "有些烦恼，先从吃点什么开始解决。",
  },
  {
    title: "你突然很想去吹江风，但想到出门要换衣服：",
    feedback: "想休息，也要先过出门这一关。",
  },
  {
    title: "你计划早睡，结果手机刷到宜宾深夜美食：",
    feedback: "想早睡和想吃点好的，经常会打架。",
  },
  {
    title: "你想把今天的烦躁讲出来，但又觉得没啥好讲：",
    feedback: "不是没话说，是还没想好怎么说。",
  },
  {
    title: "你最喜欢的休息方式，通常看起来像：",
    feedback: "你不是摆烂，只是需要慢一点。",
  },
];

const recoveryOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "睡到自然醒，先把觉补回来。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "收拾屋头，把乱糟糟的地方理一下。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "吃顿好的，心情多少会好点。",
      scores: { paceSoft: 1, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "d",
      text: "不安排，今天就想空起。",
      scores: { loveSlow: 1, paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "安静吃顿饭，先把自己照顾好。",
      scores: { careerStable: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "找朋友聊一会儿，把心里那点事说出来。",
      scores: { loveOpen: 2, decisionFeel: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "出去走走，让自己慢慢缓过来。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "d",
      text: "不解释，今天就想少说两句。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "整理一下屋头，心里也会顺一点。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "睡到自然醒，手机先不要当老板。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "出门吃点想吃的，心情多少会好点。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "计划很多，但先躺一会儿。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把心里话说清楚，别一直憋着。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "先别讲，等我自己把它吹散一点。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "用吃饭解决一半，剩下一半交给明天。",
      scores: { careerStable: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "我没事，只是今天真的有点累。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "减少安排，今天只做必须活着的事。",
      scores: { paceSoft: 2, decisionReal: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "先做个小事情，让自己动起来。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { recoveryNeed: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "去熟悉的地方待会儿，没那么累。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "看起还行，其实只是硬撑着。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "点最想吃的，先别为难自己。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "选最快送到的，少纠结十分钟。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "问朋友吃啥，借点灵感。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "不点了，随便弄点填肚子。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "换衣服出门，走一圈也好。",
      scores: { paceFast: 1, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "b",
      text: "不去远，就在楼下走走。",
      scores: { paceSoft: 2, decisionReal: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "喊个朋友一起，自己出门太难。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "算了，在屋头开窗吹会儿也行。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "忍住，明天醒来会感谢自己。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "点一份，今天就让嘴巴赢一次。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { localFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先收藏，明天白天再吃。",
      scores: { decisionReal: 1, paceSoft: 1 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "刷完这一条就睡，虽然不一定做到。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "找个人讲出来，别一直闷着。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { recoveryNeed: 2, socialBattery: 1 },
    },
    {
      id: "b",
      text: "先写下来，理顺了再说。",
      scores: { decisionReal: 2, paceSoft: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "洗个澡吃点东西，先把身体顾好。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "d",
      text: "今天不讲，免得越讲越烦。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "睡一觉，醒了再说。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "收拾一下屋头，看起顺眼点。",
      scores: { careerStable: 1, decisionReal: 1 },
      branchScores: { recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "出去吃点好的，换个心情。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "空起，今天不安排任务。",
      scores: { loveSlow: 1, paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 2 },
    },
  ],
];

const antiRoutineSeeds: QuestionSeed[] = [
  {
    title: "别人问你“以后到底咋个打算”，你最想说：",
    feedback: "有些答案，真不是马上说得出来。",
  },
  {
    title: "别人让你“选一个明确方向”，你最想说：",
    feedback: "你不是故意唱反调，只是不想被安排得太满。",
  },
  {
    title: "有人问你“到底想要什么”，你沉默三秒：",
    feedback: "答案可能有，只是今天不想马上说。",
  },
  {
    title: "计划表写得很漂亮，但你本人突然不想按计划来：",
    feedback: "计划可以写，今天不一定跟着走。",
  },
  {
    title: "朋友说你“想法很多”，你听到后：",
    feedback: "看来你确实不太爱按套路来。",
  },
  {
    title: "当所有选项都看起来不太对，你会：",
    feedback: "选项都差一点，你才会犹豫。",
  },
  {
    title: "你被安排参加一个“必须开心”的活动：",
    feedback: "开心一旦被要求，就不太开心了。",
  },
  {
    title: "别人说“年轻人要有规划”，你内心弹出：",
    feedback: "规划很好，前提是日子别老改主意。",
  },
  {
    title: "你想有点变化，但又不想被人催着走：",
    feedback: "你不是不想动，只是想按自己的节奏来。",
  },
  {
    title: "如果今天可以不解释，你最想：",
    feedback: "有时候不解释，也是一种轻松。",
  },
];

const antiRoutineOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "有打算，先把眼前这段过顺。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { workFlavor: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "还在想，想清楚了再说。",
      scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "先挣钱，其他慢慢来。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "别催，越催我越乱。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "认真选一个，选完允许自己后悔。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { antiRoutine: 1, jobRadar: 1 },
    },
    {
      id: "b",
      text: "先不选，我还没想清楚。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "选一个最不讨厌的，先别卡太久。",
      scores: { decisionReal: 1, careerStable: 1 },
      branchScores: { workFlavor: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "我不是没有方向，只是还没想清楚怎么走。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 3, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把话说清楚，避免别人替我脑补。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "先不说，等想清楚了再开口。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
    {
      id: "c",
      text: "换个轻松说法，不让现场太像答辩。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "现在真说不清楚，先别逼我。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先做一点点，至少别原地不动。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { jobRadar: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "计划可以改，别把自己卡死。",
      scores: { decisionReal: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "找朋友吐槽，吐槽完再决定要不要做。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "今天不执行，今天先缓一缓。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "笑一下，说最近确实有点乱。",
      scores: { decisionFeel: 1, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
    {
      id: "b",
      text: "解释两句，但不把自己摊开讲。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { antiRoutine: 1, socialBattery: 1 },
    },
    {
      id: "c",
      text: "把想法多当优点，至少不容易无聊。",
      scores: { careerGrowth: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "d",
      text: "先别急着说我，我自己都还没想好。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3 },
    },
  ],
  [
    {
      id: "a",
      text: "选最接近的那个，先别纠结太久。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { antiRoutine: 1 },
    },
    {
      id: "b",
      text: "都不太对，我想换个说法。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "先看清楚题目到底在问啥。",
      scores: { decisionReal: 2, loveSlow: 1 },
      branchScores: { antiRoutine: 1 },
    },
    {
      id: "d",
      text: "我想跳过，这题有点为难人。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "去一会儿，差不多就撤。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "找熟人待一起，没那么尴尬。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "提前说好我可能早点走。",
      scores: { decisionReal: 2, loveSlow: 1 },
      branchScores: { antiRoutine: 1 },
    },
    {
      id: "d",
      text: "不想装开心，今天真没那个劲。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "写个最近三个月能做的，别扯太远。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "先把眼前钱挣稳，规划慢慢来。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 1, antiRoutine: 1 },
    },
    {
      id: "c",
      text: "问问过来人，少走点弯路。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "我晓得要规划，但不要天天催。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 3 },
    },
  ],
  [
    {
      id: "a",
      text: "先动一点点，别一上来逼自己翻篇。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { antiRoutine: 1, jobRadar: 1 },
    },
    {
      id: "b",
      text: "留点选择，不把话说满。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { antiRoutine: 1 },
    },
    {
      id: "c",
      text: "找朋友聊聊，听听别人怎么看。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "我想变，但按我的节奏来。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3 },
    },
  ],
  [
    {
      id: "a",
      text: "少说两句，让自己轻松点。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "b",
      text: "自己安排一天，不给别人报备。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "该做的做完，其他先不解释。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { workFlavor: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "消息先放着，今天不想一直回应。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
];

const localSeeds: QuestionSeed[] = [
  {
    title: "外地朋友说“宜宾是不是就只有燃面？”你会：",
    feedback: "懂宜宾的人，不只晓得燃面。",
  },
  {
    title: "有人把宜宾说成“只有燃面”，你内心：",
    feedback: "这时候确实想认真解释两句。",
  },
  {
    title: "你听到别人说“这个人靠谱”，心里会先想到：",
    feedback: "靠谱不是口号，是相处起来省心。",
  },
  {
    title: "朋友来宜宾玩，只给你半天时间安排路线：",
    feedback: "半天安排宜宾，确实有点赶。",
  },
  {
    title: "有人说“巴适”和“安逸”差不多，你会：",
    feedback: "方言讲究，确实不是一句话能说清。",
  },
  {
    title: "你路过一家熟悉的小店，发现涨价了两块：",
    feedback: "熟悉的小店涨价，心里多少会咯噔一下。",
  },
  {
    title: "外地朋友问宜宾话有啥特别，你会怎么说？",
    feedback: "有些本地说法，得用生活来解释。",
  },
  {
    title: "你听见有人用宜宾话摆龙门阵，第一感觉是：",
    feedback: "听到熟悉口音，人会一下亲近些。",
  },
  {
    title: "如果只能用一个地方代表你今天的精神状态，你会选：",
    feedback: "想去哪里待会儿，其实心里有答案。",
  },
  {
    title: "你觉得宜宾最适合发呆的时刻是：",
    feedback: "发呆一会儿，也算认真休息。",
  },
];

const localOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "燃面肯定要吃，但宜宾不止这个。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "直接带他吃一圈，嘴巴比解释管用。",
      scores: { loveOpen: 1, decisionFeel: 1, paceFast: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "c",
      text: "先问他想吃还是想耍，再安排路线。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "d",
      text: "不争，来两天他自己就晓得了。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "认真讲两句，宜宾不止一碗面。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "笑一笑，懂的人自然懂。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "马上推荐三家店，用事实说服。",
      scores: { paceFast: 1, decisionReal: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "d",
      text: "不争，直接带他吃一圈。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "靠谱、对味、办事让人放心。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { localFlavor: 2, workFlavor: 1 },
    },
    {
      id: "b",
      text: "不是完美，是刚好合适。",
      scores: { loveOpen: 1, decisionFeel: 2 },
      branchScores: { localFlavor: 2, loveBrain: 1 },
    },
    {
      id: "c",
      text: "这个人可以处，至少不让人脑壳痛。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { localFlavor: 2, loveBrain: 1 },
    },
    {
      id: "d",
      text: "相处舒服，就是不拧巴。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "先去三江口看一眼，外地朋友容易有感觉。",
      scores: { decisionReal: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "李庄/老街走一趟，慢一点才有味。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先吃再说，路线可以错，饭不能错。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "d",
      text: "半天不够，就留点下次再来的念想。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "认真区分，这些词听起像，意思还是有差别。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "用生活举例，安逸偏舒服，巴适偏当下那一下。",
      scores: { decisionReal: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "c",
      text: "不解释，直接说“你多待两天就晓得了”。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "有些本地说法，确实要多听几次。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "还是买，毕竟吃的是熟悉味道。",
      scores: { careerStable: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "跟朋友吐槽两句，涨价也要有个心理准备。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, localFlavor: 1 },
    },
    {
      id: "c",
      text: "换一家试试，说不定有新发现。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "d",
      text: "今天先不买，留点怀念在心头。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "举几个生活里的例子，比硬解释好懂。",
      scores: { decisionReal: 2, loveOpen: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "带他去听本地人聊天，现场感最直接。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, localFlavor: 2 },
    },
    {
      id: "c",
      text: "说多待几天，自然就听懂一些。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "不硬讲，语言这个东西要靠感受。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "听到熟悉口音，心里会亲切一点。",
      scores: { loveSlow: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "想站旁边听两句，看他们摆啥子。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "c",
      text: "能接上话就接两句，融进去很快。",
      scores: { loveOpen: 1, paceFast: 1 },
      branchScores: { socialBattery: 1, localFlavor: 2 },
    },
    {
      id: "d",
      text: "不插话，光听着也安逸。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "三江口，看水也看人来人往。",
      scores: { paceSoft: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "老城区，慢慢走一圈。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "找个吃东西的地方，边吃边想。",
      scores: { decisionFeel: 1, loveOpen: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "屋头，今天哪里都不想去。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 1, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "下午没那么赶的时候。",
      scores: { paceSoft: 1, decisionReal: 1 },
      branchScores: { localFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "吃完饭走两步的时候。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "坐车路过熟悉街口的时候。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "d",
      text: "夜深了，终于没人喊我的时候。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 1, recoveryNeed: 1 },
    },
  ],
];

const finalQuestions: LifeTestQuestion[] = [
  question(
    "final",
    "final-01",
    "如果今晚给你一个按钮，只能按一次，你会选：",
    "想要的多一点，也不丢人。",
    [
      {
        id: "a",
        text: "工资涨一点，但事情也多一点。",
        scores: { careerStable: 2, careerGrowth: 1, decisionReal: 2 },
        branchScores: { workFlavor: 2, jobRadar: 1 },
      },
      {
        id: "b",
        text: "立刻遇到合适对象，但要主动聊天一个月。",
        scores: { loveOpen: 2, paceFast: 1, decisionFeel: 1 },
        branchScores: { loveBrain: 3 },
      },
      {
        id: "c",
        text: "每天过得轻松点，但少一点热闹。",
        scores: { paceSoft: 2, decisionFeel: 1 },
        branchScores: { recoveryNeed: 2, localFlavor: 1 },
      },
      {
        id: "d",
        text: "什么都不选，我先把今天过顺。",
        scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3 },
      },
    ],
  ),
  question(
    "final",
    "final-02",
    "如果可以撤回最近一次嘴硬，你会：",
    "有些话说出口之后，确实会想改一下。",
    [
      {
        id: "a",
        text: "撤回“我都可以”，因为我其实很不可以。",
        scores: { loveSlow: 1, decisionReal: 2 },
        branchScores: { recoveryNeed: 1, socialBattery: 1 },
      },
      {
        id: "b",
        text: "撤回“没事”，里面装得太满了。",
        scores: { paceSoft: 1, decisionFeel: 2 },
        branchScores: { recoveryNeed: 2 },
      },
      {
        id: "c",
        text: "撤回“先不换工作”，收藏夹都听笑了。",
        scores: { careerGrowth: 2, paceFast: 1 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "d",
        text: "不撤，我有时候就是靠嘴硬撑过去。",
        scores: { decisionFeel: 2, paceFast: 1 },
        branchScores: { antiRoutine: 3 },
      },
    ],
  ),
  question(
    "final",
    "final-03",
    "如果明天能多一个小能力，你选：",
    "愿望先记下，明天再继续过。",
    [
      {
        id: "a",
        text: "上班时听不见无效废话。",
        scores: { careerStable: 2, decisionReal: 1 },
        branchScores: { workFlavor: 2 },
      },
      {
        id: "b",
        text: "一眼看出岗位靠不靠谱。",
        scores: { careerGrowth: 2, decisionReal: 2 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "聊天时看懂对方到底咋想。",
        scores: { loveOpen: 2, decisionFeel: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "累的时候可以先消失一会儿。",
        scores: { loveSlow: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-04",
    "如果今天给你一个按钮，只能按一次，你选：",
    "选哪个，就看你最近最想在哪件事上松一口气。",
    [
      {
        id: "a",
        text: "工作顺一点，少点临时改一下。",
        scores: { careerStable: 2, decisionReal: 1 },
        branchScores: { workFlavor: 2 },
      },
      {
        id: "b",
        text: "机会准一点，别让我收藏到天荒地老。",
        scores: { careerGrowth: 2, paceFast: 1 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "遇到的人说话清楚一点，少猜一点。",
        scores: { loveOpen: 2, decisionReal: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "给我一天不用解释的自由。",
        scores: { paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-05",
    "如果用一顿宜宾夜宵形容你今天的状态，最像：",
    "今天很适合吃点夜宵再说。",
    [
      {
        id: "a",
        text: "燃面：看起来简单，实际后劲很大。",
        scores: { careerStable: 1, paceFast: 1, decisionReal: 1 },
        branchScores: { localFlavor: 2, workFlavor: 1 },
      },
      {
        id: "b",
        text: "烧烤：越晚越有话，越聊越不想睡。",
        scores: { loveOpen: 2, decisionFeel: 1 },
        branchScores: { socialBattery: 2, localFlavor: 1 },
      },
      {
        id: "c",
        text: "白糕：软软的，但心里很有数。",
        scores: { loveSlow: 1, paceSoft: 2, decisionReal: 1 },
        branchScores: { recoveryNeed: 2, localFlavor: 1 },
      },
      {
        id: "d",
        text: "隐藏菜单：别人不懂，我自己晓得。",
        scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, localFlavor: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-06",
    "如果今晚只留一件事，你想留下：",
    "留下什么，往往比删掉什么更能说明状态。",
    [
      {
        id: "a",
        text: "一个准时下班的晚上。",
        scores: { careerStable: 2, paceSoft: 1 },
        branchScores: { workFlavor: 1, recoveryNeed: 1 },
      },
      {
        id: "b",
        text: "一个靠谱机会的回复。",
        scores: { careerGrowth: 2, decisionReal: 1 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "一次说清楚的聊天。",
        scores: { loveOpen: 2, decisionReal: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "一段没人催我的空白时间。",
        scores: { paceSoft: 2, decisionFeel: 1 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-07",
    "朋友问你“最近还撑得住不”，你最想怎么答：",
    "撑得住不等于不累，只是还能往前走。",
    [
      {
        id: "a",
        text: "还行，事情一件件处理。",
        scores: { careerStable: 2, decisionReal: 2 },
        branchScores: { workFlavor: 1 },
      },
      {
        id: "b",
        text: "想换口气，但还在看机会。",
        scores: { careerGrowth: 2, paceSoft: 1 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "能聊两句就好多了。",
        scores: { loveOpen: 1, decisionFeel: 2 },
        branchScores: { socialBattery: 1, loveBrain: 1 },
      },
      {
        id: "d",
        text: "先别问，我今晚想安静点。",
        scores: { loveSlow: 1, paceSoft: 2 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-08",
    "明天早上醒来，你最希望先轻松一点的是：",
    "明天不用变完美，先轻松一点就好。",
    [
      {
        id: "a",
        text: "事情别一上来就变复杂。",
        scores: { careerStable: 2, decisionReal: 1 },
        branchScores: { workFlavor: 2 },
      },
      {
        id: "b",
        text: "机会别只停在收藏夹。",
        scores: { careerGrowth: 2, paceFast: 1 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "关系里少一点猜来猜去。",
        scores: { loveOpen: 2, decisionReal: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "让我按自己的速度来。",
        scores: { paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 2 },
      },
    ],
  ),
];

export const lifeTestQuestionBank: LifeTestQuestion[] = [
  ...coreQuestions,
  ...branchQuestions("work", "work", workSeeds, workOptionSets).slice(0, 8),
  ...branchQuestions("job", "job", jobSeeds, jobOptionSets).slice(0, 8),
  ...branchQuestions("love", "love", loveSeeds, loveOptionSets).slice(0, 8),
  ...branchQuestions("social", "social", socialSeeds, socialOptionSets).slice(0, 8),
  ...branchQuestions("recovery", "recovery", recoverySeeds, recoveryOptionSets).slice(0, 8),
  ...branchQuestions("antiRoutine", "anti", antiRoutineSeeds, antiRoutineOptionSets).slice(0, 8),
  ...branchQuestions("local", "local", localSeeds, localOptionSets).slice(0, 8),
  ...finalQuestions,
];

export const lifeTestCoreQuestions = lifeTestQuestionBank.filter(
  (item) => item.branch === "core",
);

const lifeTestQuestionsById = new Map(
  lifeTestQuestionBank.map((questionItem) => [questionItem.id, questionItem]),
);

function questionsForBranch(branch: LifeTestQuestionBranch) {
  return lifeTestQuestionBank.filter((item) => item.branch === branch);
}

export function getLifeTestQuestionById(questionId: string) {
  return lifeTestQuestionsById.get(questionId) ?? null;
}

export function calculateLifeTestBranchScores(
  answers: LifeTestAnswer[],
): BranchScores {
  const scores: BranchScores = {
    workFlavor: 0,
    jobRadar: 0,
    loveBrain: 0,
    socialBattery: 0,
    recoveryNeed: 0,
    antiRoutine: 0,
    localFlavor: 0,
  };

  for (const answer of answers) {
    const questionItem = getLifeTestQuestionById(answer.questionId);
    const selected = questionItem?.options.find((item) => item.id === answer.optionId);

    for (const [key, value] of Object.entries(selected?.branchScores ?? {})) {
      scores[key as LifeTestBranchScoreKey] += value ?? 0;
    }
  }

  return scores;
}

export function getLifeTestEscapeState(answers: LifeTestAnswer[]) {
  let total = 0;
  let currentStreak = 0;
  let maxConsecutive = 0;

  for (const answer of answers) {
    const questionItem = getLifeTestQuestionById(answer.questionId);
    const selected = questionItem?.options.find((item) => item.id === answer.optionId);
    const isEscape = selected?.isEscape || answer.optionId === "d";

    if (isEscape) {
      total += 1;
      currentStreak += 1;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    total,
    currentStreak,
    maxConsecutive,
    hiddenPrompt: currentStreak >= 2,
    hiddenTag: total >= 4 ? lifeTestHiddenTag : null,
  };
}

export function isLifeTestMatchmakerSuppressed(answers: LifeTestAnswer[]) {
  return answers.some(
    (answer) => answer.questionId === "core-03" && answer.optionId === "d",
  );
}

export function buildLifeTestQuestionFlow(answers: LifeTestAnswer[] = []) {
  const core = lifeTestCoreQuestions.slice(0, 5);
  const coreIdSet = new Set(core.map((item) => item.id));
  const earlyAnswers = answers.filter((answer) => coreIdSet.has(answer.questionId));
  const branchScores = calculateLifeTestBranchScores(earlyAnswers);
  const matchmakerSuppressed = isLifeTestMatchmakerSuppressed(earlyAnswers);
  const rankedBranchScores = matchmakerSuppressed
    ? { ...branchScores, loveBrain: 0 }
    : branchScores;
  const earlyEscapeState = getLifeTestEscapeState(earlyAnswers);
  const rankedBranches = getRankedBranches(rankedBranchScores);
  const seed = getAnswerSeed(earlyAnswers);
  let mainBranch = rankedBranches[0]?.branch ?? "work";

  if (branchScores.antiRoutine >= 4 || earlyEscapeState.maxConsecutive >= 2) {
    mainBranch = "antiRoutine";
  }

  if (matchmakerSuppressed && mainBranch === "love") {
    mainBranch = getFallbackSecondaryBranch(mainBranch, matchmakerSuppressed);
  }

  const branchPlan = getAdaptiveBranchPlan(
    mainBranch,
    rankedBranches.map((item) => item.branch),
    matchmakerSuppressed,
  );
  const branchUsage = new Map<AdaptiveBranch, number>();
  const adaptiveQuestions = branchPlan
    .map((branch) => {
      const used = branchUsage.get(branch) ?? 0;
      branchUsage.set(branch, used + 1);
      return pickRotated(questionsForBranch(branch), 1, seed + used)[0];
    })
    .filter((item): item is LifeTestQuestion => Boolean(item));
  const finalQuestion =
    questionsForBranch("final").find((questionItem) => questionItem.id === "final-04") ??
    pickRotated(questionsForBranch("final"), 1, seed + 13)[0];

  return [
    ...core,
    ...adaptiveQuestions,
    ...(finalQuestion ? [finalQuestion] : []),
  ];
}

function getRankedBranches(scores: BranchScores) {
  return adaptiveBranchOrder
    .map((branch, index) => ({
      branch,
      score: scores[branchScoreKeyByBranch[branch]],
      index,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

function getAdaptiveBranchPlan(
  mainBranch: AdaptiveBranch,
  rankedBranches: AdaptiveBranch[],
  matchmakerSuppressed: boolean,
) {
  const candidates = [mainBranch, ...rankedBranches, ...adaptiveBranchOrder].filter(
    (branch) => !(matchmakerSuppressed && branch === "love"),
  );
  const unique = Array.from(new Set(candidates));
  const plan = unique.slice(0, 7);

  for (let index = 0; plan.length < 7; index += 1) {
    plan.push(unique[index % unique.length] ?? "work");
  }

  return plan;
}

function getFallbackSecondaryBranch(
  mainBranch: AdaptiveBranch,
  matchmakerSuppressed = false,
): AdaptiveBranch {
  return adaptiveBranchOrder.find(
    (branch) => branch !== mainBranch && !(matchmakerSuppressed && branch === "love"),
  ) ?? "social";
}

function pickRotated<T>(items: T[], count: number, seed: number) {
  if (items.length === 0) {
    return [];
  }

  const start = Math.abs(seed) % items.length;

  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}

function getAnswerSeed(answers: LifeTestAnswer[]) {
  const value = answers
    .map((answer) => `${answer.questionId}:${answer.optionId}`)
    .join("|");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export const lifeTestQuestions = buildLifeTestQuestionFlow([]);
