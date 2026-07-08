# 宜宾精神状态测试漫画底图生成提示词

这批图片只作为无文字漫画底图使用，分享接口会在服务端继续叠加昵称、结果名、短句和关键词。

## 生成参数

```json
{
  "model": "gpt-image-2",
  "size": "3:4",
  "resolution": "2k",
  "n": 1,
  "output": "public/life-test/posters/{code}.png"
}
```

## 负向提示词

```text
文字, 字母, 数字, logo, 水印, 二维码, UI, 海报排版文字, 真人, 真实人物, 真人写真, 写实摄影, 摄影照片, 网红写真, photorealistic, realistic photo, semi-realistic, 3D render, CGI, 多人拥挤, 畸形手指, 多余手指, 肢体扭曲, 低清晰度, 模糊, 廉价影楼风, 赛博朋克, 未来机甲, 政治符号, 医疗场景
```

## 1. 翠屏山稳定假人

文件：`public/life-test/posters/stable-slow-soft-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 翠屏山稳定假人.
Persona keywords: 班味静音, 慢热, 低电量, 现实派.
Mood sentence for visual direction only, do not render text: 你不是情绪稳定，你是崩溃静音。
Scene inspiration: Yibin, Sichuan local lifestyle, 翠屏山, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 2. 李庄白糕型社交人

文件：`public/life-test/posters/stable-slow-soft-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 李庄白糕型社交人.
Persona keywords: 礼貌加载中, 慢热, 软但有筋, 安逸派.
Mood sentence for visual direction only, do not render text: 看起软，其实很有自己的筋骨。
Scene inspiration: Yibin, Sichuan local lifestyle, 李庄老街, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 3. 五粮液旁边清醒疯子

文件：`public/life-test/posters/stable-slow-fast-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 五粮液旁边清醒疯子.
Persona keywords: 清醒疯, 现实算盘, 执行中, CPU满载.
Mood sentence for visual direction only, do not render text: 你看起来很稳，其实脑内已经开了八个项目会。
Scene inspiration: Yibin, Sichuan local lifestyle, 酒都, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 4. 宜宾恋爱防空洞

文件：`public/life-test/posters/stable-slow-fast-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 宜宾恋爱防空洞.
Persona keywords: 想靠近, 怕麻烦, 慢启动, 边界感.
Mood sentence for visual direction only, do not render text: 你不是不想恋爱，你是怕恋爱把你炸懵。
Scene inspiration: Yibin, Sichuan local lifestyle, 老城巷口, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 5. 对红心慢热选手

文件：`public/life-test/posters/stable-open-soft-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 对红心慢热选手.
Persona keywords: 对红心, 慢热, 靠谱控, 巴心巴肝.
Mood sentence for visual direction only, do not render text: 你不怕慢，你怕不对红心。
Scene inspiration: Yibin, Sichuan local lifestyle, 江边茶座, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 6. 三江口江风回血员

文件：`public/life-test/posters/stable-open-soft-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 三江口江风回血员.
Persona keywords: 江边回血, 安逸, 社交低电, 温柔发疯.
Mood sentence for visual direction only, do not render text: 人生没有解决，只是被江风暂时按住了。
Scene inspiration: Yibin, Sichuan local lifestyle, 三江口, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 7. 南岸下班失踪人口

文件：`public/life-test/posters/stable-open-fast-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 南岸下班失踪人口.
Persona keywords: 班味浓, 下班隐身, 体面社交, 现实派.
Mood sentence for visual direction only, do not render text: 白天你是有礼貌的职场成年人，晚上你是消息灰度发布系统。
Scene inspiration: Yibin, Sichuan local lifestyle, 南岸, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 8. 戎州摆龙门阵大王

文件：`public/life-test/posters/stable-open-fast-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 戎州摆龙门阵大王.
Persona keywords: 会观察, 会接话, 有盐有味, 社交开机.
Mood sentence for visual direction only, do not render text: 你不一定解决问题，但你能把问题摆得有盐有味。
Scene inspiration: Yibin, Sichuan local lifestyle, 戎州茶馆, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 9. 宜宾岗位收藏夹活佛

文件：`public/life-test/posters/growth-slow-soft-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 宜宾岗位收藏夹活佛.
Persona keywords: 收藏夹, 观望中, 岗位雷达, 先稳住.
Mood sentence for visual direction only, do not render text: 你收藏的不是岗位，是对未来的一点仪式感。
Scene inspiration: Yibin, Sichuan local lifestyle, 大宜宾招聘, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 10. 竹海潜水型野心家

文件：`public/life-test/posters/growth-slow-soft-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 竹海潜水型野心家.
Persona keywords: 潜水, 蓄力, 野心慢热, 灵感型.
Mood sentence for visual direction only, do not render text: 你不爱张扬，但心里有山。
Scene inspiration: Yibin, Sichuan local lifestyle, 蜀南竹海, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 11. 临港机会雷达成精

文件：`public/life-test/posters/growth-slow-fast-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 临港机会雷达成精.
Persona keywords: 机会雷达, 先研究, 风险控制, 启动中.
Mood sentence for visual direction only, do not render text: 哪里有机会，哪里就有你的收藏和观望。
Scene inspiration: Yibin, Sichuan local lifestyle, 临港新区, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 12. 没平仄自由人

文件：`public/life-test/posters/growth-slow-fast-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 没平仄自由人.
Persona keywords: 没平仄, 不接受定义, 反骨, 自由但迷茫.
Mood sentence for visual direction only, do not render text: 你的人生主打一个：不一定。
Scene inspiration: Yibin, Sichuan local lifestyle, 街头岔路, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 13. 相亲局微表情分析师

文件：`public/life-test/posters/growth-open-soft-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 相亲局微表情分析师.
Persona keywords: 恋爱侦探, 会复盘, 微表情, 猜爪子.
Mood sentence for visual direction only, do not render text: 对方一句“哈哈”，你能分析出三页 PDF。
Scene inspiration: Yibin, Sichuan local lifestyle, 相亲局, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 14. 已读不回空气炸锅

文件：`public/life-test/posters/growth-open-soft-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 已读不回空气炸锅.
Persona keywords: 恋爱脑加班, 静音炸锅, 抽象, 情绪参与感.
Mood sentence for visual direction only, do not render text: 外表静音，内心炸锅。
Scene inspiration: Yibin, Sichuan local lifestyle, 聊天框, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 15. 珙县/高县/屏山反向开朗人

文件：`public/life-test/posters/growth-open-fast-real.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 珙县/高县/屏山反向开朗人.
Persona keywords: 反向开朗, 懂礼貌, 营业中, 独处回血.
Mood sentence for visual direction only, do not render text: 看起来开朗，实际上只是营业。
Scene inspiration: Yibin, Sichuan local lifestyle, 宜宾周边, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```

## 16. 宜宾隐藏款

文件：`public/life-test/posters/growth-open-fast-feel.png`

```text
Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.

Persona result: 宜宾隐藏款.
Persona keywords: 隐藏款, 抽象, 有趣, 不接受定义.
Mood sentence for visual direction only, do not render text: 普通选项装不下你。
Scene inspiration: Yibin, Sichuan local lifestyle, 三江口夜景, riverside city warmth, bamboo and river city atmosphere where suitable.

Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.
Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.
Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.
Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.
```
