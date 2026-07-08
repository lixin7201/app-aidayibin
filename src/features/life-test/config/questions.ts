import type {
  LifeTestAnswer,
  LifeTestBranchScoreKey,
  LifeTestQuestion,
  LifeTestQuestionBranch,
  LifeTestQuestionOption,
  LifeTestScores,
} from "@/features/life-test/types";

type AdaptiveBranch = Exclude<LifeTestQuestionBranch, "core" | "final">;
type BranchScores = Record<LifeTestBranchScoreKey, number>;
type ScoreHint =
  | keyof LifeTestScores
  | "work"
  | "job"
  | "love"
  | "social"
  | "recovery"
  | "antiRoutine"
  | "local"
  | "escape"
  | "matchmakerSuppress";

type QuestionInput = {
  id: string;
  branch: LifeTestQuestionBranch;
  eventKey: string;
  sceneType: LifeTestQuestionBranch;
  evidenceKey: string;
  title: string;
  feedback: string;
  tags: string[];
  options: Array<{
    id: string;
    label: string;
    text: string;
    evidenceText: string;
    scoreHints: ScoreHint[];
  }>;
};

export const lifeTestQuestionCount = 13;
export const lifeTestHiddenTag = "宜宾隐藏款：不想被框住，但接受好耍";

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

const axisScoreKeyByHint: Partial<Record<ScoreHint, keyof LifeTestScores>> = {
  careerStable: "careerStable",
  careerGrowth: "careerGrowth",
  loveSlow: "loveSlow",
  loveOpen: "loveOpen",
  paceSoft: "paceSoft",
  paceFast: "paceFast",
  decisionReal: "decisionReal",
  decisionFeel: "decisionFeel",
};

const branchScoreKeyByHint: Partial<Record<ScoreHint, LifeTestBranchScoreKey>> = {
  work: "workFlavor",
  job: "jobRadar",
  love: "loveBrain",
  social: "socialBattery",
  recovery: "recoveryNeed",
  antiRoutine: "antiRoutine",
  local: "localFlavor",
};

const questionDefinitions = [
  {
    "id": "core-01",
    "eventKey": "after_hours_change",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先问清楚改哪三处、今晚要不要交，不接糊涂活。",
        "evidenceText": "你不是不愿意帮忙，是不想把模糊要求变成自己的锅。",
        "scoreHints": [
          "careerStable",
          "decisionReal",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "回个“我看下”，但先把饭吃了再开电脑。",
        "evidenceText": "你会先照顾场面，但也在努力给自己留一点缓冲。",
        "scoreHints": [
          "careerStable",
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说今晚不方便，明早到公司处理。",
        "evidenceText": "你更重视边界和效率，能接受工作，但不接受随时被拖走。",
        "scoreHints": [
          "careerGrowth",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "盯着手机三秒，心里只剩一句：白天咋不说。",
        "evidenceText": "你最近对临时安排很敏感，最想少被人打乱节奏。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "core",
    "sceneType": "core",
    "evidenceKey": "core:after_hours_change",
    "tags": [
      "下班边界",
      "临时改动",
      "先说清楚",
      "今晚状态"
    ],
    "title": "刚下班进电梯，工作群又弹出一句“这个能不能今晚顺手改下？”你手已经摸到家门钥匙了，你会：",
    "feedback": "这题不是测你懒不懒，是看你怎么守住下班后的边界。"
  },
  {
    "id": "core-02",
    "eventKey": "job_collect_opportunity",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看休息、社保和试用期，别只看工资数字。",
        "evidenceText": "你判断机会时很现实，先看能不能长期过下去。",
        "scoreHints": [
          "careerStable",
          "decisionReal",
          "job"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "发给朋友看看，问这家公司到底稳不稳。",
        "evidenceText": "你不是没主见，而是重要选择前想听点真实消息。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "要求符合大半就先投，等有回音再细聊。",
        "evidenceText": "你愿意给机会一个开始，不想一直停在收藏夹里。",
        "scoreHints": [
          "careerGrowth",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先收藏，今晚脑壳不想处理这么大的事。",
        "evidenceText": "你不是完全不想换，只是现在还没准备好被机会推着走。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "core",
    "sceneType": "core",
    "evidenceKey": "core:job_collect_opportunity",
    "tags": [
      "本地岗位",
      "收藏夹",
      "通勤",
      "机会判断"
    ],
    "title": "刷到一个宜宾本地岗位，工资看起还行，地点也不远，但要求写了一长串。你第一反应是：",
    "feedback": "机会摆在面前时，心动和算账经常同时出现。"
  },
  {
    "id": "core-03",
    "eventKey": "relationship_standard",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "稳定靠谱，有事愿意好好说。",
        "evidenceText": "你要的不是刺激，是可以把日子过踏实的人。",
        "scoreHints": [
          "loveSlow",
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "聊天自然一点，不要一上来就像面试。",
        "evidenceText": "你在关系里很看重轻松感，太用力会让你后退。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "有边界，也有回应，不让我天天猜。",
        "evidenceText": "你不怕慢，怕的是对方含糊，让你自己消耗。",
        "scoreHints": [
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我已婚/有对象了，这题就当帮朋友参考。",
        "evidenceText": "你已经不适合被推红娘转化，更适合看轻松结果和分享。",
        "scoreHints": [
          "matchmakerSuppress",
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "core",
    "sceneType": "core",
    "evidenceKey": "core:relationship_standard",
    "tags": [
      "红娘",
      "关系标准",
      "说话清楚",
      "相处舒服"
    ],
    "title": "红娘问你“想找什么样的人”，你脑壳里最先冒出来的是：",
    "feedback": "关系里真正重要的，往往不是条件表，而是相处感。"
  },
  {
    "id": "core-04",
    "eventKey": "weekend_invite_bed",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先问几个人、在哪儿、几点结束，再决定。",
        "evidenceText": "你不是扫兴，是需要知道这场局会不会太耗人。",
        "scoreHints": [
          "decisionReal",
          "loveSlow",
          "social"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "熟人局可以，太多人就算了。",
        "evidenceText": "你愿意见人，但更想把社交留给舒服的人。",
        "scoreHints": [
          "loveOpen",
          "paceSoft",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说今天有点累，下次提前约。",
        "evidenceText": "你开始学会保护自己的电量，不硬撑热闹。",
        "scoreHints": [
          "paceSoft",
          "decisionReal",
          "recovery"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先不回太快，等自己想清楚。",
        "evidenceText": "你最近对邀约有点犹豫，不想马上被别人的节奏带走。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "core",
    "sceneType": "core",
    "evidenceKey": "core:weekend_invite_bed",
    "tags": [
      "周末邀约",
      "熟人局",
      "社交电量",
      "在家省电"
    ],
    "title": "周末你刚躺下，朋友突然喊你出去吃饭摆两句，你会：",
    "feedback": "出不出门，很多时候取决于今天还剩多少电。"
  },
  {
    "id": "core-05",
    "eventKey": "old_friend_recent_status",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "笑起说还可以，工作有点忙。",
        "evidenceText": "你习惯把近况压缩成安全版本，不想把话题拉太长。",
        "scoreHints": [
          "careerStable",
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "顺着摆两句最近的新鲜事，气氛不冷就行。",
        "evidenceText": "你有接话能力，能把普通寒暄变得轻松一点。",
        "scoreHints": [
          "loveOpen",
          "paceFast",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "只说能说的，私事就不展开。",
        "evidenceText": "你很清楚哪些话适合公开，哪些该留给自己。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "笑一下带过，今天真不想解释。",
        "evidenceText": "你不是没礼貌，是今天没力气把自己讲给别人听。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "core",
    "sceneType": "core",
    "evidenceKey": "core:old_friend_recent_status",
    "tags": [
      "熟人寒暄",
      "近况",
      "点到为止",
      "今天不解释"
    ],
    "title": "路上遇到熟人，对方笑起问“最近咋样嘛？”你最可能：",
    "feedback": "一句最近咋样，背后可能要调用很多社交力。"
  },
  {
    "id": "work-01",
    "eventKey": "urgent_task_blame",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先把能补的地方补起，事后再说清责任。",
        "evidenceText": "你优先保住局面，但也知道责任不能一直含糊。",
        "scoreHints": [
          "careerStable",
          "decisionReal",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "立刻问清楚谁负责哪一块，避免后面扯不清。",
        "evidenceText": "你处理急事时很重边界，不想把混乱变成自己的事。",
        "scoreHints": [
          "decisionReal",
          "paceFast",
          "work"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "接是接了，但心里开始记账。",
        "evidenceText": "你会顾全场面，可不代表心里没数。",
        "scoreHints": [
          "careerStable",
          "decisionFeel",
          "recovery"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先救火，但下次这种安排我不想再默认接。",
        "evidenceText": "你已经开始反感被临时推着走，想把规则讲明白。",
        "scoreHints": [
          "antiRoutine",
          "careerGrowth",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:urgent_task_blame",
    "tags": [
      "急活",
      "接锅",
      "边界",
      "责任"
    ],
    "title": "领导临时丢来一个急活，你发现这个锅不是你造成的。你会：",
    "feedback": "能扛事是优点，但不代表什么锅都要默默背。"
  },
  {
    "id": "work-02",
    "eventKey": "vague_request",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先列三个确认点：要什么、何时交、给谁看。",
        "evidenceText": "你习惯把模糊事拆清楚，再开始动手。",
        "scoreHints": [
          "decisionReal",
          "careerStable",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先做一个最稳版本，别让事情空着。",
        "evidenceText": "你会先给事情一个可交付的样子，不喜欢悬着。",
        "scoreHints": [
          "careerStable",
          "paceSoft",
          "work"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接问目标，不然越做越偏。",
        "evidenceText": "你不怕开口确认，怕的是后面反复返工。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "看到“看着办”三个字，已经开始头痛。",
        "evidenceText": "你最近对不清楚的安排很敏感，不想再靠猜完成工作。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:vague_request",
    "tags": [
      "模糊需求",
      "看着办",
      "确认范围",
      "不接糊涂活"
    ],
    "title": "领导发来一句“你看着处理一下”，没有标准、没有时间、没有范围。你第一步是：",
    "feedback": "最累的不是做事，是把不清楚的事硬做成清楚。"
  },
  {
    "id": "work-03",
    "eventKey": "coworker_help_boundary",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "可以看，但先说我只有十分钟。",
        "evidenceText": "你愿意帮忙，但开始给自己的时间设边界。",
        "scoreHints": [
          "decisionReal",
          "loveOpen",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先问他卡在哪儿，不接整包问题。",
        "evidenceText": "你更喜欢精准解决，不想从头替别人做一遍。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "如果手头忙，就直接说晚点。",
        "evidenceText": "你已经不太愿意为了别人打乱自己的节奏。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "嘴上答应，心里想：我咋又答应了。",
        "evidenceText": "你容易顾人情，但事后会被自己的心软消耗。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:coworker_help_boundary",
    "tags": [
      "同事帮忙",
      "边界",
      "时间成本",
      "熟人压力"
    ],
    "title": "同事说“这个你熟，帮我看一眼嘛”，你知道一看可能就是一小时。你会：",
    "feedback": "帮忙和被占用之间，有时只差一句说清楚。"
  },
  {
    "id": "work-04",
    "eventKey": "deadline_tomorrow_morning",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先确认必须完成到什么程度，别做过头。",
        "evidenceText": "你会先找最关键的交付标准，不浪费力气。",
        "scoreHints": [
          "decisionReal",
          "careerStable",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "今晚先做核心部分，细节明早再补。",
        "evidenceText": "你能接受临时加速，但会给自己留一点喘气空间。",
        "scoreHints": [
          "careerStable",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接问能不能顺延，不能就砍范围。",
        "evidenceText": "你不怕谈条件，知道时间不够就要调整目标。",
        "scoreHints": [
          "careerGrowth",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我人坐在工位，心已经下班了。",
        "evidenceText": "你最近对临时截止非常疲惫，只想少被逼到最后一刻。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:deadline_tomorrow_morning",
    "tags": [
      "截止时间",
      "明早要",
      "优先级",
      "下班前"
    ],
    "title": "下午快下班了，对方说“明天早上要”，你看着还没开始的材料。你会：",
    "feedback": "时间紧的时候，最能看出一个人怎么分配力气。"
  },
  {
    "id": "work-05",
    "eventKey": "meeting_silence_or_speak",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "等合适时机提一个具体风险。",
        "evidenceText": "你会顾及场面，但也不会完全装没看见。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "会后单独说，现场不把人架起。",
        "evidenceText": "你更重视关系温度，不喜欢当众把话说死。",
        "scoreHints": [
          "loveSlow",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接指出关键问题，省得后面返工。",
        "evidenceText": "你愿意把问题提前摆出来，不想集体陪跑。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我先听完，今天不想当出头的人。",
        "evidenceText": "你不是没看法，只是最近不想再多揽一层压力。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:meeting_silence_or_speak",
    "tags": [
      "会议",
      "表达",
      "沉默",
      "方案问题"
    ],
    "title": "会上方案明显有问题，但大家都在沉默。你会：",
    "feedback": "开口不是为了表现，是为了少走弯路。"
  },
  {
    "id": "work-06",
    "eventKey": "praise_then_extra",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先听加什么，再判断是不是同一件事。",
        "evidenceText": "你不会被一句夸带走，会先确认新增范围。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "能顺手做就做，但心里会记住这个模式。",
        "evidenceText": "你会维护合作，但不会完全忽略自己的感受。",
        "scoreHints": [
          "careerStable",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说可以排期，但不能默认今天完成。",
        "evidenceText": "你很清楚新增就是新增，不想被包装成顺手。",
        "scoreHints": [
          "careerGrowth",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "一听“顺便”，我就知道不顺便。",
        "evidenceText": "你对这种话术已经有防备，最烦被温柔地加码。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:praise_then_extra",
    "tags": [
      "夸完加活",
      "顺便",
      "工作量",
      "警觉"
    ],
    "title": "对方先夸你“这个做得好”，下一句就是“那顺便再加一个”。你会：",
    "feedback": "被认可很舒服，但顺便两个字也很危险。"
  },
  {
    "id": "work-07",
    "eventKey": "client_last_version",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "让对方一次性列完整，确认后再改。",
        "evidenceText": "你知道反复修改的解法，是把要求一次收齐。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先改关键处，其他放到下一轮确认。",
        "evidenceText": "你会先稳住交付，不让问题继续散开。",
        "scoreHints": [
          "careerStable",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "明确说这版后新增内容要重新排时间。",
        "evidenceText": "你愿意把规则讲清楚，不想被无限延长。",
        "scoreHints": [
          "careerGrowth",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我表面点头，心里已经关灯。",
        "evidenceText": "你被重复修改消耗得很明显，已经不想再相信最后两个字。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:client_last_version",
    "tags": [
      "客户修改",
      "最后一版",
      "返工",
      "确认清单"
    ],
    "title": "客户说“最后再改一版”，但你已经听过三次“最后”。你会：",
    "feedback": "有些最后一版，确实像连续剧。"
  },
  {
    "id": "work-08",
    "eventKey": "work_group_messages_stack",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先按紧急程度排一下，逐个处理。",
        "evidenceText": "你面对混乱时会先建立顺序，不让消息牵着走。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先回最重要的，其他晚点统一看。",
        "evidenceText": "你会兼顾回应和效率，不想被每条消息打断。",
        "scoreHints": [
          "careerStable",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接问谁是负责人、哪个最急。",
        "evidenceText": "你不想在碎片里猜重点，会主动要规则。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "消息越多，我越想把手机扣过去。",
        "evidenceText": "你最近信息负担偏高，最想要一段不被打扰的时间。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "work",
    "sceneType": "work",
    "evidenceKey": "work:work_group_messages_stack",
    "tags": [
      "群消息",
      "信息压力",
      "优先级",
      "被打断"
    ],
    "title": "你刚想认真做事，工作群消息一条接一条，全是不同方向的小事。你会：",
    "feedback": "消息多的时候，真正难的是找回自己的节奏。"
  },
  {
    "id": "job-01",
    "eventKey": "salary_commute_tradeoff",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "算清每个月多赚多少，再看值不值。",
        "evidenceText": "你判断工作很现实，不被单个数字带走。",
        "scoreHints": [
          "careerStable",
          "decisionReal",
          "job"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "问下班时间和加班情况，别通勤加加班双重消耗。",
        "evidenceText": "你看重长期可承受，不想只赢工资输生活。",
        "scoreHints": [
          "decisionReal",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "工资差距够大就试，先给自己一个机会。",
        "evidenceText": "你愿意为变化承担一点成本，不想一直原地待着。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "路上太远的话，我可能还没上班就累了。",
        "evidenceText": "你对消耗很敏感，机会再好也要考虑自己的电量。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:salary_commute_tradeoff",
    "tags": [
      "工资",
      "通勤",
      "现实权衡",
      "岗位选择"
    ],
    "title": "一个岗位工资高一点，但每天来回路上多花四十分钟。你会：",
    "feedback": "通勤不是小事，它会一点点磨掉人的耐心。"
  },
  {
    "id": "job-02",
    "eventKey": "pressure_requirement",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "继续看职责，判断压力到底来自哪里。",
        "evidenceText": "你不会只被一个词吓退，会先弄清真实工作内容。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "去搜评价，看看是不是长期加班。",
        "evidenceText": "你需要外部信息确认，不想只听招聘页面说得好。",
        "scoreHints": [
          "job",
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "如果成长空间真大，可以接受一定压力。",
        "evidenceText": "你不是怕累，是希望压力背后有值得换的东西。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "看到这四个字，我就先退出冷静一下。",
        "evidenceText": "你对消耗型岗位警觉很高，不想再被话术拖进去。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:pressure_requirement",
    "tags": [
      "抗压",
      "招聘话术",
      "风险识别",
      "岗位要求"
    ],
    "title": "招聘要求里写着“抗压能力强”，你最真实的反应是：",
    "feedback": "抗压不是不能写，但也不能把所有问题都推给人扛。"
  },
  {
    "id": "job-03",
    "eventKey": "resume_edit_resistance",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先把真实做过的项目列出来，不急着包装。",
        "evidenceText": "你更相信事实和证据，先把底稿整理清楚。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "找朋友帮看，怕自己写得太保守。",
        "evidenceText": "你知道旁观者有时更能看见你的价值。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接按目标岗位改一版，先让它能投。",
        "evidenceText": "你愿意先行动，再在反馈里慢慢调整。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "关掉文档，今天先不面对这个自己。",
        "evidenceText": "你不是没能力，是这件事勾起了太多压力和犹豫。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:resume_edit_resistance",
    "tags": [
      "简历",
      "自我表达",
      "过去经验",
      "重新整理"
    ],
    "title": "你准备改简历，打开旧版本发现上面写的自己都有点陌生。你会：",
    "feedback": "改简历难的不是排版，是重新讲清这几年做了什么。"
  },
  {
    "id": "job-04",
    "eventKey": "friend_referral_push",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先问岗位具体做什么，朋友推荐也要看匹配。",
        "evidenceText": "你很清楚人情归人情，工作还是要自己承受。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "相信朋友，但会再问几个关键细节。",
        "evidenceText": "你愿意接住好意，但不会完全把判断交出去。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "条件差不多就投，反正先聊聊不吃亏。",
        "evidenceText": "你对机会比较开放，不想错过可能的窗口。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "别人越催，我越想往后退一步。",
        "evidenceText": "你不喜欢被催着做决定，哪怕对方是好意。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:friend_referral_push",
    "tags": [
      "朋友推荐",
      "内推",
      "机会信任",
      "别想太多"
    ],
    "title": "朋友说某公司机会不错，让你“赶紧投，别想太多”。你会：",
    "feedback": "机会从朋友那里来，也不代表可以不判断。"
  },
  {
    "id": "job-05",
    "eventKey": "interview_change_reason",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "想稳定一点，不想每天都被临时安排。",
        "evidenceText": "你换工作的底层需求，是想要更可控的工作节奏。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "想成长，但不想拿所有休息去换。",
        "evidenceText": "你不是排斥进步，而是希望成长别变成透支。",
        "scoreHints": [
          "careerGrowth",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "想离家近一点，通勤真的会磨人。",
        "evidenceText": "你很现实地看见了生活成本，不再只看岗位光环。",
        "scoreHints": [
          "decisionReal",
          "paceSoft"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "想换个环境，看自己还能不能动起来。",
        "evidenceText": "你有变化的念头，但也带着一点不确定和试探。",
        "scoreHints": [
          "careerGrowth",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:interview_change_reason",
    "tags": [
      "面试",
      "换工作原因",
      "真实想法",
      "表达"
    ],
    "title": "面试官问“你为什么想换工作”，你心里最真实的版本是：",
    "feedback": "真实原因常常不能照原话说，但自己心里一定知道。"
  },
  {
    "id": "job-06",
    "eventKey": "probation_unknown",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "问清转正指标和评估时间。",
        "evidenceText": "你需要明确标准，不想把结果交给模糊感觉。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "问团队以前转正情况，看是不是正常。",
        "evidenceText": "你会通过真实案例判断风险，不只听官方说法。",
        "scoreHints": [
          "loveOpen",
          "job"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "如果岗位不错，可以先进去再观察。",
        "evidenceText": "你愿意先进入现场判断，不想只在外面猜。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "标准说不清，我心里会先打折。",
        "evidenceText": "你对模糊承诺不太信任，不想一开始就悬着。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:probation_unknown",
    "tags": [
      "试用期",
      "转正标准",
      "不确定",
      "风险"
    ],
    "title": "对方说试用期三个月，转正标准“看综合表现”。你会：",
    "feedback": "越重要的事，越不能只靠一句看表现。"
  },
  {
    "id": "job-07",
    "eventKey": "stable_vs_growth",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先稳住，至少别在没准备好时乱跳。",
        "evidenceText": "你更重视安全感，变化必须建立在准备之上。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "边稳边看机会，不把话说太死。",
        "evidenceText": "你在给自己留后路，也给现实留余地。",
        "scoreHints": [
          "careerStable",
          "careerGrowth",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "如果有好机会，我愿意试一次。",
        "evidenceText": "你不想一直困在熟悉里，机会来了愿意动。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我不是不动，是还没找到一个说服自己的理由。",
        "evidenceText": "你真正需要的是确定感，不是别人一句快点。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:stable_vs_growth",
    "tags": [
      "稳定",
      "成长",
      "卡住",
      "选择"
    ],
    "title": "现在这份工作还算稳，但你又觉得自己像被卡住。你更接近：",
    "feedback": "稳不稳和开不开心，有时会拉扯很久。"
  },
  {
    "id": "job-08",
    "eventKey": "job_offer_ask_family",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先听他们说完，再讲自己的考虑。",
        "evidenceText": "你会尊重家人的担心，但也想把选择讲清楚。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "不急着争，先把备选方案准备好。",
        "evidenceText": "你更习惯用准备降低冲突，而不是现场硬说服。",
        "scoreHints": [
          "paceSoft",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说我想试试，不想一直耗着。",
        "evidenceText": "你有行动冲动，希望自己的选择被看见。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "这事先不讲，免得又被问一晚上。",
        "evidenceText": "你不是没有想法，是不想在没准备好时被追问。",
        "scoreHints": [
          "antiRoutine",
          "loveSlow",
          "escape"
        ]
      }
    ],
    "branch": "job",
    "sceneType": "job",
    "evidenceKey": "job:job_offer_ask_family",
    "tags": [
      "家里建议",
      "稳定",
      "换口气",
      "沟通"
    ],
    "title": "家里人说“工作嘛，稳定最重要”，但你心里想换口气。你会：",
    "feedback": "长辈说的是安全，你想要的是一点新的可能。"
  },
  {
    "id": "love-01",
    "eventKey": "chat_hot_cold",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "忙可以说，别让我一直猜。",
        "evidenceText": "你在关系里最需要清楚回应，不喜欢悬着。",
        "scoreHints": [
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "我会先观察几天，不急着下结论。",
        "evidenceText": "你愿意给对方一点空间，也给自己一点判断时间。",
        "scoreHints": [
          "loveSlow",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接问清楚，是忙还是没兴趣。",
        "evidenceText": "你不想把时间花在猜测上，更喜欢把话说开。",
        "scoreHints": [
          "loveOpen",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "算了，我不想把自己搞得这么累。",
        "evidenceText": "你对不稳定关系有退意，宁愿先保护自己。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:chat_hot_cold",
    "tags": [
      "忽冷忽热",
      "聊天",
      "安全感",
      "猜来猜去"
    ],
    "title": "对方聊天忽冷忽热，昨天很热情，今天又像消失了。你最受不了的是：",
    "feedback": "真正耗人的不是慢，是忽近忽远。"
  },
  {
    "id": "love-02",
    "eventKey": "reply_delay",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先不补话，看对方后面怎么接。",
        "evidenceText": "你会控制自己不追着解释，先看对方态度。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "心里有点失落，但表面说没事。",
        "evidenceText": "你容易把关系里的小刺先吞下去，不想显得太在意。",
        "scoreHints": [
          "decisionFeel",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "换个轻松说法，把话题接回来。",
        "evidenceText": "你有修复氛围的能力，不想让聊天就地冷掉。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "不回了，我也需要冷静一下。",
        "evidenceText": "你被敷衍感触发后，会先拉开距离保护自己。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:reply_delay",
    "tags": [
      "已读不回",
      "哈哈",
      "认真话",
      "回应"
    ],
    "title": "你发出去一段认真话，对方隔很久只回了“哈哈”。你会：",
    "feedback": "一个哈哈，有时候比不回还让人想多。"
  },
  {
    "id": "love-03",
    "eventKey": "first_meet_plan",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "一起定，至少各提一个选择。",
        "evidenceText": "你希望关系从一开始就有来有回，不想单方面安排。",
        "scoreHints": [
          "decisionReal",
          "loveOpen"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "我可以定，但对方要给明确反馈。",
        "evidenceText": "你愿意主动，只是不想对着空气做决定。",
        "scoreHints": [
          "careerStable",
          "loveOpen"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接给两个方案，让对方选。",
        "evidenceText": "你倾向高效推进，不喜欢一直绕。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "都可以这句话一出，我也有点不想定了。",
        "evidenceText": "你对没有参与感的关系会失去耐心。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:first_meet_plan",
    "tags": [
      "第一次见面",
      "安排",
      "都可以",
      "主动性"
    ],
    "title": "第一次见面，对方说“你定嘛，我都可以”。你会更希望：",
    "feedback": "都可以听起随和，但安排的人也会累。"
  },
  {
    "id": "love-04",
    "eventKey": "family_urge_relationship",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "有合适的会说，别天天问。",
        "evidenceText": "你想保留自己的节奏，也愿意给家里一个交代。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先笑着带过，不想把气氛弄僵。",
        "evidenceText": "你会顾及家里情绪，但压力还是留在自己身上。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说这事急不来，别催。",
        "evidenceText": "你更愿意把边界说出来，不想被反复推。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我已婚/有对象了，这题对我不适用。",
        "evidenceText": "你不该被继续引导到红娘转化，结果页要自然跳过。",
        "scoreHints": [
          "matchmakerSuppress",
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:family_urge_relationship",
    "tags": [
      "家里催问",
      "对象",
      "压力",
      "进展"
    ],
    "title": "家里又问“对象的事有进展没”，你最想怎么回：",
    "feedback": "关心有时很重，尤其当它变成反复追问。"
  },
  {
    "id": "love-05",
    "eventKey": "partner_conflict",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "整理好再说，别一开口就变吵架。",
        "evidenceText": "你很在意表达质量，不想让情绪盖过问题。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先缓一会儿，等心情稳了再聊。",
        "evidenceText": "你需要一点缓冲，不喜欢在情绪最高时处理关系。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "尽快说清楚，不让问题过夜。",
        "evidenceText": "你希望关系问题及时处理，拖久了更耗你。",
        "scoreHints": [
          "loveOpen",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "如果一直这样，我会慢慢退出来。",
        "evidenceText": "你对长期消耗会选择保护自己，不想反复解释。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:partner_conflict",
    "tags": [
      "关系沟通",
      "不舒服",
      "边界",
      "表达"
    ],
    "title": "如果和对象/暧昧对象有点不舒服，你更倾向于：",
    "feedback": "关系里的小不舒服，处理方式差别很大。"
  },
  {
    "id": "love-06",
    "eventKey": "friend_relationship_advice",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看对方有没有稳定回应。",
        "evidenceText": "你判断关系很看重持续性，不被一两句好听话带走。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先问朋友自己到底想要什么。",
        "evidenceText": "你知道关系不是判题，关键是当事人舒服不舒服。",
        "scoreHints": [
          "decisionFeel",
          "loveOpen"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接指出哪里不对劲，别让朋友陷太深。",
        "evidenceText": "你更愿意说实话，哪怕话不好听。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我看得出问题，但不想把话说太绝。",
        "evidenceText": "你会保留余地，也怕自己的判断伤到别人。",
        "scoreHints": [
          "loveSlow",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:friend_relationship_advice",
    "tags": [
      "朋友求助",
      "聊天记录",
      "判断",
      "关系投射"
    ],
    "title": "朋友给你看聊天记录，让你判断对方有没有意思。你第一反应是：",
    "feedback": "帮别人看关系，有时也会照见自己的判断方式。"
  },
  {
    "id": "love-07",
    "eventKey": "boundary_talk",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "说明自己平时回复没那么快。",
        "evidenceText": "你会用清楚的话提前设边界，避免后面误会。",
        "scoreHints": [
          "decisionReal",
          "loveOpen"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先减少回复频率，让对方慢慢感受到。",
        "evidenceText": "你不太想直接泼冷水，更习惯温和拉开一点。",
        "scoreHints": [
          "loveSlow",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说最近比较忙，别期待秒回。",
        "evidenceText": "你希望关系从一开始就不要互相消耗。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "太密了我会下意识想躲。",
        "evidenceText": "你对过快靠近很敏感，容易先退回安全距离。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:boundary_talk",
    "tags": [
      "聊天频率",
      "边界",
      "刚认识",
      "节奏"
    ],
    "title": "刚认识的人每天都想聊天，你还没到那个状态。你会：",
    "feedback": "热情没错，但节奏不合也是真的累。"
  },
  {
    "id": "love-08",
    "eventKey": "clear_talk_or_keep_observe",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "再观察一阵，看行动是不是稳定。",
        "evidenceText": "你不急着下判断，更相信长期表现。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "顺着聊，但不把自己放太进去。",
        "evidenceText": "你愿意保持互动，但会给自己留退路。",
        "scoreHints": [
          "loveOpen",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "找机会轻轻问清楚，别一直猜。",
        "evidenceText": "你不想让关系卡在不明不白里。",
        "scoreHints": [
          "loveOpen",
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "不明说就算了，我不想演猜谜。",
        "evidenceText": "你讨厌含糊消耗，宁愿关系简单一点。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "love",
    "sceneType": "love",
    "evidenceKey": "love:clear_talk_or_keep_observe",
    "tags": [
      "暧昧",
      "观察",
      "明说",
      "确认"
    ],
    "title": "你感觉对方好像有意思，但又没有明说。你会：",
    "feedback": "暧昧最消耗人的地方，就是谁都没有把话放稳。"
  },
  {
    "id": "social-01",
    "eventKey": "dinner_status_round",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "简单说几句工作和生活，够用就行。",
        "evidenceText": "你会维持场面，但不会把自己全摊开。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "讲点轻松好耍的，让大家接得上话。",
        "evidenceText": "你有把场子撑起来的能力，知道怎么让气氛不冷。",
        "scoreHints": [
          "loveOpen",
          "paceFast",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "只说能说的，私事就点到为止。",
        "evidenceText": "你很清楚公开场合的边界，不想被追问太深。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "笑一下说最近平平无奇，赶紧过。",
        "evidenceText": "你今天不太想被看见，只想安全过关。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:dinner_status_round",
    "tags": [
      "饭局",
      "近况",
      "公开表达",
      "熟人局"
    ],
    "title": "饭局上大家开始轮流讲近况，马上轮到你。你会：",
    "feedback": "近况这种东西，能讲多少要看今天电量。"
  },
  {
    "id": "social-02",
    "eventKey": "group_mention",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看上下文，别乱接。",
        "evidenceText": "你讲话前会先确认背景，不想随便表态。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "用一句轻松话接住，不让群里冷场。",
        "evidenceText": "你有接话能力，能把尴尬变得没那么硬。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "只说事实，不站队。",
        "evidenceText": "你倾向稳妥表达，不想被卷进争论。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "假装刚看到，晚点再回。",
        "evidenceText": "你对突然被拉上场有点抗拒，想先躲一下。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:group_mention",
    "tags": [
      "群艾特",
      "被点名",
      "接话",
      "表达"
    ],
    "title": "群里突然有人艾特你：“你来评价一下嘛。”你最可能：",
    "feedback": "被点名的时候，社交电量会瞬间亮一下。"
  },
  {
    "id": "social-03",
    "eventKey": "stranger_party",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先观察大家怎么聊天，再慢慢加入。",
        "evidenceText": "你进入新场合会先看氛围，不急着表现。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "找到一个聊得来的，就先和他坐近点。",
        "evidenceText": "你不是排斥陌生人，只是需要一个舒服入口。",
        "scoreHints": [
          "loveOpen",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "主动接几句话，让自己快点融进去。",
        "evidenceText": "你愿意主动打开场面，不想一直当旁观者。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "待一会儿就想撤，能礼貌离开最好。",
        "evidenceText": "你对陌生局消耗很敏感，不想硬撑热闹。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:stranger_party",
    "tags": [
      "不熟的局",
      "热情",
      "融入",
      "社交电量"
    ],
    "title": "朋友带你去一个不太熟的局，大家都挺热情。你会：",
    "feedback": "热闹不等于放松，不熟的局尤其考验状态。"
  },
  {
    "id": "social-04",
    "eventKey": "friend_complaint",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先听完，再帮他理一理重点。",
        "evidenceText": "你陪伴别人时会给结构，让情绪慢慢落地。",
        "scoreHints": [
          "decisionReal",
          "loveOpen"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先站他这边，让他别一个人闷着。",
        "evidenceText": "你很会给情绪支持，先让朋友感觉被接住。",
        "scoreHints": [
          "decisionFeel",
          "loveOpen"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接问他现在最需要解决哪件事。",
        "evidenceText": "你偏行动派，希望吐槽后能往前走一步。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我会听，但听完自己也有点累。",
        "evidenceText": "你能共情别人，但也容易把别人的情绪带回家。",
        "scoreHints": [
          "paceSoft",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:friend_complaint",
    "tags": [
      "朋友吐槽",
      "陪伴",
      "深夜聊天",
      "支持"
    ],
    "title": "朋友深夜找你吐槽，说自己最近真的很烦。你会：",
    "feedback": "听人吐槽，也能看出你怎么陪伴别人。"
  },
  {
    "id": "social-05",
    "eventKey": "photo_moments",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看看照片好不好，别随便发。",
        "evidenceText": "你对公开展示有标准，不想随便把自己放出去。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "熟人局可以发，大家开心就行。",
        "evidenceText": "你愿意分享舒服的关系，不排斥被看见。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "可以，顺便配一句好耍的。",
        "evidenceText": "你比较能享受分享带来的互动。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "你们发吧，我就不出镜了。",
        "evidenceText": "你今天不想被展示，更想保持一点隐身感。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:photo_moments",
    "tags": [
      "合照",
      "朋友圈",
      "展示",
      "边界"
    ],
    "title": "朋友拍了合照说“发朋友圈嘛”，你第一反应是：",
    "feedback": "发不发朋友圈，很多时候不是照片问题。"
  },
  {
    "id": "social-06",
    "eventKey": "leave_party_early",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "找个合适节点，说自己明天有事。",
        "evidenceText": "你会照顾场面，也会给自己留出口。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "再坐一会儿，等大家转场时走。",
        "evidenceText": "你不想破坏气氛，所以选择温和退出。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说今天累了，先撤。",
        "evidenceText": "你更愿意真实表达状态，不硬撑到最后。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "人还在，心已经回屋头了。",
        "evidenceText": "你社交电量已经见底，最想尽快安静下来。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:leave_party_early",
    "tags": [
      "饭局退场",
      "没电",
      "礼貌离开",
      "社交边界"
    ],
    "title": "饭局还在继续，但你已经明显没电了。你会：",
    "feedback": "会退场的人，才有机会下次继续出现。"
  },
  {
    "id": "social-07",
    "eventKey": "old_classmate_compare",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "听着就好，不主动接这个话题。",
        "evidenceText": "你能识别比较场，不想被拉进去。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "用玩笑带过去，别让气氛太硬。",
        "evidenceText": "你会用轻松方式化解压力，不让场面尴尬。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "换个话题，聊点大家都舒服的。",
        "evidenceText": "你愿意主动调节局面，减少无意义比较。",
        "scoreHints": [
          "paceFast",
          "loveOpen"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "下次这种局，我可能要慎重参加。",
        "evidenceText": "你对比较型社交很疲惫，会重新筛选关系。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:old_classmate_compare",
    "tags": [
      "老同学",
      "比较",
      "收入",
      "聚会"
    ],
    "title": "老同学聚会，有人开始聊房子、车子、收入。你会：",
    "feedback": "有些聊天看起来热闹，其实很容易让人紧。"
  },
  {
    "id": "social-08",
    "eventKey": "local_comment_reply",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看清楚信息来源，再判断。",
        "evidenceText": "你对公共话题比较谨慎，不想被情绪带跑。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "看看大家咋说，偶尔点个赞。",
        "evidenceText": "你喜欢观察本地人的真实反应，但不一定下场。",
        "scoreHints": [
          "loveSlow",
          "local"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "有明确看法就评论两句。",
        "evidenceText": "你愿意参与公共讨论，希望把话说清楚。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "吵太凶就划走，今天不想吸收这些。",
        "evidenceText": "你会主动远离高消耗信息，给自己省电。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "social",
    "sceneType": "social",
    "evidenceKey": "social:local_comment_reply",
    "tags": [
      "大宜宾",
      "评论区",
      "本地热点",
      "参与感"
    ],
    "title": "你在大宜宾看到一个本地热点，评论区吵得很热闹。你会：",
    "feedback": "评论区也是一种社交场，只是声音更多。"
  },
  {
    "id": "recovery-01",
    "eventKey": "half_day_free",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "补一觉，醒了再说。",
        "evidenceText": "你现在最需要身体先恢复，别的事可以往后放。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "找个地方吃点东西，慢慢坐一会儿。",
        "evidenceText": "你需要一点具体的安慰，让自己从忙里退出来。",
        "scoreHints": [
          "decisionFeel",
          "local"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "去江边走一圈，把脑壳吹清醒。",
        "evidenceText": "你适合用空间转换心情，让混乱慢慢散掉。",
        "scoreHints": [
          "recovery",
          "local"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "啥都不安排，让时间空着。",
        "evidenceText": "你最想要的是不被计划占满，哪怕只是发呆。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:half_day_free",
    "tags": [
      "空半天",
      "休息方式",
      "没人催",
      "恢复"
    ],
    "title": "突然空出半天时间，没有工作、没有约、没人催。你最想：",
    "feedback": "真正的休息，不一定要看起来很有安排。"
  },
  {
    "id": "recovery-02",
    "eventKey": "phone_silent",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "把重要的人和事留出来，其他先静音。",
        "evidenceText": "你会有选择地隔离信息，不是一刀切逃避。",
        "scoreHints": [
          "decisionReal",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先回完必须回的，再给自己一小时安静。",
        "evidenceText": "你仍然顾及责任，但开始给自己留边界。",
        "scoreHints": [
          "careerStable",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说晚点统一回复。",
        "evidenceText": "你更愿意把自己的节奏说出来，减少反复打断。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "手机扣过去，谁都先别找我。",
        "evidenceText": "你信息负担已经过线，最需要马上断开一会儿。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:phone_silent",
    "tags": [
      "消息太多",
      "手机静音",
      "信息隔离",
      "省电"
    ],
    "title": "今天消息太多，你终于有点受不了。你会：",
    "feedback": "有时候不是人冷淡，是消息真的太密。"
  },
  {
    "id": "recovery-03",
    "eventKey": "sleep_debt",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "洗漱完直接睡，别再给自己加任务。",
        "evidenceText": "你知道身体已经在提醒，今天最重要的是停下来。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "吃点热的，再安稳睡。",
        "evidenceText": "你需要一点生活里的照顾感，再进入休息。",
        "scoreHints": [
          "decisionFeel",
          "local"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "先把明天要紧的事列一下，睡得踏实。",
        "evidenceText": "你休息前需要把不确定感收一收。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "明明很困，还是忍不住刷手机。",
        "evidenceText": "你不是不想休息，是脑子还没从白天退出来。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:sleep_debt",
    "tags": [
      "睡眠",
      "早点回家",
      "身体优先",
      "恢复"
    ],
    "title": "连续几天没睡好，今天终于可以早点回家。你会：",
    "feedback": "睡觉不是偷懒，是很多状态的底线。"
  },
  {
    "id": "recovery-04",
    "eventKey": "clean_room_control",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先收最碍眼的一块，不搞大工程。",
        "evidenceText": "你会用小行动找回控制感，不把自己逼太满。",
        "scoreHints": [
          "decisionReal",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "放点音乐慢慢收，能收多少算多少。",
        "evidenceText": "你需要温和一点的节奏，让事情没那么像任务。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "定个二十分钟，快速处理完。",
        "evidenceText": "你喜欢明确时间和目标，做完就不再想。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "今天不收了，乱就乱嘛。",
        "evidenceText": "你已经不想再给自己加标准，先不为难自己。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:clean_room_control",
    "tags": [
      "收拾房间",
      "控制感",
      "屋头",
      "心情"
    ],
    "title": "屋头有点乱，你本来很累，但又觉得看着更烦。你会：",
    "feedback": "收拾屋头，有时候是在给心里腾位置。"
  },
  {
    "id": "recovery-05",
    "eventKey": "food_comfort",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "吃熟悉的老味道，不想踩雷。",
        "evidenceText": "你累的时候更需要确定感，熟悉比新鲜重要。",
        "scoreHints": [
          "careerStable",
          "local"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "找朋友一起吃，顺便摆两句。",
        "evidenceText": "你适合通过轻松陪伴恢复，不想一个人闷着。",
        "scoreHints": [
          "loveOpen",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "试一家新店，给今天换点新鲜感。",
        "evidenceText": "你需要一点变化，让疲惫不要一直停在原地。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "不纠结，能填饱就行。",
        "evidenceText": "你今天已经不想再做选择，只想把基本状态顾住。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:food_comfort",
    "tags": [
      "吃点好的",
      "情绪安慰",
      "夜宵",
      "恢复"
    ],
    "title": "忙了一天，你想吃点东西安慰自己。你会选：",
    "feedback": "人累的时候，吃什么也会暴露一点状态。"
  },
  {
    "id": "recovery-06",
    "eventKey": "night_walk_alone",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "最近哪些事要处理，慢慢排一下。",
        "evidenceText": "你独处时会整理现实问题，让心里更有底。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "其实有些话，白天没机会好好说。",
        "evidenceText": "你需要安静空间把情绪慢慢放出来。",
        "scoreHints": [
          "decisionFeel",
          "loveSlow"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "明天先做一件能改变的小事。",
        "evidenceText": "你会把独处变成行动入口，不让想法一直转。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "什么都不想，只想让风吹一会儿。",
        "evidenceText": "你不是没有想法，是现在更需要彻底停一下。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:night_walk_alone",
    "tags": [
      "江边",
      "夜走",
      "独处",
      "状态"
    ],
    "title": "晚上你一个人走在江边，风吹过来，你最容易想到：",
    "feedback": "人在安静下来的时候，才听得见自己真正累在哪。"
  },
  {
    "id": "recovery-07",
    "eventKey": "friend_asks_really_ok",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "说还行，但挑一件最烦的事讲。",
        "evidenceText": "你不容易完全摊开，但愿意给信任的人一点入口。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "如果对方可靠，我会多说几句。",
        "evidenceText": "你需要安全感，一旦确认对方接得住，就愿意表达。",
        "scoreHints": [
          "loveOpen",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说最近确实有点累。",
        "evidenceText": "你开始愿意承认状态，不再只说没事。",
        "scoreHints": [
          "paceFast",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "笑一下说没事，其实不想展开。",
        "evidenceText": "你习惯把真实状态收回去，怕讲出来更累。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:friend_asks_really_ok",
    "tags": [
      "朋友关心",
      "还好吗",
      "情绪表达",
      "脆弱"
    ],
    "title": "朋友认真问你“你最近真的还好吗？”你会：",
    "feedback": "能被认真问一句，其实很难得。"
  },
  {
    "id": "recovery-08",
    "eventKey": "do_nothing_permission",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "少处理一个临时冒出来的工作。",
        "evidenceText": "你最想减少的是不可控打断，不是正常做事。",
        "scoreHints": [
          "work",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "少回复几个没重点的消息。",
        "evidenceText": "你需要从信息里退出来，给脑子留点空。",
        "scoreHints": [
          "recovery",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "少参加一个不熟的局。",
        "evidenceText": "你开始筛选社交，不想把电量花在硬撑上。",
        "scoreHints": [
          "social",
          "loveSlow"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "少解释一次自己的选择。",
        "evidenceText": "你最累的是被追问和证明，想安静按自己的来。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "recovery",
    "sceneType": "recovery",
    "evidenceKey": "recovery:do_nothing_permission",
    "tags": [
      "少做一件事",
      "允许停下",
      "压力源",
      "今天状态"
    ],
    "title": "如果今天可以少做一件事，你最想少做的是：",
    "feedback": "少做一点，不等于日子就塌了。"
  },
  {
    "id": "anti-01",
    "eventKey": "less_reply",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看有没有重点，有再回。",
        "evidenceText": "你想把注意力留给真正重要的事。",
        "scoreHints": [
          "decisionReal",
          "antiRoutine"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "晚点统一回，不让手机牵着走。",
        "evidenceText": "你在重新拿回自己的节奏。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说我现在不方便聊。",
        "evidenceText": "你愿意把边界讲出来，减少误会。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "今天不想解释为什么不回。",
        "evidenceText": "你最想摆脱的，是连沉默都要说明理由。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:less_reply",
    "tags": [
      "少回消息",
      "信息疲劳",
      "不急事",
      "边界"
    ],
    "title": "别人连续发来几条消息，但都不是急事。你最想：",
    "feedback": "不是每条消息，都值得立刻交出注意力。"
  },
  {
    "id": "anti-02",
    "eventKey": "less_explain",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "简单说一个理由，够用就行。",
        "evidenceText": "你会给基本交代，但不想把自己全部摊开。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "换个轻松说法，把问题带过去。",
        "evidenceText": "你习惯用温和方式减少冲突。",
        "scoreHints": [
          "decisionFeel",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说这是我想清楚后的选择。",
        "evidenceText": "你更愿意承认自己的决定，不再等所有人同意。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "不讲了，越讲越像在接受审问。",
        "evidenceText": "你对解释压力很敏感，只想保留自己的空间。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:less_explain",
    "tags": [
      "少解释",
      "选择",
      "边界",
      "被追问"
    ],
    "title": "有人问你“你为什么要这样选”，你其实不太想讲太多。你会：",
    "feedback": "有些选择，确实不需要向所有人讲完整过程。"
  },
  {
    "id": "anti-03",
    "eventKey": "less_party",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先问清楚都有谁，别盲目答应。",
        "evidenceText": "你不是排斥社交，是需要知道自己会面对什么。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "如果有熟人在，可以去坐一会儿。",
        "evidenceText": "你愿意参与，但需要一个舒服的连接点。",
        "scoreHints": [
          "loveOpen",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "想去就去，不想去就直接说。",
        "evidenceText": "你更看重当下真实状态，不想勉强自己。",
        "scoreHints": [
          "paceFast",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "随便两个字，听起就不太随便。",
        "evidenceText": "你对模糊邀约很警觉，怕去了还要硬撑。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:less_party",
    "tags": [
      "不熟的局",
      "不想参加",
      "随便",
      "社交筛选"
    ],
    "title": "一个不熟的局喊你去，说“大家都很随便”。你心里想的是：",
    "feedback": "越说随便，有时越让人不知道怎么放松。"
  },
  {
    "id": "anti-04",
    "eventKey": "less_plan",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "保留最重要的一件，其他往后挪。",
        "evidenceText": "你能在混乱里抓重点，不会被计划绑死。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先做最轻的一件，让自己启动起来。",
        "evidenceText": "你需要温和进入状态，不适合一上来就硬冲。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "重新排顺序，今天换个打法。",
        "evidenceText": "你愿意灵活调整，不把变化当失败。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "今天先不演自律了。",
        "evidenceText": "你最想放下的是必须按表表现得很好的压力。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:less_plan",
    "tags": [
      "计划",
      "不想执行",
      "自由感",
      "节奏"
    ],
    "title": "你把今天计划排得很满，结果一早醒来就不想按计划走。你会：",
    "feedback": "计划是工具，不该变成压自己的东西。"
  },
  {
    "id": "anti-05",
    "eventKey": "one_day_leave",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "突然冒出来的工作消息。",
        "evidenceText": "你想要的自由，首先是不被临时安排打断。",
        "scoreHints": [
          "work",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "别人问我为什么没安排。",
        "evidenceText": "你不想连休息都要向别人解释。",
        "scoreHints": [
          "antiRoutine",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "必须热闹、必须有意义的活动。",
        "evidenceText": "你想让一天按照自己的感受来，而不是看起来精彩。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "任何人替我决定今天怎么过。",
        "evidenceText": "你最近最需要自主感，不想再被别人安排。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:one_day_leave",
    "tags": [
      "一天自由",
      "不被打扰",
      "压力源",
      "自主感"
    ],
    "title": "如果给你一天完全属于自己的时间，你最不想出现的是：",
    "feedback": "一个人真正想躲开的，往往就是最近最耗他的。"
  },
  {
    "id": "anti-06",
    "eventKey": "say_no",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先问清楚我为什么必须接。",
        "evidenceText": "你开始追问责任来源，不再默认接住。",
        "scoreHints": [
          "decisionReal",
          "work"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "能给建议，但不替他做完。",
        "evidenceText": "你愿意帮忙，但会把参与程度控制住。",
        "scoreHints": [
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说我现在排不开。",
        "evidenceText": "你不想用委婉换来更多误会。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我最怕这种夸着夸着就把事丢过来。",
        "evidenceText": "你已经识别这种压力包装，对它很不耐烦。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:say_no",
    "tags": [
      "拒绝",
      "被推事",
      "会处理",
      "边界"
    ],
    "title": "有人把一个麻烦事推给你，还说“你比较会处理”。你会：",
    "feedback": "会处理，不代表永远要多处理。"
  },
  {
    "id": "anti-07",
    "eventKey": "unknown_choice",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "选最接近的，先不纠结太久。",
        "evidenceText": "你愿意在有限选项里做一个暂时决定。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "想换个说法，因为这些都不完全像我。",
        "evidenceText": "你对自我描述很敏感，不喜欢被简单概括。",
        "scoreHints": [
          "decisionFeel",
          "antiRoutine"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "先看题到底想问什么，再选。",
        "evidenceText": "你会拆题，不轻易被表面选项带走。",
        "scoreHints": [
          "decisionReal",
          "loveSlow"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我想跳过，这题有点把人框住了。",
        "evidenceText": "你不喜欢被固定答案限制，隐藏款倾向很明显。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:unknown_choice",
    "tags": [
      "选不出来",
      "不想被框",
      "差一点",
      "隐藏款"
    ],
    "title": "这套题里有些选项你都觉得差一点，你会：",
    "feedback": "选不出来，有时不是你纠结，是选项太窄。"
  },
  {
    "id": "anti-08",
    "eventKey": "change_without_pressure",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先准备，再找合适时机动。",
        "evidenceText": "你不是不动，而是要让变化更稳一点。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "慢慢试一点，不把话说满。",
        "evidenceText": "你需要低压力试探，不喜欢一上来立目标。",
        "scoreHints": [
          "paceSoft",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "机会合适就动，别一直等完美。",
        "evidenceText": "你知道一直准备也会变成拖延。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "最怕别人天天问我开始没有。",
        "evidenceText": "你对催促很敏感，越催越想把门关上。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "antiRoutine",
    "sceneType": "antiRoutine",
    "evidenceKey": "antiRoutine:change_without_pressure",
    "tags": [
      "想变化",
      "别催",
      "自主节奏",
      "看情况"
    ],
    "title": "你想有点变化，但又不想被别人催着走。你更像：",
    "feedback": "想变和讨厌被催，可以同时存在。"
  },
  {
    "id": "local-01",
    "eventKey": "hot_shop_queue",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "好吃可以等，但别排太离谱。",
        "evidenceText": "你愿意体验本地新鲜事，但会算时间成本。",
        "scoreHints": [
          "decisionReal",
          "local"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "人太多就算了，我不想凑人头。",
        "evidenceText": "你对热闹有筛选，不想把时间花在拥挤里。",
        "scoreHints": [
          "loveSlow",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "朋友都想去，我可以陪一哈。",
        "evidenceText": "你愿意为了朋友参与热闹，重点不只是吃。",
        "scoreHints": [
          "loveOpen",
          "social"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先收藏，等热度过了再去。",
        "evidenceText": "你不急着跟风，更想按自己的舒服时间来。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:hot_shop_queue",
    "tags": [
      "新店",
      "排队",
      "本地生活",
      "凑热闹"
    ],
    "title": "朋友说新开的店很火，要排很久。你会：",
    "feedback": "排队这事，排的是店，也排的是耐心。"
  },
  {
    "id": "local-02",
    "eventKey": "district_commute",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先确认材料带齐，少跑第二趟。",
        "evidenceText": "你很怕无效折返，所以会先把现实条件查清楚。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "能线上问清就先问，别白跑。",
        "evidenceText": "你会先降低不确定，不让自己白白消耗。",
        "scoreHints": [
          "decisionReal",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "必须办就早点出发，快去快回。",
        "evidenceText": "你偏行动派，不想把事情拖在心里。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "想到要跑一趟，已经开始累了。",
        "evidenceText": "你对低效奔波很敏感，最怕时间被这样吃掉。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:district_commute",
    "tags": [
      "区县来回",
      "办事",
      "通勤成本",
      "时间"
    ],
    "title": "你临时要从一个区县跑到另一个地方办事，路上可能折腾半天。你会：",
    "feedback": "本地生活的距离感，不只看地图，也看人累不累。"
  },
  {
    "id": "local-03",
    "eventKey": "app_post_help",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先把事实写清楚，别带太多情绪。",
        "evidenceText": "你希望问题被准确看见，而不是只被情绪淹没。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "先看看有没有类似帖子，学习别人怎么说。",
        "evidenceText": "你会先观察规则，再决定怎么参与。",
        "scoreHints": [
          "loveSlow",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接发，问题不说出来就没人知道。",
        "evidenceText": "你愿意主动求助，也相信公开表达有用。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "想发又怕麻烦，最后可能先忍一下。",
        "evidenceText": "你有求助需求，但也担心后续解释和回应太耗人。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:app_post_help",
    "tags": [
      "大宜宾发帖",
      "求助",
      "本地问题",
      "公开表达"
    ],
    "title": "遇到一件本地生活麻烦事，你考虑要不要在大宜宾发帖求助。你会：",
    "feedback": "求助不是丢脸，是把问题放到有回应的地方。"
  },
  {
    "id": "local-04",
    "eventKey": "local_event_ticket",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先看时间地点，确定能去再报名。",
        "evidenceText": "你不想冲动占名额，会先确认现实条件。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "问朋友要不要一起，有人一起更想去。",
        "evidenceText": "你喜欢把活动变成熟人连接，而不是单独完成。",
        "scoreHints": [
          "loveOpen",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "感兴趣就马上报，别等到没名额。",
        "evidenceText": "你愿意及时行动，不想让机会从手里滑走。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先收藏，结果经常收藏到结束。",
        "evidenceText": "你不是没兴趣，是行动容易被犹豫拖住。",
        "scoreHints": [
          "antiRoutine",
          "paceSoft",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:local_event_ticket",
    "tags": [
      "本地活动",
      "抢名额",
      "行动力",
      "大宜宾"
    ],
    "title": "大宜宾上有个本地活动，你挺想去，但名额有限。你会：",
    "feedback": "活动名额面前，行动力会很诚实。"
  },
  {
    "id": "local-05",
    "eventKey": "family_dinner_local",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "挑能说的说，别让场面冷掉。",
        "evidenceText": "你会维护家庭氛围，但不把自己全交出去。",
        "scoreHints": [
          "careerStable",
          "loveSlow"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "用玩笑带过，尽量不正面硬聊。",
        "evidenceText": "你习惯用轻松方式化解压力。",
        "scoreHints": [
          "decisionFeel",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "直接说这些我自己有安排。",
        "evidenceText": "你希望家人知道你有主意，不想被反复盘问。",
        "scoreHints": [
          "paceFast",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "我只想认真吃饭，不想开汇报会。",
        "evidenceText": "你对被集体关注很疲惫，只想保留一点清净。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:family_dinner_local",
    "tags": [
      "家里饭局",
      "长辈提问",
      "熟人压力",
      "本地家庭"
    ],
    "title": "家里饭局上，长辈开始问工作、对象、收入。你会：",
    "feedback": "家里饭局最热闹，也最容易让人紧一下。"
  },
  {
    "id": "local-06",
    "eventKey": "weather_heat",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "把事情一次办完，少来回跑。",
        "evidenceText": "你会用效率对抗热和烦，不想重复折腾。",
        "scoreHints": [
          "decisionReal",
          "paceFast"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "找个有空调的地方缓一哈。",
        "evidenceText": "你知道状态不好时先降温，别硬扛。",
        "scoreHints": [
          "recovery",
          "paceSoft"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "边吐槽边继续走，事情还是要办。",
        "evidenceText": "你能扛住现实麻烦，但也需要嘴上释放一下。",
        "scoreHints": [
          "careerStable",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "今天不适合出门，谁爱去谁去。",
        "evidenceText": "你对环境消耗反应直接，最想把自己撤回去。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:weather_heat",
    "tags": [
      "宜宾热天",
      "出门",
      "烦躁",
      "恢复"
    ],
    "title": "宜宾天一热，你刚出门就开始后悔。你最想：",
    "feedback": "热天会把人的耐心晒薄。"
  },
  {
    "id": "local-07",
    "eventKey": "night_snack_choice",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "选老味道，熟悉最稳。",
        "evidenceText": "你累的时候更想要确定的安慰。",
        "scoreHints": [
          "careerStable",
          "local"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "看朋友推荐，跟着大家不容易错。",
        "evidenceText": "你愿意借别人的经验减少选择压力。",
        "scoreHints": [
          "loveOpen",
          "social"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "试一家没吃过的，给晚上加点新鲜。",
        "evidenceText": "你需要一点小变化，给今天换个尾巴。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "选来选去，最后不想吃了。",
        "evidenceText": "你今天的决策电量偏低，连小选择都变累。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:night_snack_choice",
    "tags": [
      "夜宵",
      "选择困难",
      "本地吃喝",
      "安慰"
    ],
    "title": "晚上想吃夜宵，但又不知道吃什么。你会：",
    "feedback": "夜宵选择困难，有时不是嘴馋，是人累了。"
  },
  {
    "id": "local-08",
    "eventKey": "riverside_walk_limit",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "换成老城区走一圈，别老是同一个地方。",
        "evidenceText": "你需要真实变化，不想让放松也变成固定套路。",
        "scoreHints": [
          "decisionReal",
          "local"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "就在楼下走十分钟，不必非去江边。",
        "evidenceText": "你开始把恢复做小一点，更容易执行。",
        "scoreHints": [
          "paceSoft",
          "recovery"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "约朋友吃点东西，换一种方式散心。",
        "evidenceText": "你愿意用陪伴和吃喝替代单独吹风。",
        "scoreHints": [
          "loveOpen",
          "social"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "哪里都不想去，今天就在屋头待起。",
        "evidenceText": "你现在需要的不是地点，是不被安排。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "local",
    "sceneType": "local",
    "evidenceKey": "local:riverside_walk_limit",
    "tags": [
      "江边",
      "场景去重",
      "换个地方",
      "放松"
    ],
    "title": "你想去江边走走，但今天已经出现过好几个“去江边”的念头。你会：",
    "feedback": "同一个放松场景出现太多次，也会变得像套路。"
  },
  {
    "id": "final-01",
    "eventKey": "one_button_easy",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "工作少一点临时改来改去。",
        "evidenceText": "你最近最想要的是工作边界和清楚安排。",
        "scoreHints": [
          "work",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "机会靠谱一点，别让我一直收藏不敢投。",
        "evidenceText": "你在变化前需要更多确定感。",
        "scoreHints": [
          "job",
          "careerGrowth"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "关系里说话清楚一点，少让我猜。",
        "evidenceText": "你最怕的不是慢，是不清不楚。",
        "scoreHints": [
          "love",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "给我一天不用解释的自由。",
        "evidenceText": "你最想放下的是被催、被问、被安排。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:one_button_easy",
    "tags": [
      "最后收束",
      "轻松一点",
      "当前需求",
      "按钮"
    ],
    "title": "如果今晚给你一个按钮，只能让一件事轻松一点，你会选：",
    "feedback": "最后一题，看的是你最近最想放松哪一块。"
  },
  {
    "id": "final-02",
    "eventKey": "today_wish",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "今晚没有新的工作消息。",
        "evidenceText": "你需要一段确定不会被打断的下班时间。",
        "scoreHints": [
          "work",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "投出去的机会能有一个准信。",
        "evidenceText": "你希望变化不要一直悬着。",
        "scoreHints": [
          "job",
          "careerGrowth"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "重要的人能好好回一句话。",
        "evidenceText": "你需要稳定回应，让心别一直猜。",
        "scoreHints": [
          "love",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "所有人都先别催我。",
        "evidenceText": "你今天最缺的是自己的节奏和安静。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:today_wish",
    "tags": [
      "今天愿望",
      "小目标",
      "收束",
      "需求"
    ],
    "title": "如果今天只能许一个很小的愿望，你最想要：",
    "feedback": "小愿望有时候比大目标更诚实。"
  },
  {
    "id": "final-03",
    "eventKey": "friend_describe",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "看起来很稳，其实事不少。",
        "evidenceText": "你习惯把压力藏在稳定外表下面。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "嘴上说随便，其实心里有要求。",
        "evidenceText": "你不是没标准，只是不想每次都说破。",
        "scoreHints": [
          "decisionFeel",
          "loveSlow"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "有点想变，但还在观察。",
        "evidenceText": "你已经有变化念头，只是还没完全启动。",
        "scoreHints": [
          "careerGrowth",
          "paceSoft"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "普通选项装不下，得看当天心情。",
        "evidenceText": "你的状态不太愿意被固定归类。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:friend_describe",
    "tags": [
      "朋友形容",
      "镜像",
      "最近状态",
      "外在表现"
    ],
    "title": "如果朋友用一句话形容你最近的状态，最像：",
    "feedback": "别人眼里的你，可能只看见一部分。"
  },
  {
    "id": "final-04",
    "eventKey": "message_to_self",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "今天已经处理够多了，可以停了。",
        "evidenceText": "你需要允许自己从责任里退出来。",
        "scoreHints": [
          "careerStable",
          "recovery"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "不确定也没关系，先看清下一步。",
        "evidenceText": "你不必马上决定所有事，先确认一个小方向就好。",
        "scoreHints": [
          "job",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "别因为别人含糊，就怀疑自己太认真。",
        "evidenceText": "你在关系里需要被提醒：认真不是错。",
        "scoreHints": [
          "love",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "不想解释的时候，可以真的少说一点。",
        "evidenceText": "你需要把解释权拿回来，不向所有人证明。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:message_to_self",
    "tags": [
      "给自己一句话",
      "自我安慰",
      "今晚",
      "收束"
    ],
    "title": "如果给今晚的自己留一句话，你最想写：",
    "feedback": "写给自己的话，往往比说给别人听的更真。"
  },
  {
    "id": "final-05",
    "eventKey": "tonight_plan",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "把明天最要紧的一件事列出来，然后关掉。",
        "evidenceText": "你需要把现实放稳，再安心休息。",
        "scoreHints": [
          "decisionReal",
          "careerStable"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "给一个靠谱机会发出一次试探。",
        "evidenceText": "你适合用小行动打破一直收藏的状态。",
        "scoreHints": [
          "careerGrowth",
          "paceFast"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "给重要的人多说一句清楚话。",
        "evidenceText": "你需要让关系少一点猜测，多一点明白。",
        "scoreHints": [
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "洗澡、吃饭、别再安排新任务。",
        "evidenceText": "你今晚最该做的是停止给自己加码。",
        "scoreHints": [
          "recovery",
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:tonight_plan",
    "tags": [
      "今晚安排",
      "行动落地",
      "测后建议",
      "收尾"
    ],
    "title": "测完之后，今晚最适合你的安排是：",
    "feedback": "结果好不好，最后还是要落到今晚怎么过。"
  },
  {
    "id": "final-06",
    "eventKey": "avoid_one_thing",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "临时甩过来的锅。",
        "evidenceText": "你最怕边界不清的责任继续找上门。",
        "scoreHints": [
          "work",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "看起来不错但说不清的机会。",
        "evidenceText": "你不想再被模糊承诺消耗判断力。",
        "scoreHints": [
          "job",
          "decisionReal"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "忽冷忽热又不说明白的人。",
        "evidenceText": "你想远离关系里的反复猜测。",
        "scoreHints": [
          "love",
          "decisionFeel"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "任何需要我强行开心的局。",
        "evidenceText": "你不想再为了配合场面消耗自己。",
        "scoreHints": [
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:avoid_one_thing",
    "tags": [
      "避开一件事",
      "压力源",
      "明天",
      "收束"
    ],
    "title": "如果明天可以避开一件事，你最想避开：",
    "feedback": "想避开的地方，常常就是最近最耗的地方。"
  },
  {
    "id": "final-07",
    "eventKey": "keep_one_thing",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "一个清楚稳定的工作节奏。",
        "evidenceText": "你需要秩序感，它能让你少消耗很多。",
        "scoreHints": [
          "careerStable",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "一个还能期待的小机会。",
        "evidenceText": "你需要一点未来感，让日子不只是重复。",
        "scoreHints": [
          "careerGrowth",
          "decisionFeel"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "一个说话不用猜的人。",
        "evidenceText": "你在关系里最珍惜清楚和自然。",
        "scoreHints": [
          "loveOpen",
          "decisionReal"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "一段完全没人打扰的时间。",
        "evidenceText": "你的舒服区是把自己从外界声音里拿回来。",
        "scoreHints": [
          "antiRoutine",
          "recovery",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:keep_one_thing",
    "tags": [
      "保留什么",
      "舒服区",
      "支撑",
      "收束"
    ],
    "title": "如果最近只能保留一个让你舒服的东西，你会保留：",
    "feedback": "人会累，但也要知道什么还在支撑自己。"
  },
  {
    "id": "final-08",
    "eventKey": "tomorrow_start",
    "options": [
      {
        "id": "a",
        "label": "A",
        "text": "先把最烦的工作点确认清楚。",
        "evidenceText": "你适合先减少不确定，别让它占一整天。",
        "scoreHints": [
          "work",
          "decisionReal"
        ]
      },
      {
        "id": "b",
        "label": "B",
        "text": "投一个最靠谱的岗位，不再只收藏。",
        "evidenceText": "你适合用一次小行动回应想换口气的念头。",
        "scoreHints": [
          "job",
          "careerGrowth"
        ]
      },
      {
        "id": "c",
        "label": "C",
        "text": "把一句想说清楚的话发出去。",
        "evidenceText": "你适合让关系少一点猜，多一点真实。",
        "scoreHints": [
          "loveOpen",
          "paceFast"
        ]
      },
      {
        "id": "d",
        "label": "D",
        "text": "先睡醒、吃好，再决定今天怎么走。",
        "evidenceText": "你需要先照顾状态，再谈效率和选择。",
        "scoreHints": [
          "recovery",
          "antiRoutine",
          "escape"
        ]
      }
    ],
    "branch": "final",
    "sceneType": "final",
    "evidenceKey": "final:tomorrow_start",
    "tags": [
      "明天开始",
      "小行动",
      "收束",
      "下一步"
    ],
    "title": "明天早上醒来，如果只能先做一件小事，你会：",
    "feedback": "不用一下变很多，明天先动一小步。"
  }
] satisfies QuestionInput[];

function addScore<T extends string>(scores: Partial<Record<T, number>>, key: T) {
  scores[key] = (scores[key] ?? 0) + 2;
}

function buildOption(input: QuestionInput["options"][number]): LifeTestQuestionOption {
  const scores: Partial<LifeTestScores> = {};
  const branchScores: Partial<BranchScores> = {};

  for (const hint of input.scoreHints) {
    const axisScoreKey = axisScoreKeyByHint[hint];
    if (axisScoreKey) {
      addScore(scores, axisScoreKey);
    }

    const branchScoreKey = branchScoreKeyByHint[hint];
    if (branchScoreKey) {
      addScore(branchScores, branchScoreKey);
    }
  }

  return {
    id: input.id,
    label: input.label,
    text: input.text,
    evidenceText: input.evidenceText,
    scores,
    branchScores,
    isEscape: input.scoreHints.includes("escape"),
    suppressesMatchmaker: input.scoreHints.includes("matchmakerSuppress"),
  };
}

function buildQuestion(input: QuestionInput): LifeTestQuestion {
  return {
    id: input.id,
    branch: input.branch,
    eventKey: input.eventKey,
    sceneType: input.sceneType,
    evidenceKey: input.evidenceKey,
    title: input.title,
    feedback: input.feedback,
    tags: input.tags,
    options: input.options.map(buildOption),
  };
}

export const lifeTestQuestionBank = questionDefinitions.map(buildQuestion);
export const lifeTestCoreQuestions = lifeTestQuestionBank.filter(
  (question) => question.branch === "core",
);

const questionById = new Map(lifeTestQuestionBank.map((question) => [question.id, question]));

function questionsForBranch(branch: LifeTestQuestionBranch) {
  return lifeTestQuestionBank.filter((question) => question.branch === branch);
}

export function getLifeTestQuestionById(questionId: string) {
  return questionById.get(questionId);
}

function calculateLifeTestBranchScores(answers: LifeTestAnswer[]): BranchScores {
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
    const question = questionById.get(answer.questionId);
    const selected = question?.options.find((option) => option.id === answer.optionId);

    if (!selected?.branchScores) {
      continue;
    }

    for (const [key, value] of Object.entries(selected.branchScores)) {
      scores[key as LifeTestBranchScoreKey] += value ?? 0;
    }
  }

  return scores;
}

export function getLifeTestEscapeState(answers: LifeTestAnswer[]) {
  let escapeCount = 0;

  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
    const selected = question?.options.find((option) => option.id === answer.optionId);

    if (selected?.isEscape || answer.optionId === "d") {
      escapeCount += 1;
    }
  }

  return {
    escapeCount,
    hiddenPrompt: escapeCount >= 3,
    hiddenResult: escapeCount >= 5,
    hiddenTag: escapeCount >= 5 ? lifeTestHiddenTag : null,
  };
}

export function isLifeTestMatchmakerSuppressed(answers: LifeTestAnswer[]) {
  return answers.some((answer) => {
    const question = questionById.get(answer.questionId);
    const selected = question?.options.find((option) => option.id === answer.optionId);

    return selected?.suppressesMatchmaker === true;
  });
}

export function buildLifeTestQuestionFlow(answers: LifeTestAnswer[] = []) {
  const usedQuestionIds = new Set(lifeTestCoreQuestions.map((question) => question.id));
  const usedEventKeys = new Set(lifeTestCoreQuestions.map((question) => question.eventKey));
  const flow: LifeTestQuestion[] = [...lifeTestCoreQuestions];
  const branchPlan = getAdaptiveBranchPlan(answers);

  branchPlan.forEach((branch, branchIndex) => {
    const answeredQuestion = getAnsweredFlowQuestion(
      answers[flow.length],
      usedQuestionIds,
    );
    const question =
      answeredQuestion ??
      pickFlowQuestion(branch, answers, branchIndex, usedQuestionIds, usedEventKeys);
    flow.push(question);
    usedQuestionIds.add(question.id);
    usedEventKeys.add(question.eventKey);
  });

  const answeredFinalQuestion = getAnsweredFlowQuestion(
    answers[flow.length],
    usedQuestionIds,
  );
  const finalQuestion =
    answeredFinalQuestion?.branch === "final"
      ? answeredFinalQuestion
      : questionById.get("final-04") ?? questionsForBranch("final")[0];
  if (finalQuestion) {
    flow.push(finalQuestion);
  }

  return flow.slice(0, lifeTestQuestionCount);
}

function getAnsweredFlowQuestion(
  answer: LifeTestAnswer | undefined,
  usedQuestionIds: Set<string>,
) {
  if (!answer || usedQuestionIds.has(answer.questionId)) {
    return null;
  }

  const question = questionById.get(answer.questionId);

  if (!question || question.branch === "core") {
    return null;
  }

  return question;
}

function getRankedBranches(answers: LifeTestAnswer[]) {
  const branchScores = calculateLifeTestBranchScores(answers);
  const matchmakerSuppressed = isLifeTestMatchmakerSuppressed(answers);

  return adaptiveBranchOrder
    .filter((branch) => !(matchmakerSuppressed && branch === "love"))
    .map((branch, index) => ({
      branch,
      score: branchScores[branchScoreKeyByBranch[branch]],
      index,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.branch);
}

function getAdaptiveBranchPlan(answers: LifeTestAnswer[]) {
  const escapeState = getLifeTestEscapeState(answers);
  const rankedBranches = getRankedBranches(answers);
  const primary = escapeState.hiddenPrompt ? "antiRoutine" : rankedBranches[0] ?? "work";
  const secondary = rankedBranches.find((branch) => branch !== primary) ?? getFallbackSecondaryBranch(primary);
  const tertiary = rankedBranches.find((branch) => branch !== primary && branch !== secondary) ?? "local";

  return [primary, secondary, primary, tertiary, primary, secondary, primary] as AdaptiveBranch[];
}

function getFallbackSecondaryBranch(primary: AdaptiveBranch): AdaptiveBranch {
  return adaptiveBranchOrder.find((branch) => branch !== primary) ?? "local";
}

function pickFlowQuestion(
  branch: AdaptiveBranch,
  answers: LifeTestAnswer[],
  branchIndex: number,
  usedQuestionIds: Set<string>,
  usedEventKeys: Set<string>,
) {
  const candidates = questionsForBranch(branch).filter(
    (question) => !usedQuestionIds.has(question.id) && !usedEventKeys.has(question.eventKey),
  );
  const pool = candidates.length > 0 ? candidates : questionsForBranch(branch);
  const seed = getAnswerSeed(answers) + branchIndex;

  return pickRotated(pool, seed) ?? lifeTestCoreQuestions[0];
}

function pickRotated<T>(items: T[], seed: number) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.abs(seed) % items.length] ?? items[0];
}

function getAnswerSeed(answers: LifeTestAnswer[]) {
  return answers.reduce((total, answer, index) => {
    const optionOffset = answer.optionId.charCodeAt(0) - 96;
    return total + optionOffset * (index + 1);
  }, 0);
}

export const lifeTestQuestions = buildLifeTestQuestionFlow();
