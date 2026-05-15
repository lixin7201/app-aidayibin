import type { GenderOption, ImageRatio } from "@/features/generation/types";

export type PortraitTemplateSpec = {
  slug: string;
  name: string;
  category: string;
  gender: Exclude<GenderOption, "unspecified">;
  tagline: string;
  description: string;
  scenePrompt: string;
  coverPrompt: string;
  recommendedRatios?: ImageRatio[];
  supportedRatios?: ImageRatio[];
};

export const portraitTemplateSpecs: PortraitTemplateSpec[] = [
  {
    slug: "male-cool-intellectual-library",
    name: "清冷知性",
    category: "男士 · 知性",
    gender: "male",
    tagline: "白衬衫，现代图书馆，自然窗光",
    description: "干净、克制、有书卷气的男士展示面。",
    scenePrompt:
      "Style the person as a cool intellectual man in a crisp white shirt, inside a modern library with tall shelves, quiet architectural lines, soft natural window light, calm restrained expression, refined but not stiff.",
    coverPrompt:
      "A realistic adult Chinese man in a crisp white shirt inside a modern library, natural window light, quiet intellectual mood, subtle skin texture, real camera look.",
  },
  {
    slug: "male-urban-minimal-architecture",
    name: "都市极简",
    category: "男士 · 都市",
    gender: "male",
    tagline: "黑色短夹克，灰白建筑街区",
    description: "灰白建筑背景里的清爽都市感。",
    scenePrompt:
      "Style the person as a modern urban man wearing a black cropped jacket and simple inner layer, standing in a grey-white architectural district, clean lines, soft overcast light, minimalist city fashion photography.",
    coverPrompt:
      "A realistic adult Chinese man wearing a black cropped jacket in a grey-white modern architectural street, minimalist urban portrait, natural skin, no CGI.",
  },
  {
    slug: "male-relaxed-korean-cafe",
    name: "松弛韩系",
    category: "男士 · 生活",
    gender: "male",
    tagline: "针织开衫，咖啡馆靠窗",
    description: "温和、自然、不刻意的咖啡馆生活感。",
    scenePrompt:
      "Style the person in a soft knit cardigan and relaxed casual trousers, sitting by a cafe window with daylight, ceramic cup and subtle street view, gentle Korean-inspired lifestyle mood, candid and believable.",
    coverPrompt:
      "A realistic adult Chinese man in a soft knit cardigan by a cafe window, warm daylight, relaxed Korean lifestyle mood, real skin texture.",
  },
  {
    slug: "male-fashion-casual-boutique",
    name: "时尚休闲",
    category: "男士 · 时尚",
    gender: "male",
    tagline: "宽松衬衫，潮流买手店",
    description: "适合松弛但有穿搭感的男士形象。",
    scenePrompt:
      "Style the person in an oversized tasteful shirt, clean trousers and subtle accessories, inside a curated fashion boutique with racks, mirrors and warm retail lighting, natural confident pose, realistic fashion editorial photography.",
    coverPrompt:
      "A realistic adult Chinese man in an oversized stylish shirt inside a curated fashion boutique, warm retail lighting, fashionable but natural.",
  },
  {
    slug: "male-literary-bookstore-linen",
    name: "文艺青年",
    category: "男士 · 文艺",
    gender: "male",
    tagline: "亚麻衬衫，旧书店",
    description: "旧书、木架和亚麻材质带来的文艺质感。",
    scenePrompt:
      "Style the person in a linen shirt in an old bookstore, wooden shelves, stacked books, soft dusty window light, thoughtful expression, gentle film photography texture, realistic and not staged.",
    coverPrompt:
      "A realistic adult Chinese man in a linen shirt inside an old bookstore, wooden shelves, soft window light, literary film portrait.",
  },
  {
    slug: "male-idol-practice-hall",
    name: "男团生活感",
    category: "男士 · 潮流",
    gender: "male",
    tagline: "棒球外套，练习室走廊",
    description: "清爽男团感，但保持生活化和真实照片质感。",
    scenePrompt:
      "Style the person in a baseball jacket and clean streetwear, in a dance practice hallway with mirrors and soft fluorescent light, clean group-practice lifestyle feeling matching the selected age range, natural pose, realistic skin and fabric, no stage fantasy.",
    coverPrompt:
      "A realistic adult Chinese man in a baseball jacket in a dance practice hallway, clean lifestyle feeling matching the selected age range, mirrors, real fluorescent light.",
  },
  {
    slug: "male-ancient-swordsman",
    name: "古装剑士",
    category: "男士 · 古风",
    gender: "male",
    tagline: "男士汉服，古装帅气剑士",
    description: "帅气古风剑士造型，但不做仙侠特效。",
    scenePrompt:
      "Style the person as a gentle, jade-like Chinese man matching the selected age range in layered white Hanfu robes, refined Song-style or Ming-style tailoring, soft fabric folds, a simple sheathed sword as a subtle prop rather than fantasy weapon, standing in a quiet traditional garden with bamboo and stone, warm natural daylight with balanced face exposure, calm elegant expression, realistic historical drama photography, no magic effects, no dark armor, no over-styled cosplay.",
    coverPrompt:
      "A realistic adult Chinese man as a gentle ancient swordsman in layered white Hanfu, warm jade-like temperament, quiet Chinese garden, bamboo and stone, subtle sheathed sword prop, natural daylight, real fabric texture.",
  },
  {
    slug: "male-new-chinese-teahouse",
    name: "新中式雅士",
    category: "男士 · 新中式",
    gender: "male",
    tagline: "改良中式外套，茶室",
    description: "沉稳、雅致、适合成熟或气质型男士。",
    scenePrompt:
      "Style the person in a refined modern Chinese outfit inside a real teahouse, off-white linen or light sand-toned Chinese jacket, wooden lattice window, tea set, bamboo shadow, soft side light, calm elegant posture, refined literati temperament matching the selected age range, realistic fabric and skin, balanced natural exposure, understated and warm, not old-fashioned, not stage costume.",
    coverPrompt:
      "A realistic adult Chinese man in a light modern Chinese jacket in a refined teahouse, wooden lattice, tea set, bamboo shadow, refined elegant literati mood, natural light.",
  },
  {
    slug: "male-city-walk-sunset",
    name: "城市漫步",
    category: "男士 · 街拍",
    gender: "male",
    tagline: "休闲夹克，黄昏街头",
    description: "适合朋友圈头像和自然街拍展示。",
    scenePrompt:
      "Style the person in a relaxed but stylish city-walk outfit, light casual jacket over a clean shirt, walking naturally on a real city street at dusk, warm street lights just turning on, shop windows and trees softly blurred, candid expression with a natural half-smile, documentary street portrait, realistic motion and available light, not posed like a studio render.",
    coverPrompt:
      "A realistic adult Chinese man in a relaxed casual jacket walking naturally on a real city street at dusk, warm street lights, candid documentary street portrait, natural face and skin.",
  },
  {
    slug: "male-rainy-film-trenchcoat",
    name: "电影男主",
    category: "男士 · 电影感",
    gender: "male",
    tagline: "风衣，雨后街巷",
    description: "雨后街巷的电影男主氛围。",
    scenePrompt:
      "Style the person in a trench coat on a narrow street after rain, wet pavement reflections, soft practical lights, cinematic but realistic composition, thoughtful expression, 35mm film mood, no exaggerated drama.",
    coverPrompt:
      "A realistic adult Chinese man in a trench coat on a rainy street after rain, wet pavement, cinematic 35mm film mood, natural face.",
  },
  {
    slug: "male-magazine-black-turtleneck",
    name: "杂志封面",
    category: "男士 · 棚拍",
    gender: "male",
    tagline: "黑色高领，极简灰棚",
    description: "黑色高领和灰色棚拍背景，干净高级。",
    scenePrompt:
      "Style the person in a black turtleneck for a minimalist grey studio editorial portrait, soft directional light, clean shadows, confident calm gaze, realistic pores and hair texture, premium but natural photography.",
    coverPrompt:
      "A realistic adult Chinese man in a black turtleneck, minimalist grey studio, premium editorial portrait, soft directional light.",
  },
  {
    slug: "male-musician-livehouse",
    name: "音乐人气质",
    category: "男士 · 音乐",
    gender: "male",
    tagline: "皮夹克，livehouse 后台",
    description: "皮夹克和后台灯光，带一点音乐人锋芒。",
    scenePrompt:
      "Style the person in a tasteful leather jacket backstage at a livehouse, dim warm bulbs, instrument cases, textured black walls, relaxed musician energy, realistic low-light photography with the face still readable and not crushed into shadow, no rock-star exaggeration.",
    coverPrompt:
      "A realistic adult Chinese man in a leather jacket backstage at a livehouse, warm bulbs, instrument cases, textured low-light portrait.",
  },
  {
    slug: "male-sunny-basketball",
    name: "运动阳光",
    category: "男士 · 运动",
    gender: "male",
    tagline: "运动套装，篮球场边",
    description: "阳光、健康、有活力的运动生活照。",
    scenePrompt:
      "Style the person in a clean athletic outfit beside an outdoor basketball court, late afternoon sunlight, relaxed sporty posture, realistic sweat-free lifestyle portrait, natural smile, no action distortion.",
    coverPrompt:
      "A realistic adult Chinese man in a clean athletic outfit beside an outdoor basketball court, sunny lifestyle portrait, natural smile.",
  },
  {
    slug: "male-smart-casual-office",
    name: "轻商务",
    category: "男士 · 职场",
    gender: "male",
    tagline: "浅色西装，开放式办公区",
    description: "商务但不严肃，适合资料页和职场展示。",
    scenePrompt:
      "Style the person in a light-colored smart casual suit without tie, in a bright open office with glass and wood details, approachable confident expression, natural daylight with no blown highlights or washed-out skin, premium but relaxed business portrait.",
    coverPrompt:
      "A realistic adult Chinese man in a light smart casual suit in a bright open office, approachable business portrait, natural daylight.",
  },
  {
    slug: "male-yibin-riverside-relaxed",
    name: "江边松弛",
    category: "男士 · 宜宾",
    gender: "male",
    tagline: "白 T 外套，三江口日落",
    description: "宜宾江边的松弛城市生活感。",
    scenePrompt:
      "Style the person in a white T-shirt with a casual jacket at Yibin Sanjiangkou riverside during sunset, river breeze, soft skyline, relaxed posture, local city lifestyle photography.",
    coverPrompt:
      "A realistic adult Chinese man in a white T-shirt and casual jacket at Yibin Sanjiangkou riverside sunset, relaxed local lifestyle.",
  },
  {
    slug: "male-art-curator-gallery",
    name: "艺术策展人",
    category: "男士 · 艺术",
    gender: "male",
    tagline: "黑衬衫，美术馆",
    description: "黑衬衫和美术馆空间，克制有品位。",
    scenePrompt:
      "Style the person in a black shirt inside a contemporary art gallery, white walls, framed artworks, polished concrete floor, soft museum light, composed curator-like presence, realistic editorial portrait.",
    coverPrompt:
      "A realistic adult Chinese man in a black shirt inside a contemporary art gallery, white walls, museum light, curator mood.",
  },
  {
    slug: "male-winter-warm-indoor",
    name: "冬日氛围",
    category: "男士 · 氛围",
    gender: "male",
    tagline: "羊毛大衣，暖灯室内",
    description: "温暖室内光和羊毛材质，适合冬日头像。",
    scenePrompt:
      "Style the person in a wool coat in a warm indoor lounge, amber lamp light, textured sofa, window reflection at night, calm winter atmosphere, realistic skin and wool texture.",
    coverPrompt:
      "A realistic adult Chinese man in a wool coat in a warm indoor lounge, amber lamp light, winter atmosphere, real texture.",
  },
  {
    slug: "male-real-motorcycle-style",
    name: "机车风",
    category: "男士 · 酷感",
    gender: "male",
    tagline: "皮夹克，停车场自然光",
    description: "真实机车风，不夸张、不油腻。",
    scenePrompt:
      "Style the person in a leather jacket in a clean parking garage or outdoor parking lot with natural side light, motorcycle nearby as subtle prop, cool but realistic pose, no exaggerated biker fantasy.",
    coverPrompt:
      "A realistic adult Chinese man in a leather jacket in a clean parking garage with a motorcycle nearby, natural side light, cool realistic portrait.",
  },
  {
    slug: "male-yibin-night-landmark",
    name: "宜宾城市名片",
    category: "男士 · 宜宾",
    gender: "male",
    tagline: "休闲正装，宜宾地标夜色",
    description: "适合突出本地城市身份的高级夜景照。",
    scenePrompt:
      "Style the person in relaxed smart attire at a recognizable Yibin city landmark at night, river lights and urban skyline bokeh, polished but natural local identity portrait, realistic night photography with clear face exposure and no muddy color cast.",
    coverPrompt:
      "A realistic adult Chinese man in relaxed smart attire at a Yibin city landmark at night, river lights, skyline bokeh, premium local portrait.",
  },
  {
    slug: "male-dai-ethnic-portrait",
    name: "傣族风情",
    category: "男士 · 民族风",
    gender: "male",
    tagline: "傣族服饰，热带庭院",
    description: "真实民族风写真，服饰精致但不舞台化。",
    scenePrompt:
      "Style the person in elegant Dai ethnic-inspired male clothing with tasteful woven fabric, in a tropical courtyard with bamboo, palm leaves and warm daylight, respectful cultural portrait, realistic documentary fashion photography, consistent daylight color temperature across face, neck, and clothing, no yellow or orange skin cast, no costume-party feeling.",
    coverPrompt:
      "A realistic adult Chinese man wearing elegant Dai ethnic-inspired clothing in a tropical courtyard, bamboo and palm leaves, respectful cultural portrait.",
  },
  {
    slug: "female-warm-cafe-knit",
    name: "温柔氛围",
    category: "女士 · 温柔",
    gender: "female",
    tagline: "针织衫，咖啡馆暖光",
    description: "柔和、亲近、适合朋友圈和头像。",
    scenePrompt:
      "Style the person in a soft knit top inside a real warm cafe, amber window light and natural shadows, coffee cup and simple wooden table, relaxed gentle expression, everyday natural makeup, slight flyaway hair, visible skin texture and tiny imperfections, cozy refined lifestyle portrait, like a real photographer's candid portrait, keep warm lighting from turning skin orange or overly red, not overly sweet, not waxy, not beauty-filtered.",
    coverPrompt:
      "A realistic adult Chinese woman in a soft knit top inside a warm cafe, amber window light, relaxed gentle candid expression, natural makeup, visible skin texture, real lifestyle portrait.",
  },
  {
    slug: "female-relaxed-korean-bakery",
    name: "松弛韩系",
    category: "女士 · 生活",
    gender: "female",
    tagline: "浅色开衫，街角面包店",
    description: "轻松、自然、有生活感的韩系街角照片。",
    scenePrompt:
      "Style the person in a light cardigan near a small corner bakery, daylight through glass, paper bag and street view, relaxed Korean-inspired lifestyle mood, candid pose, believable natural appearance, soft daylight without overexposed face or washed-out skin.",
    coverPrompt:
      "A realistic adult Chinese woman in a light cardigan near a corner bakery, daylight through glass, relaxed Korean lifestyle mood.",
  },
  {
    slug: "female-urban-minimal-suit",
    name: "都市极简",
    category: "女士 · 都市",
    gender: "female",
    tagline: "黑白套装，现代建筑",
    description: "现代建筑背景下的利落女性形象。",
    scenePrompt:
      "Style the person in a black-and-white minimalist outfit in a modern architectural district, clean composition, soft overcast daylight, composed urban confidence, realistic editorial street portrait.",
    coverPrompt:
      "A realistic adult Chinese woman in a black-and-white minimalist outfit in a modern architectural district, composed urban portrait.",
  },
  {
    slug: "female-idol-practice-hall",
    name: "女团生活感",
    category: "女士 · 潮流",
    gender: "female",
    tagline: "运动套装，练习室",
    description: "有女团活力，但保留真实生活照片质感。",
    scenePrompt:
      "Style the person in a clean athletic dance outfit inside a dance practice room, mirror wall, soft studio light, clean group-practice lifestyle feeling matching the selected age range, natural confident pose, realistic skin and hair.",
    coverPrompt:
      "A realistic adult Chinese woman in a clean athletic dance outfit inside a dance practice room, mirror wall, clean lifestyle portrait matching the selected age range.",
  },
  {
    slug: "female-literary-film-bookstore",
    name: "文艺胶片",
    category: "女士 · 文艺",
    gender: "female",
    tagline: "碎花裙，旧书店",
    description: "旧书店和胶片颗粒带来的文艺气息。",
    scenePrompt:
      "Style the person in a subtle floral dress in an old bookstore, wooden shelves, soft dusty window light, gentle thoughtful expression, film photography grain, real texture and natural posture.",
    coverPrompt:
      "A realistic adult Chinese woman in a subtle floral dress inside an old bookstore, wooden shelves, film grain, soft window light.",
  },
  {
    slug: "female-qipao-old-house",
    name: "旗袍写真",
    category: "女士 · 复古",
    gender: "female",
    tagline: "素色旗袍，老洋房",
    description: "优雅旗袍和老洋房，不夸张不影楼。",
    scenePrompt:
      "Style the person in an elegant plain-color qipao inside an old heritage house, wooden stairs, patterned glass, soft afternoon light, graceful but natural posture, realistic period-inspired portrait, matching exposure and color temperature across face, neck, and fabric.",
    coverPrompt:
      "A realistic adult Chinese woman in an elegant plain qipao inside an old heritage house, wooden stairs, patterned glass, natural light.",
  },
  {
    slug: "female-hanfu-garden",
    name: "汉服园林",
    category: "女士 · 古风",
    gender: "female",
    tagline: "淡雅汉服，中式园林",
    description: "淡雅古风，不做仙气特效。",
    scenePrompt:
      "Style the person in elegant light-toned Hanfu in a traditional Chinese garden, stone path, greenery, soft daylight, fabric layers visible, natural human posture, realistic cultural portrait, balanced face exposure, no fantasy effects.",
    coverPrompt:
      "A realistic adult Chinese woman in elegant light-toned Hanfu in a Chinese garden, stone path, soft daylight, real fabric texture.",
  },
  {
    slug: "female-premium-office-couture",
    name: "职场高级",
    category: "女士 · 职场",
    gender: "female",
    tagline: "浅色女性高定职业装，明亮办公室",
    description: "高级但亲和的女性职场展示面。",
    scenePrompt:
      "Style the person in a light-colored premium tailored women’s professional outfit in a bright modern office, clean desk, glass and wood details, confident approachable expression, natural daylight with no blown highlights or washed-out skin.",
    coverPrompt:
      "A realistic adult Chinese woman in a light premium tailored professional outfit in a bright modern office, confident approachable portrait.",
  },
  {
    slug: "female-black-gold-magazine",
    name: "黑金杂志",
    category: "女士 · 棚拍",
    gender: "female",
    tagline: "黑裙或西装裙，棚拍",
    description: "黑金灯光下的高级杂志封面感。",
    scenePrompt:
      "Style the person in a black dress or black tailored skirt suit for a high-end black and warm gold studio editorial portrait, controlled shadows, elegant confident gaze, realistic skin texture, warm gold light without orange or muddy skin cast.",
    coverPrompt:
      "A realistic adult Chinese woman in a black dress or tailored skirt suit, black and warm gold studio, premium editorial portrait.",
  },
  {
    slug: "female-spring-flower-street",
    name: "春日花街",
    category: "女士 · 季节",
    gender: "female",
    tagline: "浅色裙装，花树街道",
    description: "明亮、清爽、适合春日分享。",
    scenePrompt:
      "Style the person in a light dress on a flower-lined street in spring, soft daylight, gentle breeze, natural smile, realistic lifestyle editorial photography, no blown highlights or washed-out skin, no fantasy petals overload.",
    coverPrompt:
      "A realistic adult Chinese woman in a light dress on a flower-lined spring street, soft daylight, gentle breeze, natural smile.",
  },
  {
    slug: "female-forest-natural-cotton",
    name: "森系自然",
    category: "女士 · 自然",
    gender: "female",
    tagline: "棉麻裙，树林自然光",
    description: "棉麻材质和树林自然光，清透但真实。",
    scenePrompt:
      "Style the person in a cotton-linen dress in quiet forest greenery, morning light through leaves, relaxed candid pose, natural makeup, realistic skin and hair, airy but not overexposed.",
    coverPrompt:
      "A realistic adult Chinese woman in a cotton-linen dress in forest greenery, morning light through leaves, natural candid portrait.",
  },
  {
    slug: "female-yibin-riverside-sunset",
    name: "江边日落",
    category: "女士 · 宜宾",
    gender: "female",
    tagline: "风衣或裙装，三江口",
    description: "宜宾三江口的开阔日落氛围。",
    scenePrompt:
      "Style the person in a trench coat or elegant dress at Yibin Sanjiangkou riverside sunset, broad river view, soft skyline, warm wind, relaxed elegant posture, local lifestyle photography.",
    coverPrompt:
      "A realistic adult Chinese woman in a trench coat or elegant dress at Yibin Sanjiangkou riverside sunset, broad river, warm wind.",
  },
  {
    slug: "female-retro-hongkong-neon",
    name: "复古港风",
    category: "女士 · 复古",
    gender: "female",
    tagline: "红棕色系，霓虹街头",
    description: "红棕色系和霓虹街头，复古电影感。",
    scenePrompt:
      "Style the person in a tasteful red-brown retro outfit on a neon street at night, warm tungsten lights, subtle film grain, candid cinematic pose, realistic Hong Kong film-inspired portrait, keep the face readable and natural without red, yellow, or muddy color cast.",
    coverPrompt:
      "A realistic adult Chinese woman in red-brown retro styling on a neon street at night, warm tungsten lights, film grain.",
  },
  {
    slug: "female-musician-livehouse",
    name: "音乐人气质",
    category: "女士 · 音乐",
    gender: "female",
    tagline: "黑色造型，livehouse",
    description: "黑色造型和现场音乐空间，酷但真实。",
    scenePrompt:
      "Style the person in a black music-inspired outfit inside a livehouse, dim stage spill light, textured walls, microphone stand or instrument case as subtle prop, cool natural confidence, realistic low-light portrait with the face still readable and not crushed into shadow.",
    coverPrompt:
      "A realistic adult Chinese woman in black music-inspired styling inside a livehouse, dim stage light, textured walls, cool natural portrait.",
  },
  {
    slug: "female-sunny-tennis",
    name: "运动阳光",
    category: "女士 · 运动",
    gender: "female",
    tagline: "运动套装，网球场",
    description: "健康、明亮、有活力的运动写真。",
    scenePrompt:
      "Style the person in a clean athletic outfit on a tennis court, bright but soft daylight, relaxed sporty posture, natural smile, realistic lifestyle portrait, no overexposed face, no action distortion.",
    coverPrompt:
      "A realistic adult Chinese woman in a clean athletic outfit on a tennis court, bright daylight, sporty natural smile.",
  },
  {
    slug: "female-paris-travel-relaxed",
    name: "旅行松弛",
    category: "女士 · 旅行",
    gender: "female",
    tagline: "衬衫长裙，巴黎街头",
    description: "巴黎街头的轻松旅行照片感。",
    scenePrompt:
      "Style the person in a shirt and long skirt on a Paris street, stone building facades, cafe tables, soft daylight, relaxed travel mood, candid walking pose, realistic travel photography, natural skin tone without gray or washed-out color.",
    coverPrompt:
      "A realistic adult Chinese woman in a shirt and long skirt on a Paris street, stone facades, cafe tables, relaxed travel portrait.",
  },
  {
    slug: "female-content-creator-studio",
    name: "自媒体博主",
    category: "女士 · 工作室",
    gender: "female",
    tagline: "休闲精致穿搭，工作室",
    description: "精致但自然的创作者工作室形象。",
    scenePrompt:
      "Style the person in polished casual clothing inside a creator studio, desk, camera, plants and soft daylight, friendly confident expression, modern lifestyle work portrait, realistic and not overly staged.",
    coverPrompt:
      "A realistic adult Chinese woman in polished casual clothing inside a creator studio, desk, camera, plants, soft daylight.",
  },
  {
    slug: "female-art-studio-dark-dress",
    name: "艺术写真",
    category: "女士 · 艺术",
    gender: "female",
    tagline: "深色长裙，画室",
    description: "画室空间和深色长裙，安静有艺术感。",
    scenePrompt:
      "Style the person in a dark long dress inside an artist studio, canvases, brushes, textured wall, soft directional light, quiet artistic presence, realistic editorial portrait.",
    coverPrompt:
      "A realistic adult Chinese woman in a dark long dress inside an artist studio, canvases, textured wall, soft directional light.",
  },
  {
    slug: "female-yibin-night-landmark",
    name: "宜宾城市名片",
    category: "女士 · 宜宾",
    gender: "female",
    tagline: "优雅穿搭，宜宾江景夜色",
    description: "适合展示本地城市气质的夜景写真。",
    scenePrompt:
      "Style the person in elegant contemporary clothing at a Yibin riverside landmark at night, river lights and city skyline bokeh, polished local identity portrait, realistic night photography with clear face exposure and no muddy color cast.",
    coverPrompt:
      "A realistic adult Chinese woman in elegant contemporary clothing at a Yibin riverside landmark at night, river lights, skyline bokeh.",
  },
  {
    slug: "female-dai-ethnic-portrait",
    name: "傣族风情",
    category: "女士 · 民族风",
    gender: "female",
    tagline: "傣族服饰，热带庭院",
    description: "真实傣族服饰写真，精致但不影楼化。",
    scenePrompt:
      "Style the person in elegant Dai ethnic-inspired women’s clothing similar to a real Thai/Dai garden portrait: pink one-shoulder sash with delicate gold embroidery, green woven long skirt with geometric pattern, tasteful gold jewelry and earrings, hair pinned up with flowers, standing under large tropical banana leaves in a lush garden, one hand lightly holding a leaf for shade, soft natural daylight filtered through greenery, fresh natural skin with pores and normal texture, consistent daylight color temperature across face, neck, and clothing, no yellow or orange skin cast, not oily, not plastic, not over-retouched, respectful cultural portrait, realistic fabric and jewelry details.",
    coverPrompt:
      "A realistic adult Chinese woman wearing elegant Dai ethnic-inspired clothing: pink embroidered one-shoulder sash, green woven skirt, tasteful gold jewelry, hair flowers, standing under large banana leaves in a lush tropical garden, natural daylight, fresh non-oily skin texture, real camera portrait.",
  },
];
