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
  scores: Partial<LifeTestScores>;
  branchScores?: Partial<BranchScores>;
  isEscape?: boolean;
};
type QuestionSeed = {
  title: string;
  feedback: string;
  tags?: string[];
};

export const lifeTestQuestionCount = 13;
export const lifeTestHiddenTag = "宜宾隐藏款：不接受定义，但接受好耍";

const adaptiveBranchOrder: AdaptiveBranch[] = [
  "work",
  "job",
  "love",
  "social",
  "recovery",
  "antiRoutine",
  "local",
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

function option(input: OptionInput): LifeTestQuestionOption {
  return {
    id: input.id,
    label: input.id.toUpperCase(),
    text: input.text,
    scores: input.scores,
    branchScores: input.branchScores,
    isEscape: input.isEscape,
  };
}

function escapeOption(input: Omit<OptionInput, "id" | "isEscape">) {
  return option({ id: "d", ...input, isEscape: true });
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
    title,
    feedback,
    options: options.map((item) => (item.id === "d" ? escapeOption(item) : option(item))),
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
    "下班路过三江口，江风一吹，你突然觉得人生还有救。下一秒领导发来：“方便改一下吗？”你会：",
    "系统提示：你的班味已经开始发光。",
    [
      {
        id: "a",
        text: "回“收到”，然后灵魂从身体里下班。",
        scores: { careerStable: 2, decisionReal: 1, paceSoft: 1 },
        branchScores: { workFlavor: 3, localFlavor: 1 },
      },
      {
        id: "b",
        text: "先不回，假装信号被长江吞了。",
        scores: { loveSlow: 1, paceSoft: 2, decisionFeel: 1 },
        branchScores: { recoveryNeed: 2, socialBattery: 1 },
      },
      {
        id: "c",
        text: "打开招聘网站看两眼，又默默关上。",
        scores: { careerGrowth: 2, decisionReal: 1 },
        branchScores: { jobRadar: 3, workFlavor: 1 },
      },
      {
        id: "d",
        text: "没平仄，看今天班味浓不浓。",
        scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, localFlavor: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-02",
    "你在大宜宾招聘上看到一个岗位，工资不错、离家不远、看起来也不坑。你第一反应是：",
    "系统提示：收藏夹不是许愿池。",
    [
      {
        id: "a",
        text: "先收藏，收藏就等于人生有进展。",
        scores: { careerStable: 1, careerGrowth: 1, paceSoft: 1 },
        branchScores: { jobRadar: 3 },
      },
      {
        id: "b",
        text: "点进去看要求，然后发现它要求我会呼吸以外的所有技能。",
        scores: { decisionReal: 2, loveSlow: 1 },
        branchScores: { workFlavor: 2, jobRadar: 1 },
      },
      {
        id: "c",
        text: "立刻投，管他的，先让命运递点子。",
        scores: { careerGrowth: 2, paceFast: 2, decisionFeel: 1 },
        branchScores: { jobRadar: 2, antiRoutine: 1 },
      },
      {
        id: "d",
        text: "我不找工作，我只是在给焦虑找素材。",
        scores: { careerGrowth: 1, paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-03",
    "红娘老师问：“你喜欢什么样的？”你脑壳里一片空白，最后你说：",
    "红娘看了沉默，系统看了点头。",
    [
      {
        id: "a",
        text: "对红心最重要，其他可以慢慢磨合。",
        scores: { loveSlow: 2, careerStable: 1, decisionReal: 1 },
        branchScores: { loveBrain: 3, localFlavor: 1 },
      },
      {
        id: "b",
        text: "能接住我抽象的人，优先录取。",
        scores: { loveOpen: 2, decisionFeel: 2, paceFast: 1 },
        branchScores: { loveBrain: 2, socialBattery: 1 },
      },
      {
        id: "c",
        text: "不要让我天天猜 TA 到底爪子。",
        scores: { loveOpen: 1, decisionReal: 2 },
        branchScores: { loveBrain: 2, recoveryNeed: 1 },
      },
      {
        id: "d",
        text: "我先把自己理抹清楚，再来麻烦爱情。",
        scores: { loveSlow: 2, paceSoft: 1, decisionFeel: 1 },
        branchScores: { antiRoutine: 2, recoveryNeed: 2 },
      },
    ],
  ),
  question(
    "core",
    "core-04",
    "相亲对象问你：“你平时喜欢干什么？”你最想说的是：",
    "系统提示：你的社交电量正在请求充电宝。",
    [
      {
        id: "a",
        text: "上班、下班、假装生活正常。",
        scores: { careerStable: 2, paceSoft: 1, decisionReal: 1 },
        branchScores: { workFlavor: 2, socialBattery: 1 },
      },
      {
        id: "b",
        text: "摆龙门阵可以，查户口不行。",
        scores: { loveOpen: 2, paceFast: 1, decisionFeel: 1 },
        branchScores: { socialBattery: 3, localFlavor: 1 },
      },
      {
        id: "c",
        text: "我兴趣广泛，主要看明天还上不上班。",
        scores: { careerStable: 1, paceSoft: 1, decisionFeel: 1 },
        branchScores: { recoveryNeed: 2, workFlavor: 1 },
      },
      {
        id: "d",
        text: "这个问题太大，我申请跳过人生简历。",
        scores: { loveSlow: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, socialBattery: 1 },
      },
    ],
  ),
  question(
    "core",
    "core-05",
    "朋友喊你晚上出去吃饭，你嘴上说“看情况”，真实意思是：",
    "系统提示：“看情况”已被识别为宜宾人高级婉拒术。",
    [
      {
        id: "a",
        text: "想去，但身体已经提前回家。",
        scores: { loveOpen: 1, paceSoft: 2, decisionFeel: 1 },
        branchScores: { recoveryNeed: 3 },
      },
      {
        id: "b",
        text: "不想去，但怕错过八卦。",
        scores: { loveOpen: 2, paceFast: 1, decisionFeel: 1 },
        branchScores: { socialBattery: 3 },
      },
      {
        id: "c",
        text: "有好吃的可以，有尬聊就算了。",
        scores: { decisionReal: 2, paceSoft: 1 },
        branchScores: { localFlavor: 2, socialBattery: 1 },
      },
      {
        id: "d",
        text: "看情况就是不想解释的文明版本。",
        scores: { loveSlow: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, recoveryNeed: 1 },
      },
    ],
  ),
];

const workSeeds: QuestionSeed[] = [
  {
    title: "你刚坐下准备吃燃面，工作群突然弹出“都在线不？”你第一反应是：",
    feedback: "系统提示：饭还没拌匀，班味已经拌进去了。",
  },
  {
    title: "周一早会领导说“我们简单聊两句”，你听到“简单”两个字时：",
    feedback: "系统提示：简单聊聊，通常不简单。",
  },
  {
    title: "同事问你“这个需求急不急”，你看着对方真诚的眼睛：",
    feedback: "系统提示：成年人的急，通常写在沉默里。",
  },
  {
    title: "老板开始画饼，说未来空间很大，你脑壳里自动弹出：",
    feedback: "系统提示：饼很圆，胃很现实。",
  },
  {
    title: "下午五点半通知开个短会，你电脑已经准备关机：",
    feedback: "系统提示：短会，是时间管理的悬疑片。",
  },
  {
    title: "你准备安静摸鱼三分钟，旁边同事突然问“你现在忙不忙”：",
    feedback: "系统提示：这不是问题，这是命运敲门。",
  },
  {
    title: "绩效自评要写“本季度亮点”，你盯着空白文档：",
    feedback: "系统提示：你的亮点正在努力加载。",
  },
  {
    title: "客户说“最后再改一版”，你已经听过三次“最后”：",
    feedback: "系统提示：最后一版，是职场版连续剧。",
  },
  {
    title: "同事离职前把一堆交接甩给你，还说“很简单”：",
    feedback: "系统提示：简单两个字，含糖量和含泪量都高。",
  },
  {
    title: "周末团建投票来了，你看见“自愿参加”四个字：",
    feedback: "系统提示：自愿两个字，正在考验中文理解。",
  },
];

const workOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "先回“在”，毕竟饭碗还在群里。",
      scores: { careerStable: 2, decisionReal: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "b",
      text: "截图发给朋友，让痛苦获得围观。",
      scores: { loveOpen: 1, paceFast: 1, decisionFeel: 1 },
      branchScores: { socialBattery: 1, workFlavor: 1 },
    },
    {
      id: "c",
      text: "打开待办表，给自己安排得明明白白。",
      scores: { careerStable: 1, decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "d",
      text: "灵魂先下班，本体留下来点头。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "认真听完，还顺手记了三个关键词。",
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
      text: "问一句“优先级是哪个”，给自己留条命。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2, jobRadar: 1 },
    },
    {
      id: "d",
      text: "没平仄，先把表情管理拿出来营业。",
      scores: { decisionFeel: 2, loveSlow: 1 },
      branchScores: { antiRoutine: 2, socialBattery: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先接住，回头再找地方小声崩溃。",
      scores: { careerStable: 2, paceSoft: 1 },
      branchScores: { workFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "b",
      text: "马上问清楚边界，别让需求自由繁殖。",
      scores: { decisionReal: 2, paceFast: 1 },
      branchScores: { workFlavor: 2 },
    },
    {
      id: "c",
      text: "先算这事值不值得我消耗今晚。",
      scores: { careerGrowth: 1, decisionReal: 2 },
      branchScores: { jobRadar: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "假装看不到，让消息在空气里冷静一下。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把饼先收下，至少今天情绪有个碳水。",
      scores: { careerStable: 1, decisionFeel: 1 },
      branchScores: { workFlavor: 1 },
    },
    {
      id: "b",
      text: "直接问工资空间，梦想也要吃饭。",
      scores: { careerGrowth: 2, decisionReal: 2 },
      branchScores: { jobRadar: 2, workFlavor: 1 },
    },
    {
      id: "c",
      text: "默默观察，看谁先被画进锅里。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { socialBattery: 1, workFlavor: 1 },
    },
    {
      id: "d",
      text: "我不吃饼，我只闻一哈有没有五粮液味。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "参加，顺便把“懂事员工”皮肤穿上。",
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
      text: "自愿是吧，那我自愿在家恢复出厂设置。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const jobSeeds: QuestionSeed[] = [
  {
    title: "你刷到一个“薪资面议”的岗位，脑壳里第一句弹幕是：",
    feedback: "系统提示：面议不是薪资，是玄学。",
  },
  {
    title: "岗位写着“团队年轻有活力”，你自动翻译成：",
    feedback: "系统提示：年轻有活力，也可能是都在硬扛。",
  },
  {
    title: "你想换工作，但想到重新面试、自我介绍、谈薪：",
    feedback: "系统提示：你的野心上线了，胆子还在排队。",
  },
  {
    title: "朋友说某公司机会不错，让你赶紧投简历，你会：",
    feedback: "系统提示：命运递点子了，但你还在看说明书。",
  },
  {
    title: "你看到“能接受加班”四个字，手指悬在屏幕上：",
    feedback: "系统提示：这四个字自带警报声。",
  },
  {
    title: "你收藏了 18 个岗位，但一个都没投，主要原因是：",
    feedback: "系统提示：收藏夹不是求职进度条。",
  },
  {
    title: "临港新机会又来了，你一边心动一边算通勤时间：",
    feedback: "系统提示：机会很近，起床很远。",
  },
  {
    title: "HR 问你“为什么想离开上一家公司”，你最想说：",
    feedback: "系统提示：标准答案和真实答案正在打架。",
  },
  {
    title: "你准备更新简历，打开旧版本发现它像上个世纪的自己：",
    feedback: "系统提示：简历不是文件，是人生考古。",
  },
  {
    title: "有人说“现在工作不好找，先稳到起”，你内心：",
    feedback: "系统提示：稳和困住，有时候只隔一个月薪。",
  },
];

const jobOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "先收藏，收藏就是和未来保持暧昧。",
      scores: { careerGrowth: 1, paceSoft: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "直接投，先让 HR 看见我这颗不稳定的心。",
      scores: { careerGrowth: 2, paceFast: 2 },
      branchScores: { jobRadar: 2, antiRoutine: 1 },
    },
    {
      id: "c",
      text: "先查公司评价，不让自己盲盒开到惊吓款。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "d",
      text: "退出页面，焦虑已经完成今日打卡。",
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
      text: "问团队氛围，怕上班像进静音压力锅。",
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
      text: "认真改简历，今天就要让未来知道我还活着。",
      scores: { careerGrowth: 2, paceFast: 1, decisionReal: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先问朋友内部情况，别让自己踩坑还鼓掌。",
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
      text: "我不是不投，我在等勇气发工资。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "机会好就冲，人生不能只在收藏夹里开花。",
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
      text: "不换也焦虑，换也焦虑，我选择先吃点东西。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把问题记下来，面试时反向考察。",
      scores: { decisionReal: 2, careerGrowth: 1 },
      branchScores: { jobRadar: 2 },
    },
    {
      id: "b",
      text: "先发给朋友鉴定，这岗位有没有坑味。",
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
      text: "关掉页面，假装人生暂无更新。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const loveSeeds: QuestionSeed[] = [
  {
    title: "红娘老师发来一个条件不错的人，你第一反应不是心动，而是：",
    feedback: "系统提示：你的恋爱脑正在谨慎启动。",
  },
  {
    title: "对方说“有空出来喝咖啡”，你脑壳里马上开始：",
    feedback: "系统提示：一杯咖啡，能泡出三页内心戏。",
  },
  {
    title: "你聊天时最怕对方突然发一个“嗯”，因为：",
    feedback: "系统提示：一个字，也能让你开小会。",
  },
  {
    title: "相亲局上对方一直讲工作，你的内心 OS 是：",
    feedback: "系统提示：恋爱还没开始，述职已经上线。",
  },
  {
    title: "你遇到一个挺合适的人，但对方回复很慢：",
    feedback: "系统提示：你的耐心和想象力开始同台竞技。",
  },
  {
    title: "朋友问你到底喜欢哪种类型，你说不出来，因为：",
    feedback: "系统提示：你的标准不是没有，是太会变形。",
  },
  {
    title: "你收到一句“早点休息”，最想怎么理解：",
    feedback: "系统提示：普通晚安，被你拿去做阅读理解。",
  },
  {
    title: "红娘问你能不能主动一点，你的真实想法是：",
    feedback: "系统提示：主动这件事，正在排队申请预算。",
  },
  {
    title: "对方约你去江边散步，你脑壳里先闪过：",
    feedback: "系统提示：浪漫和社恐一起吹江风。",
  },
  {
    title: "你喜欢的人突然夸你“挺有意思”，你会：",
    feedback: "系统提示：一句夸奖，足够你脑内加班。",
  },
];

const loveOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "先看看对方靠不靠谱，心动也要做背调。",
      scores: { loveSlow: 2, decisionReal: 2 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "可以聊，能接住我抽象就加分。",
      scores: { loveOpen: 2, decisionFeel: 1 },
      branchScores: { loveBrain: 2, socialBattery: 1 },
    },
    {
      id: "c",
      text: "先问清楚生活节奏，别上来就互相消耗。",
      scores: { loveSlow: 1, decisionReal: 2 },
      branchScores: { loveBrain: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "爱情先等一哈，我今天连自己都回不明白。",
      scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
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
      text: "我先查一下咖啡馆有没有逃生路线。",
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
      text: "表面没事，内心已经打开小剧场。",
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
      text: "TA 嗯我也嗯，大家一起进入宜宾静音模式。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "慢慢了解，不急着把关系推上高速。",
      scores: { loveSlow: 2, paceSoft: 1, decisionReal: 1 },
      branchScores: { loveBrain: 2 },
    },
    {
      id: "b",
      text: "感觉对了就继续，人生已经够难猜了。",
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
      text: "我不是挑，我只是怕人生又多一个待办。",
      scores: { loveSlow: 1, paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "主动一点，别让缘分卡在输入框。",
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
      text: "约江边走走，比坐着审问自然点。",
      scores: { loveOpen: 1, paceSoft: 1, decisionFeel: 1 },
      branchScores: { recoveryNeed: 1, localFlavor: 1 },
    },
    {
      id: "d",
      text: "我先撤，等勇气从南岸坐车过来。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
  ],
];

const socialSeeds: QuestionSeed[] = [
  {
    title: "公司群、朋友群、家族群同时 99+，你会：",
    feedback: "系统提示：你不是忙，你是在群聊里走迷宫。",
  },
  {
    title: "在南岸遇到不太熟的熟人，对方好像也看见你了：",
    feedback: "系统提示：你的社交雷达启动了防空警报。",
  },
  {
    title: "饭局上大家开始轮流讲近况，马上轮到你：",
    feedback: "系统提示：人生近况，被迫现场发布。",
  },
  {
    title: "朋友突然拉你进一个新群，说“都是自己人”：",
    feedback: "系统提示：自己人三个字，正在消耗你的电量。",
  },
  {
    title: "有人问你“怎么最近都不出来耍”，你最想说：",
    feedback: "系统提示：出去耍，也要先经过电量审核。",
  },
  {
    title: "聚会结束后，大家说“下次再约”，你心里：",
    feedback: "系统提示：下次，是社交礼仪里的云端文件。",
  },
  {
    title: "别人发来一大段语音，你看到 59 秒时：",
    feedback: "系统提示：语音条越长，人生越短。",
  },
  {
    title: "朋友让你帮忙活跃气氛，你发现全场都看着你：",
    feedback: "系统提示：你的人类样本研究被迫公开发表。",
  },
  {
    title: "你发朋友圈前，反复删改三遍，主要是怕：",
    feedback: "系统提示：你的朋友圈正在低调营业。",
  },
  {
    title: "饭桌上有人突然 cue 你讲两句，你会：",
    feedback: "系统提示：临场发言，是社交界的突击考试。",
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
      text: "全部不看，假装手机只是装饰品。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "d",
      text: "点开又退出，完成一次无效勤奋。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, socialBattery: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "主动打招呼，体面完成社交任务。",
      scores: { loveOpen: 2, decisionReal: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "低头看手机，假装里面有国家大事。",
      scores: { loveSlow: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "c",
      text: "判断对方是否准备喊我，再决定是否做人。",
      scores: { decisionReal: 2, loveSlow: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "直接进入隐身模式，莫挨我。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "讲得体面一点，让自己像个正常成年人。",
      scores: { careerStable: 1, decisionReal: 2 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "b",
      text: "讲得好耍一点，反正大家也爱听热闹。",
      scores: { loveOpen: 2, decisionFeel: 1 },
      branchScores: { socialBattery: 2, localFlavor: 1 },
    },
    {
      id: "c",
      text: "轻描淡写，留点隐私给自己回血。",
      scores: { loveSlow: 1, paceSoft: 1, decisionReal: 1 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "d",
      text: "我的近况就是：正在努力没有近况。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "接住话题，社交营业也要有职业素养。",
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
      text: "找个熟人贴贴，降低陌生人浓度。",
      scores: { loveOpen: 1, paceSoft: 1 },
      branchScores: { socialBattery: 2 },
    },
    {
      id: "d",
      text: "人在群里，灵魂已经开了飞行模式。",
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
      text: "回一个表情包，低成本维持人类连接。",
      scores: { decisionFeel: 1, paceFast: 1 },
      branchScores: { socialBattery: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "已读不回不是冷漠，是手机替我下班。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const recoverySeeds: QuestionSeed[] = [
  {
    title: "你心情不好，一个人去江边坐起。风一吹，你突然悟了：",
    feedback: "系统提示：三江口正在为你进行低速格式化。",
  },
  {
    title: "你下班后最想要的不是热闹，而是：",
    feedback: "系统提示：你的电量正在申请独处补贴。",
  },
  {
    title: "周末只有一天休息，你最想怎么回血：",
    feedback: "系统提示：休息日不是空白，是维修窗口。",
  },
  {
    title: "你走在老城区的小巷里，突然觉得世界安静了一点：",
    feedback: "系统提示：城市噪音正在被你手动降噪。",
  },
  {
    title: "你说“我没事”，朋友追问“真的没事吗”，你会：",
    feedback: "系统提示：没事两个字，里面装了很多事。",
  },
  {
    title: "你点开外卖软件，发现想吃的和不想动的在打架：",
    feedback: "系统提示：人生难题，有时只是晚饭难题换皮。",
  },
  {
    title: "你突然很想去吹江风，但想到出门要换衣服：",
    feedback: "系统提示：回血也有启动成本。",
  },
  {
    title: "你计划早睡，结果手机刷到宜宾深夜美食：",
    feedback: "系统提示：自律和烧烤，正在互相扯头花。",
  },
  {
    title: "你想把今天的烦躁讲出来，但又觉得没啥好讲：",
    feedback: "系统提示：情绪不是没内容，是没找到出口。",
  },
  {
    title: "你最喜欢的回血方式，通常看起来像：",
    feedback: "系统提示：你不是摆烂，你是在城市级散热。",
  },
];

const recoveryOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "人生没有解决，只是暂时被江风按住了。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "b",
      text: "安逸，先活过今晚再说。",
      scores: { careerStable: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "c",
      text: "明天我要雄起，至少上午雄起。",
      scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 1 },
      branchScores: { jobRadar: 1, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "我不是 emo，我是在进行城市级散热。",
      scores: { decisionFeel: 2, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "安静吃顿饭，先把本体修好。",
      scores: { careerStable: 1, paceSoft: 2 },
      branchScores: { recoveryNeed: 2 },
    },
    {
      id: "b",
      text: "找朋友摆一会儿龙门阵，把心里倒空。",
      scores: { loveOpen: 2, decisionFeel: 1 },
      branchScores: { socialBattery: 1, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "去江边走走，假装自己正在重启。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { recoveryNeed: 2, localFlavor: 1 },
    },
    {
      id: "d",
      text: "不解释，不营业，今日灵魂暂停开放。",
      scores: { loveSlow: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "整理房间，给混乱一点体面。",
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
      text: "出门吃点巴适的，让味觉负责安慰我。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "计划很多，实际先在床上开会。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "把情绪讲清楚，别让它在脑壳里盘山路。",
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
      text: "我没事，我只是今天的人类体验卡到期。",
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
      text: "找个小目标，给自己一点重新启动的声音。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { recoveryNeed: 1, jobRadar: 1 },
    },
    {
      id: "c",
      text: "去一个熟悉地方，陌生快乐太耗电。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "d",
      text: "假装充满电，其实只是屏幕亮着。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
  ],
];

const antiRoutineSeeds: QuestionSeed[] = [
  {
    title: "系统试图给你贴标签，你的第一反应是：",
    feedback: "系统提示：普通题已经有点管不住你。",
  },
  {
    title: "别人让你“选一个明确方向”，你最想说：",
    feedback: "系统提示：你的反骨不是叛逆，是不想被格式化。",
  },
  {
    title: "有人问你“到底想要什么”，你沉默三秒：",
    feedback: "系统提示：答案可能有，但今天不想营业。",
  },
  {
    title: "计划表写得很漂亮，但你本人突然不想按计划来：",
    feedback: "系统提示：你的人生系统正在跳过教程。",
  },
  {
    title: "朋友说你“很难定义”，你听到后：",
    feedback: "系统提示：隐藏款检测值正在上升。",
  },
  {
    title: "当所有选项都看起来不太对，你会：",
    feedback: "系统提示：选项在追你，你在躲它。",
  },
  {
    title: "你被安排参加一个“必须开心”的活动：",
    feedback: "系统提示：开心一旦被要求，就不太开心了。",
  },
  {
    title: "别人说“年轻人要有规划”，你内心弹出：",
    feedback: "系统提示：规划很好，前提是人生听话。",
  },
  {
    title: "你想改变人生，但又不想被人生催进度：",
    feedback: "系统提示：你不是摆烂，你是在反向协商。",
  },
  {
    title: "如果今天可以不做人设，你最想：",
    feedback: "系统提示：隐藏题库已为你打开一条缝。",
  },
];

const antiRoutineOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "可以定义，但请先给我撤回键。",
      scores: { decisionReal: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "b",
      text: "标签贴可以，别贴太牢，我怕撕疼。",
      scores: { loveSlow: 1, paceSoft: 1 },
      branchScores: { antiRoutine: 2, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先看情况，情况本人还没到场。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "d",
      text: "我拒绝被题目安排，除非题目请我吃饭。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, localFlavor: 1 },
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
      text: "先不选，保持人生的悬念感。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "c",
      text: "选一个最不讨厌的，成年人主打凑合精确。",
      scores: { decisionReal: 1, careerStable: 1 },
      branchScores: { workFlavor: 1, antiRoutine: 1 },
    },
    {
      id: "d",
      text: "我不是没有方向，我是方向正在摆龙门阵。",
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
      text: "先沉默，沉默也是一种川南表达。",
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
      text: "不知道，但我知道这个问题问得我想逃。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "先做一点点，假装自己在推进人生。",
      scores: { careerGrowth: 1, paceFast: 1 },
      branchScores: { jobRadar: 1, antiRoutine: 1 },
    },
    {
      id: "b",
      text: "改计划，计划存在的意义就是被改。",
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
      text: "今天不执行，今天和人生谈判。",
      scores: { paceSoft: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3, recoveryNeed: 1 },
    },
  ],
  [
    {
      id: "a",
      text: "笑一下，承认自己确实有点没平仄。",
      scores: { decisionFeel: 1, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 1 },
    },
    {
      id: "b",
      text: "解释两句，但不交出完整说明书。",
      scores: { loveSlow: 1, decisionReal: 1 },
      branchScores: { antiRoutine: 1, socialBattery: 1 },
    },
    {
      id: "c",
      text: "把难定义当优点，至少不容易撞款。",
      scores: { careerGrowth: 1, decisionFeel: 1 },
      branchScores: { antiRoutine: 2 },
    },
    {
      id: "d",
      text: "定义我？先排号，系统都还没排上。",
      scores: { paceFast: 1, decisionFeel: 2 },
      branchScores: { antiRoutine: 3 },
    },
  ],
];

const localSeeds: QuestionSeed[] = [
  {
    title: "外地朋友问你宜宾最安逸的是啥，你第一反应：",
    feedback: "系统提示：你的本地浓度开始冒泡。",
  },
  {
    title: "有人把宜宾说成“只有燃面”，你内心：",
    feedback: "系统提示：本地人科普欲正在启动。",
  },
  {
    title: "你听到“对红心”三个字，脑壳里自动翻译成：",
    feedback: "系统提示：这不是方言，这是宜宾社交协议。",
  },
  {
    title: "朋友来宜宾玩，只给你半天时间安排路线：",
    feedback: "系统提示：半天安排宜宾，是在为难本地灵魂。",
  },
  {
    title: "有人说“巴适”和“安逸”差不多，你会：",
    feedback: "系统提示：方言精细度正在认真上线。",
  },
  {
    title: "你路过一家熟悉的小店，发现涨价了两块：",
    feedback: "系统提示：本地记忆和现实物价正在对账。",
  },
  {
    title: "你给外地朋友解释“没平仄”，最想用哪个例子：",
    feedback: "系统提示：你不是解释方言，你是在解释人生。",
  },
  {
    title: "你听见有人用宜宾话摆龙门阵，第一感觉是：",
    feedback: "系统提示：熟悉的语气，会让城市变近。",
  },
  {
    title: "如果只能用一个地方代表你今天的精神状态，你会选：",
    feedback: "系统提示：你的精神地图正在加载宜宾坐标。",
  },
  {
    title: "你觉得宜宾最适合发呆的时刻是：",
    feedback: "系统提示：这座城市正在帮你慢慢回血。",
  },
];

const localOptionSets: OptionInput[][] = [
  [
    {
      id: "a",
      text: "燃面当然要有，但别把宜宾说小了。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "江边坐起最安逸，风一吹人都清醒点。",
      scores: { paceSoft: 2, decisionFeel: 1 },
      branchScores: { localFlavor: 2, recoveryNeed: 1 },
    },
    {
      id: "c",
      text: "先带吃，再带逛，感情从碳水开始。",
      scores: { loveOpen: 1, decisionFeel: 1 },
      branchScores: { localFlavor: 2, socialBattery: 1 },
    },
    {
      id: "d",
      text: "莫问，问就是每个人心里都有隐藏菜单。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "认真科普，不能让城市被一句话概括完。",
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
      text: "我不反驳，我直接把 TA 带去吃到沉默。",
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
      text: "不是完美，是刚好戳中要害。",
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
      text: "对红心很难解释，但不对红心一秒就晓得。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "三江口打底，先让城市露个脸。",
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
      text: "半天不够，我只安排“下次再来”的钩子。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 1, localFlavor: 2 },
    },
  ],
  [
    {
      id: "a",
      text: "认真区分，语言的味道不能混成一锅。",
      scores: { decisionReal: 2, careerStable: 1 },
      branchScores: { localFlavor: 2 },
    },
    {
      id: "b",
      text: "用生活举例，安逸是状态，巴适是当下。",
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
      text: "没平仄，语言这个东西也讲缘分。",
      scores: { decisionFeel: 2, paceFast: 1 },
      branchScores: { antiRoutine: 2, localFlavor: 2 },
    },
  ],
];

const finalQuestions: LifeTestQuestion[] = [
  question(
    "final",
    "final-01",
    "如果今晚给你一个按钮，只能按一次，你会选：",
    "系统提示：你不是贪心，你只是想把人生配置拉满。",
    [
      {
        id: "a",
        text: "工资涨 30%，但班味也涨 30%。",
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
        text: "每天都过得安逸，但朋友圈少发 80%。",
        scores: { paceSoft: 2, decisionFeel: 1 },
        branchScores: { recoveryNeed: 2, localFlavor: 1 },
      },
      {
        id: "d",
        text: "什么都不选，我要一个“人生重开但保留记忆”的按钮。",
        scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3 },
      },
    ],
  ),
  question(
    "final",
    "final-02",
    "三江口突然出现一个神秘按钮，能撤回你最近一次嘴硬。你会：",
    "系统提示：嘴硬撤回功能，目前仍在内测。",
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
        text: "不撤，我的人生就靠这些嘴硬撑场面。",
        scores: { decisionFeel: 2, paceFast: 1 },
        branchScores: { antiRoutine: 3 },
      },
    ],
  ),
  question(
    "final",
    "final-03",
    "明早醒来你能获得一个宜宾限定超能力，你选：",
    "系统提示：超能力已申请，现实正在审批。",
    [
      {
        id: "a",
        text: "上班时自动屏蔽无效废话。",
        scores: { careerStable: 2, decisionReal: 1 },
        branchScores: { workFlavor: 2 },
      },
      {
        id: "b",
        text: "一眼识别靠谱岗位和坑味岗位。",
        scores: { careerGrowth: 2, decisionReal: 2 },
        branchScores: { jobRadar: 2 },
      },
      {
        id: "c",
        text: "聊天时自动知道对方到底爪子。",
        scores: { loveOpen: 2, decisionFeel: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "随时原地隐身，电量低了就消失。",
        scores: { loveSlow: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-04",
    "命运说可以给你发一份补偿，只能领一种：",
    "系统提示：命运补偿券不支持退款。",
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
        text: "遇到的人对红心一点，少猜一点。",
        scores: { loveOpen: 2, decisionReal: 1 },
        branchScores: { loveBrain: 2 },
      },
      {
        id: "d",
        text: "发我一张“今天不解释”免死金牌。",
        scores: { paceSoft: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 2, recoveryNeed: 1 },
      },
    ],
  ),
  question(
    "final",
    "final-05",
    "如果把你今天的精神状态做成宜宾夜宵菜单，最像：",
    "系统提示：你的精神状态已进入夜宵档。",
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
        text: "隐藏菜单：老板不写，我自己点。",
        scores: { careerGrowth: 1, paceFast: 1, decisionFeel: 2 },
        branchScores: { antiRoutine: 3, localFlavor: 1 },
      },
    ],
  ),
];

export const lifeTestQuestionBank: LifeTestQuestion[] = [
  ...coreQuestions,
  ...branchQuestions("work", "work", workSeeds, workOptionSets),
  ...branchQuestions("job", "job", jobSeeds, jobOptionSets),
  ...branchQuestions("love", "love", loveSeeds, loveOptionSets),
  ...branchQuestions("social", "social", socialSeeds, socialOptionSets),
  ...branchQuestions("recovery", "recovery", recoverySeeds, recoveryOptionSets),
  ...branchQuestions("antiRoutine", "anti", antiRoutineSeeds, antiRoutineOptionSets),
  ...branchQuestions("local", "local", localSeeds, localOptionSets),
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

export function buildLifeTestQuestionFlow(answers: LifeTestAnswer[] = []) {
  const core = lifeTestCoreQuestions.slice(0, 5);
  const coreIdSet = new Set(core.map((item) => item.id));
  const earlyAnswers = answers.filter((answer) => coreIdSet.has(answer.questionId));
  const branchScores = calculateLifeTestBranchScores(earlyAnswers);
  const earlyEscapeState = getLifeTestEscapeState(earlyAnswers);
  const rankedBranches = getRankedBranches(branchScores);
  const seed = getAnswerSeed(earlyAnswers);
  let mainBranch = rankedBranches[0]?.branch ?? "work";

  if (branchScores.antiRoutine >= 4 || earlyEscapeState.maxConsecutive >= 2) {
    mainBranch = "antiRoutine";
  }

  const secondaryBranch =
    rankedBranches.find((item) => item.branch !== mainBranch && item.score > 0)
      ?.branch ?? getFallbackSecondaryBranch(mainBranch);

  return [
    ...core,
    ...pickRotated(questionsForBranch(mainBranch), 5, seed),
    ...pickRotated(questionsForBranch(secondaryBranch), 2, seed + 5),
    ...pickRotated(questionsForBranch("final"), 1, seed + 13),
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

function getFallbackSecondaryBranch(mainBranch: AdaptiveBranch): AdaptiveBranch {
  return adaptiveBranchOrder.find((branch) => branch !== mainBranch) ?? "social";
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
