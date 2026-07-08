import { lifeTestCtas } from "@/features/life-test/config/ctas";
import type {
  LifeTestAxes,
  LifeTestResultCode,
  LifeTestResultType,
} from "@/features/life-test/types";

const jobUrl = lifeTestCtas.job.url;
const matchUrl = lifeTestCtas.matchmaker.url;

type GeneratedResultFields =
  | "posterBaseImageUrl"
  | "imagePrompt"
  | "analysisTitle"
  | "analysisBody"
  | "comfortZone"
  | "blindSpot"
  | "todayAdvice"
  | "evidenceFallbacks"
  | "posterTitle"
  | "posterSubtitle"
  | "posterTags"
  | "posterInsightLines"
  | "posterSealText";

type ResultInput = Omit<LifeTestResultType, GeneratedResultFields> &
  Partial<Pick<LifeTestResultType, GeneratedResultFields>>;

const resultAnalysisBodies: Record<LifeTestResultCode, string> = {
  "stable-slow-soft-real":
    "你这类状态很像把伞带在包里的人：不一定天天用，但心里有数。遇到工作群、饭局近况、关系推进，你第一反应不是冲出去表现，而是先看清楚边界和轻重。你能把事接住，也懂得给别人台阶，所以身边人常觉得你稳、可靠、不会突然乱来。只是稳久了，累也容易被你藏进一句还行里。你真正需要的不是更用力，而是把不舒服说得早一点，把该休息的时间留得硬一点。今天先少回一条没重点的消息，把晚饭吃安逸，已经算把自己照顾回来了。接下来不妨给自己定个小规矩：能明天处理的事，不必今晚硬接；能直说的边界，不必绕三圈。你越把自己放进安排里，稳定就越不只是给别人看的。",
  "stable-slow-soft-feel":
    "你不是冷淡，只是熟起来需要一点真实的温度。刚认识的人靠太近，你会本能往后退半步；但一旦确认对方舒服、真诚、不催，你又很能把关系经营得细水长流。你做事也类似，表面温和，心里其实有秤，谁靠谱、哪句话过分、哪件事该缓一缓，你都分得清。你的卡点是太会礼貌撤退，重要的人可能只看到距离，看不到你已经在认真观察。今天不必强行热情，只需要给舒服的人多留一句话，让对方知道门没有关死。你可以慢，但别把所有回应都藏起来；可以谨慎，但别让在意的人一直猜。真正合适的关系，不会因为你多说半句真实想法就散掉。慢慢熟也有它的好，至少每一步都是真的。",
  "stable-slow-fast-real":
    "你看起来不慌，其实心里一直在排优先级。工资、通勤、关系、风险、时间成本，别人只凭感觉冲一下，你会先把账算清楚。这样的你很适合处理复杂局面，因为你不容易被一句好听话带跑，也不会因为一时热闹就忘了后路。问题是想得太全时，启动会变慢，脑壳里的会开完一轮又一轮，手上还没动。今天不用把整条路想完，先做一个低风险动作：回一条咨询、列一个清单、拒绝一个模糊安排。只要动了一小步，你的清醒就会变成力量。你要允许自己在信息还没完全齐的时候先试一下，试错不等于乱来。很多答案不是想出来的，是走两步才看得见。先落地一件小事，你会更踏实。",
  "stable-slow-fast-feel":
    "你的节奏很讲缓冲：可以靠近，但不想被推着往前；可以接事，但不喜欢突然被安排到没有余地。你常常一边在意，一边装得好像没那么在意，因为你怕自己说多了会显得麻烦。其实你不是难懂，你只是需要对方把话说清楚，也允许你慢慢反应。你的优点是有分寸，知道什么时候该留白；卡点是把犹豫藏成无所谓，别人就容易误读。今天可以只说一个小点：我需要想一下、这个节奏有点快、这件事我介意。说出口一半，关系反而更轻松。你不用把情绪讲得很完整才算表达，先把方向告诉对方就够了。给自己留缓冲，也给别人一个理解你的入口。你越清楚，越不会被节奏推着跑。",
  "stable-open-soft-real":
    "你是那种会先观察再靠近的人。别人一上来热情，你不会马上被带动，而是先看对方说话算不算数、做事有没有边界、相处起来费不费劲。你对关系和工作都有一种朴素的靠谱标准：话讲清楚，事做踏实，不要绕太多弯。这样的你慢热但不冷，谨慎但不僵。只是观察太久时，别人可能只看见你的距离感，不知道你已经把细节看了很多遍。今天遇到还不错的人或机会，可以先把门缝留起，不必马上交付信任，但可以允许一点点试探发生。你不必一次把全部信任交出去，先给一个轻量回应、一次短聊、一个小约定。靠谱的人，会在这些细节里慢慢显形。你的谨慎，本来就是一种认真。",
  "stable-open-soft-feel":
    "你很懂得先把状态缓回来。遇到麻烦时，你未必马上讲道理，也不一定立刻解决，但你知道自己硬扛到情绪乱掉，事情只会更麻烦。你喜欢温和的人、安静的空间、能慢慢说开的关系；被催、被审、被迫立刻表态，都会让你更想躲开。你的柔软不是没主见，而是你更相信人要在舒服一点的状态里才能把话讲明白。卡点是你常把别人的感受排到前面，自己的累排到最后。今天给自己十分钟，吹风、散步、安静吃饭，都算把电量找回来。不要等彻底耗空了才休息，也不要把需要安静说成矫情。你先稳住自己，后面的事才有余地慢慢处理。先让心软下来，也是一种进展。",
  "stable-open-fast-real":
    "你白天很会把事情处理得体面：该回的消息会回，该接的场面会接，该讲清的边界也能讲。别人容易觉得你一直在线、反应快、好沟通，但他们不一定知道，你晚上真正想要的是清净。你不是不热情，只是不想让自己的空闲时间也被各种临时需求占满。你的优势是分寸感强，能在礼貌和实际之间找到平衡；卡点是礼貌做得太满，别人就默认你随时有空。今天可以给自己设半小时免打扰，把下班后的边界做得清楚一点。你可以继续可靠，但可靠不等于二十四小时可叫到。把休息讲明白，反而能让真正重要的沟通更有效。下班后的你，也值得被认真保护，别总把清净让出去。",
  "stable-open-fast-feel":
    "你很会把小崩溃讲成一段大家都听得懂的龙门阵。麻烦来了，你不一定马上解决，但你能把来龙去脉、委屈和好笑的地方都说出来，让身边人一下就懂你为什么累。你适合有回应、有接话、有温度的关系，冷处理和含糊话会让你很快失去耐心。你的好处是能把场子撑起来，尴尬也能被你接住；卡点是热闹散了以后，你自己的疲惫容易被留下。今天找个懂你的人聊十分钟，不用把话说漂亮，只要把真实那层说出来。也要记得，能把大家逗笑不是你的义务。你可以把轻松留给别人，也要给自己留一块不用表现的地方。真正懂你的人，会接住沉默那一面，也会听懂你累了。",
  "growth-slow-soft-real":
    "你对变化不是没兴趣，只是每次想动之前，都会先算清楚后路。收藏岗位、比较通勤、看休息、问朋友公司稳不稳，这些都不是拖拉，而是你在保护自己别跳进另一个坑里。你适合稳中求变，讨厌被一句机会不错就推着跑。真正的卡点是准备太久时，收藏夹会变成压力本身，看得越多越不敢下手。今天不用大改，只挑一个最不离谱的机会认真看完，或者发出一条咨询。你要的不是莽撞，是让未来从一个小动作开始松动。别把准备当成唯一的安全感，真实反馈也很重要。投出一个低风险选择，不代表马上离开，只是给自己多留一条路。先让选择流动起来，心里会松很多。",
  "growth-slow-soft-feel":
    "你看起来像在躺，其实心里一直有想法在发芽。只是你不喜欢还没想清楚就到处宣布，也不想被别人追着问进度。你需要的是一个能慢慢启动的空间：先缓一哈，再整理，再试一小步。别人可能误会你没行动力，但你真正卡住的常常不是懒，而是不确定从哪里开口。你的优势是有内在感受，知道什么东西对你有吸引力；卡点是潜得太久，机会和关系都可能以为你没回应。今天把心里那件事拆成一个小动作，做第一步就够。哪怕只是改一行简历、问一句情况、约一个时间，也是在把想法从心里搬到现实。慢启动也可以很有力量。别急着证明，先让自己动起来一点。",
  "growth-slow-fast-real":
    "你对机会很敏感，也对成本很敏感。看到新岗位、新方向、新关系，你不会只看热闹，而是会算距离、节奏、风险和可行性。你不是不动，是想先看清风向，确认这一步不会把自己带进更乱的地方。这样的谨慎很有价值，尤其在选择很多、话术也很多的时候。但看太久也会让启动那一下变钝。今天别要求自己马上换赛道，只要发出一条问题：薪资范围、工作时间、真实节奏、下一步安排。问清楚一件事，你就已经从观望往前挪了。你可以把判断留到信息回来之后，再决定要不要继续。先问，不等于先答应；先看，也别一直停在看。机会要筛，也要给它一次开口。",
  "growth-slow-fast-feel":
    "你讨厌被安排，也讨厌别人替你把路讲死。很多时候你说看情况，不是敷衍，而是真的想保留一点自由，等状态、信息和感觉都更清楚再决定。你能接受变化，但希望变化是自己选择的，不是被催出来的。你的好处是灵活，不会轻易被单一路径困住；卡点是所有选择都拖着时，最后最累的还是你自己。今天可以继续不急，但先定一个很小的事：今晚吃什么、明天问谁一句、这周先试哪一步。自由不是全都不选，而是选得像自己。别让别人替你催，也别让拖延替你选。把一个小决定拿回手里，你会更像自己。先选一小块，剩下的路再慢慢看，别急着交答案。慢一点，也要真的往前挪。",
  "growth-open-soft-real":
    "你很会复盘细节。一句话、一个表情、一段没下文的聊天，你都会自然补上前后关系，想弄明白对方到底是什么意思。工作里你也一样，沟通不清会让你不安心，因为你不想靠猜来承担后果。你的优势是细致，能发现别人忽略的微妙变化；卡点是太会补意思，容易把没说出口的内容也算进去，越想越累。今天可以把一个猜测换成一个问题：你刚才那句是什么意思、这件事什么时候定、我们下一步怎么做。问清楚，比独自转圈省力。你不需要靠反复推演来证明自己在乎，清楚沟通也可以很温柔。把问题抛出去，心里就能空出一点位置。少猜一次，就是多给自己一点安稳。",
  "growth-open-soft-feel":
    "你外表安静，心里其实很容易被回应牵动。对方慢回、已读没接、工作里一句没后文的话，都可能让你多想很久。你不是脆弱，而是对关系里的温度和确定感很敏感；你需要的不是甜言蜜语，而是对方忙也会说明白，不让你一个人把剧情补完。你的好处是感受细，能体察很多微妙变化；卡点是越想显得不在意，心里越翻来翻去。今天先把手机放远十分钟，再决定要不要问一句真实问题。给自己从那条消息里出来的机会。别让一条没回的消息把整个晚上带走，也别把所有沉默都理解成坏消息。你可以在乎，同时也保护自己的节奏。把注意力收回一点，你会舒服很多。",
  "growth-open-fast-real":
    "你很会接住场面。饭局、群聊、工作沟通里，你知道什么时候笑一下、什么时候补一句、什么时候把话题轻轻带过去。别人看到的是你礼貌、开朗、有分寸，但不一定看到你也会累，也有不想回应的时候。你的优势是适应力强，能让复杂场面不至于冷掉；卡点是你太会照顾气氛，别人就容易忘记你也需要被照顾。今天热闹够了就早点收场，把注意力收回自己这里。不是每一次都要接得漂亮，有些场面放一放也不会塌。你可以把开朗留给值得的人，也可以把安静留给自己。真正成熟的分寸，是知道什么时候不用再撑场。你退半步，世界也不会少了热闹，反而更自在。",
  "growth-open-fast-feel":
    "你属于普通选项不太装得下的那类人：有时候很认真，有时候很跳脱；上一秒还在分析现实，下一秒就想按自己的节奏拐个弯。朋友懂你很好耍，也知道你不是不负责，只是不想被固定成单一模样。你的优势是鲜活、反应快、敢保留自己的味道；卡点是所有承诺都推到以后再说时，别人会不知道该怎么靠近你。今天继续保持好耍，但把一个想法落到实处：发一条消息、做一个决定、把一个小坑填上。自由和可靠可以同时存在。你不必变成很标准的人，只要让身边重要的人看见，你的跳脱背后也有认真。好耍之外，再给自己一点落地感。这样才更像完整的你，也更让人放心。",
};

function buildAnalysis(input: ResultInput) {
  const comfort = input.comfortZone ?? input.loveAdvice;
  const blind = input.blindSpot ?? input.careerAdvice;
  const advice = input.todayAdvice ?? input.lifeAdvice.replace(/^今日建议：/u, "");

  return [
    `${input.name}这个结果，不是为了给你下结论，而是想把你最近那些用力、忍耐和一点点疲惫说清楚。${input.slogan}你会走到这个状态，多半不是突然的，是很多小事一件件叠起来：消息要回，事情要处理，别人期待你稳住，你也习惯先把场面照顾好。`,
    `你真正需要的不是一句“想开点”，而是有人看见你其实已经很努力了。${comfort}你不是没有想法，也不是故意慢半拍，只是更在意这件事能不能说清楚、做踏实、相处起来不费劲。宜宾的生活节奏看起来热闹，但落到你身上，很多时候还是要自己把白天撑过去，再给晚上留一点安静。`,
    `你的好处是，真遇到事不会乱来，能把眼前这一摊先稳住。你的卡点是，你太容易把“不舒服”处理成“还好”，把“我需要一点空间”说成“都可以”。${blind}`,
    `所以今天不用急着把自己改成另一个人。${advice}先把一个最烦的小事处理掉，或者认真给自己留十分钟，不解释、不硬撑，也已经是在往前走了。`,
  ].join("");
}

function result(input: ResultInput): LifeTestResultType {
  const posterTags = input.posterTags ?? input.keywords.slice(0, 3);
  const posterInsightLines: [string, string] =
    input.posterInsightLines ?? [input.slogan, input.todayAdvice ?? input.lifeAdvice];

  return {
    ...input,
    analysisTitle: input.analysisTitle ?? "为什么是你",
    analysisBody: input.analysisBody ?? resultAnalysisBodies[input.code] ?? buildAnalysis(input),
    comfortZone: input.comfortZone ?? input.loveAdvice,
    blindSpot: input.blindSpot ?? input.careerAdvice,
    todayAdvice: input.todayAdvice ?? input.lifeAdvice.replace(/^今日建议：/u, ""),
    evidenceFallbacks: input.evidenceFallbacks ?? [
      input.slogan,
      input.comfortZone ?? input.loveAdvice,
      input.blindSpot ?? input.careerAdvice,
    ],
    posterTitle: input.posterTitle ?? input.name,
    posterSubtitle: input.posterSubtitle ?? input.slogan,
    posterTags,
    posterInsightLines,
    posterSealText: input.posterSealText ?? "朋友说像",
    posterBaseImageUrl: `/life-test/posters/${input.code}.png`,
    imagePrompt: [
      "Create a vertical 3:4 mobile share poster base image with no text, no letters, no numbers, no logo, no watermark, and no UI.",
      `Persona: ${input.name}. Keywords: ${input.keywords.join(", ")}.`,
      `Scene inspiration: Yibin, Sichuan local lifestyle, ${input.citySymbol}, humorous local personality test, expressive cartoon avatar, modern friendly campaign visual.`,
      "Composition must leave clean darker negative space at the top and lower third for later programmatic Chinese text overlay.",
      "Style: polished 2D Chinese comic result-card illustration, bold outlines, cel shading, subtle print grain, local, optimistic, clean, not cluttered. Avoid photorealism, photography, 3D render, and real portrait style.",
    ].join(" "),
  };
}

export const lifeTestResults: Record<LifeTestResultCode, LifeTestResultType> = {
  "stable-slow-soft-real": result({
    code: "stable-slow-soft-real",
    name: "翠屏山安静扛事人",
    slogan: "你不是没脾气，是先把麻烦按住。",
    keywords: ["稳得住", "慢慢来", "讲实际"],
    citySymbol: "翠屏山",
    careerTitle: "工作安全感",
    careerAdvice: "你习惯先把事接住，哪怕心里已经有点累，也会把轻重缓急排清楚。",
    loveTitle: "关系节奏",
    loveAdvice: "舒服区是熟人、清楚话和稳定节奏，不喜欢一上来就被催着表态。",
    lifeAdvice: "今日建议：今晚少回一条没重点的消息，先把饭吃安逸。",
    blindSpot: "只是别把所有不舒服都压成一句还好，真正该说的边界还是要说出口。",
    jobCtaText: "看看更稳的宜宾岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个能懂我安静的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【翠屏山安静扛事人】，你是哪种宜宾精神状态？",
  }),
  "stable-slow-soft-feel": result({
    code: "stable-slow-soft-feel",
    name: "李庄慢热熟人局",
    slogan: "熟了很好耍，不熟先莫挨太近。",
    keywords: ["慢热", "熟人局", "要舒服"],
    citySymbol: "李庄老街",
    careerTitle: "工作安全感",
    careerAdvice: "你不爱硬刚，但心里有杆秤，谁靠谱、哪件事过分，你其实分得很清。",
    loveTitle: "关系节奏",
    loveAdvice: "你最自然的状态是慢慢熟，聊天不费劲，彼此不用一直猜。",
    lifeAdvice: "今日建议：不用马上热情，先给舒服的人多留一句话。",
    blindSpot: "你有时退得太礼貌，别人会误会你没兴趣，重要的人可以多解释半句。",
    jobCtaText: "找个节奏舒服的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个慢慢熟的搭子",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【李庄慢热熟人局】，你是哪种宜宾精神状态？",
  }),
  "stable-slow-fast-real": result({
    code: "stable-slow-fast-real",
    name: "清醒待机处理器",
    slogan: "看起稳，其实脑壳一直在开会。",
    keywords: ["清醒", "会盘算", "讲边界"],
    citySymbol: "酒都路口",
    careerTitle: "工作安全感",
    careerAdvice: "你会把工资、通勤、风险和人情都算进去，不冲动，但也不愿一直困在原地。",
    loveTitle: "关系节奏",
    loveAdvice: "你需要的是说话明白、安排靠谱的人，暧昧半天反而最耗你。",
    lifeAdvice: "今日建议：把心里排第一的那件小事先做掉，别让它一直占位置。",
    blindSpot: "你容易想得太全，想到最后反而很难动手，今天可以先做一个低风险选择。",
    jobCtaText: "看看更靠谱的机会",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个说话明白的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【清醒待机处理器】，你是哪种宜宾精神状态？",
  }),
  "stable-slow-fast-feel": result({
    code: "stable-slow-fast-feel",
    name: "关系缓冲带",
    slogan: "想靠近，但不想被推着走。",
    keywords: ["有边界", "怕太猛", "要清楚"],
    citySymbol: "老城巷口",
    careerTitle: "工作安全感",
    careerAdvice: "你处理工作也讲缓冲，能接事，但不喜欢突然被安排到没有余地。",
    loveTitle: "关系节奏",
    loveAdvice: "你愿意靠近，只是希望对方节奏别太猛，话能说清，距离也能留好。",
    lifeAdvice: "今日建议：把你真正介意的一点说出来，不用一次讲完。",
    blindSpot: "你有时把犹豫藏成无所谓，对方看不懂，就容易把你往外推。",
    jobCtaText: "换个没那么急的节奏",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个尊重节奏的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【关系缓冲带】，你是哪种宜宾精神状态？",
  }),
  "stable-open-soft-real": result({
    code: "stable-open-soft-real",
    name: "慢热靠谱观察员",
    slogan: "你不是难接近，是先看对方值不值得靠近。",
    keywords: ["靠谱控", "会观察", "不想猜"],
    citySymbol: "江边茶座",
    careerTitle: "工作安全感",
    careerAdvice: "你做事先看边界和责任，宁愿慢一点，也不想后面扯不清。",
    loveTitle: "关系节奏",
    loveAdvice: "你的舒服区是说话清楚、相处自然、慢慢确认，不用天天猜对方在想啥。",
    lifeAdvice: "今日建议：靠谱的人来了，可以先把门缝留起。",
    blindSpot: "你观察太久时，别人可能只看到距离感，不知道你其实已经认真看了很久。",
    jobCtaText: "找个靠谱岗位试试",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个说话清楚的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【慢热靠谱观察员】，你是哪种宜宾精神状态？",
  }),
  "stable-open-soft-feel": result({
    code: "stable-open-soft-feel",
    name: "江边吹风充电员",
    slogan: "问题没马上解决，但你先把自己缓过来。",
    keywords: ["先缓一哈", "需要安静", "温和"],
    citySymbol: "三江口",
    careerTitle: "工作安全感",
    careerAdvice: "你不是逃避事情，只是知道状态不好时硬扛，反而容易把小事弄复杂。",
    loveTitle: "关系节奏",
    loveAdvice: "你喜欢温和、能陪你慢慢说的人，不喜欢把情绪逼到桌面上审问。",
    lifeAdvice: "今日建议：出去走十分钟，或者安静坐一会儿，先让脑壳松一点。",
    blindSpot: "你太习惯先照顾别人的感受，结果自己的累经常排到最后。",
    jobCtaText: "找个少耗电量的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个能陪我慢慢说的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【江边吹风充电员】，你是哪种宜宾精神状态？",
  }),
  "stable-open-fast-real": result({
    code: "stable-open-fast-real",
    name: "下班消息免打扰",
    slogan: "白天礼貌在线，晚上只想清净。",
    keywords: ["会接事", "要清净", "下班边界"],
    citySymbol: "南岸夜路",
    careerTitle: "工作安全感",
    careerAdvice: "你白天能把该回的消息、该接的事都处理掉，但不代表你晚上还想继续在线。",
    loveTitle: "关系节奏",
    loveAdvice: "你需要的是懂分寸的人，热情可以，但别把你的空闲时间全占满。",
    lifeAdvice: "今日建议：给自己设半小时免打扰，谁急谁先急。",
    blindSpot: "你总是把礼貌做得很满，别人就容易默认你一直都有空。",
    jobCtaText: "找个下班更清楚的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个懂分寸的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【下班消息免打扰】，你是哪种宜宾精神状态？",
  }),
  "stable-open-fast-feel": result({
    code: "stable-open-fast-feel",
    name: "朋友局接话王",
    slogan: "能把小崩溃摆成一段龙门阵。",
    keywords: ["会接话", "有画面", "朋友懂"],
    citySymbol: "戎州茶馆",
    careerTitle: "工作安全感",
    careerAdvice: "你遇到麻烦不一定马上解决，但很会把事讲清楚，讲完大家都懂你为什么累。",
    loveTitle: "关系节奏",
    loveAdvice: "你适合有人接话、有人回应的关系，冷处理和含糊话最容易让你失去耐心。",
    lifeAdvice: "今日建议：找个懂你的人聊十分钟，别把话全憋在心里。",
    blindSpot: "你会把场子撑得很好，但热闹散了以后，自己的疲惫也要认真看见。",
    jobCtaText: "找个能发挥表达的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个接得住话的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【朋友局接话王】，你是哪种宜宾精神状态？",
  }),
  "growth-slow-soft-real": result({
    code: "growth-slow-soft-real",
    name: "岗位收藏夹选手",
    slogan: "收藏的不是岗位，是对未来的一点试探。",
    keywords: ["想换口气", "先观望", "会算账"],
    citySymbol: "大宜宾招聘",
    careerTitle: "工作安全感",
    careerAdvice: "你不是没有行动力，只是每次想动之前，都会先算风险、通勤、工资和后路。",
    loveTitle: "关系节奏",
    loveAdvice: "你也不是不需要陪伴，只是希望对方别催你马上给答案。",
    lifeAdvice: "今日建议：今天先投一个最不离谱的岗位，让收藏夹少背点压力。",
    blindSpot: "你容易把准备做成拖延，准备太久，机会也会慢慢凉掉。",
    jobCtaText: "别只收藏，先看一个岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个不催但懂我的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【岗位收藏夹选手】，你是哪种宜宾精神状态？",
  }),
  "growth-slow-soft-feel": result({
    code: "growth-slow-soft-feel",
    name: "竹海潜水蓄力派",
    slogan: "你看起来在躺，其实心里在盘事情。",
    keywords: ["蓄力", "慢启动", "有想法"],
    citySymbol: "蜀南竹海",
    careerTitle: "工作安全感",
    careerAdvice: "你不一定到处讲计划，但心里一直在盘下一步，只是还没找到合适开口。",
    loveTitle: "关系节奏",
    loveAdvice: "你喜欢不催、不审问、能慢慢陪你把话说出来的人。",
    lifeAdvice: "今日建议：把心里那件事拆成一个小动作，今天先做第一步。",
    blindSpot: "你潜得太久时，别人会以为你没想法，其实你只是还没准备好亮出来。",
    jobCtaText: "给想法找个出口",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个看得懂我慢热的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【竹海潜水蓄力派】，你是哪种宜宾精神状态？",
  }),
  "growth-slow-fast-real": result({
    code: "growth-slow-fast-real",
    name: "临港机会观察员",
    slogan: "你不是不动，是想先看清风向。",
    keywords: ["看机会", "讲风险", "准备动"],
    citySymbol: "临港新区",
    careerTitle: "工作安全感",
    careerAdvice: "你对机会敏感，也对风险敏感，别人只看热闹，你会先看成本和可行性。",
    loveTitle: "关系节奏",
    loveAdvice: "你喜欢目标清楚的人，含糊的关系会让你很快开始算值不值得。",
    lifeAdvice: "今日建议：别只看，今天发出一条咨询消息就够了。",
    blindSpot: "你看得细是优点，但看得太久就会错过启动的那一下。",
    jobCtaText: "看看本地新机会",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个目标清楚的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【临港机会观察员】，你是哪种宜宾精神状态？",
  }),
  "growth-slow-fast-feel": result({
    code: "growth-slow-fast-feel",
    name: "街头看情况自由人",
    slogan: "你不想被安排，也不想太早下结论。",
    keywords: ["看情况", "要自由", "不被催"],
    citySymbol: "街头岔路",
    careerTitle: "工作安全感",
    careerAdvice: "你不是没方向，只是讨厌别人替你把路画死，尤其讨厌还没听完就催你选。",
    loveTitle: "关系节奏",
    loveAdvice: "你的舒服区是互相尊重节奏，能靠近，也能各自喘口气。",
    lifeAdvice: "今日建议：可以继续看情况，但先决定今晚吃什么。",
    blindSpot: "你越不想被催，越容易把所有选择都拖着，最后还是自己累。",
    jobCtaText: "看看不绑死节奏的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个尊重节奏的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【街头看情况自由人】，你是哪种宜宾精神状态？",
  }),
  "growth-open-soft-real": result({
    code: "growth-open-soft-real",
    name: "聊天记录复盘师",
    slogan: "对方一句哈哈，你能分析出三层意思。",
    keywords: ["会复盘", "怕不清楚", "重细节"],
    citySymbol: "聊天框",
    careerTitle: "工作安全感",
    careerAdvice: "你做工作也很看细节，一句话没说清楚，你就会开始补上下文。",
    loveTitle: "关系节奏",
    loveAdvice: "你需要的是明确回应，不一定要多甜，但最好别让你一直猜。",
    lifeAdvice: "今日建议：少复盘一个标点，多问一句真实问题。",
    blindSpot: "你太会补意思，容易把对方没说的话也算进去，问清楚反而省力。",
    jobCtaText: "找个沟通更清楚的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个不用猜的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【聊天记录复盘师】，你是哪种宜宾精神状态？",
  }),
  "growth-open-soft-feel": result({
    code: "growth-open-soft-feel",
    name: "已读不回内心戏",
    slogan: "外表很安静，心里已经演到第三集。",
    keywords: ["很在意", "会脑补", "需要回应"],
    citySymbol: "聊天框",
    careerTitle: "工作安全感",
    careerAdvice: "你不是玻璃心，只是对回应很敏感，工作里一句没下文的话也会让你多想。",
    loveTitle: "关系节奏",
    loveAdvice: "你舒服的关系，是对方忙也会说明白，不让你一个人把剧情补完。",
    lifeAdvice: "今日建议：先把手机放远十分钟，让自己从那条消息里出来。",
    blindSpot: "你越想显得不在意，心里越容易翻来翻去，直接问一句有时更轻松。",
    jobCtaText: "找个回应清楚的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个愿意说明白的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【已读不回内心戏】，你是哪种宜宾精神状态？",
  }),
  "growth-open-fast-real": result({
    code: "growth-open-fast-real",
    name: "川南礼貌开朗人",
    slogan: "你不是一直外向，只是很会把场面接住。",
    keywords: ["懂礼貌", "会接场", "有分寸"],
    citySymbol: "宜宾周边",
    careerTitle: "工作安全感",
    careerAdvice: "你在工作和饭局里都能接住场面，该笑就笑，该回就回，别人很难看出你也会累。",
    loveTitle: "关系节奏",
    loveAdvice: "你喜欢轻松自然的相处，热闹可以，但别把你当成永远在线的人。",
    lifeAdvice: "今日建议：今天热闹够了，就早点收场回到自己这里。",
    blindSpot: "你太会照顾气氛，别人就容易忘记你也需要被照顾。",
    jobCtaText: "找个不用天天撑场的岗位",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个能看见我安静面的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【川南礼貌开朗人】，你是哪种宜宾精神状态？",
  }),
  "growth-open-fast-feel": result({
    code: "growth-open-fast-feel",
    name: "宜宾隐藏款",
    slogan: "普通选项装不下你，但朋友懂你很好耍。",
    keywords: ["隐藏款", "很好耍", "不被框住"],
    citySymbol: "三江口夜景",
    careerTitle: "工作安全感",
    careerAdvice: "你有时候很认真，有时候很跳脱，别人想给你贴一个固定标签，基本都会失败。",
    loveTitle: "关系节奏",
    loveAdvice: "你的舒服区是既能认真相处，也能保留一点自己的自由空间。",
    lifeAdvice: "今日建议：继续好耍，但今天至少把一个想法落到实处。",
    blindSpot: "你不想被框住没有问题，只是别把所有承诺都推成以后再说。",
    jobCtaText: "生成我的隐藏款岗位建议",
    jobCtaUrl: jobUrl,
    matchCtaText: "找个能接住我节奏的人",
    matchCtaUrl: matchUrl,
    shareText: "我测出了【宜宾隐藏款】，你是哪种宜宾精神状态？",
    posterSealText: "隐藏款认证",
  }),
};

export function getLifeTestResult(code: LifeTestResultCode) {
  return lifeTestResults[code];
}

export function getLifeTestResultByAxes(axes: LifeTestAxes) {
  return getLifeTestResult(`${axes.career}-${axes.love}-${axes.pace}-${axes.decision}`);
}

export const lifeTestResultList = Object.values(lifeTestResults);
