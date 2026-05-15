# 当前个人展示面模板提示词盘点

> 生成时间：2026-05-09。本文档整理当前本地 Supabase `photo_templates` 表里处于启用状态的模板提示词，以及例图生成脚本里的公共提示词。

## 结论先说

- 例图生成脚本使用的是 `model: gpt-image-2`。
- 例图生成脚本当前写的是 `resolution: 1k`，不是 2k。
- 当前数据库里启用模板数量：`40` 个；其中还混有早期 12 个旧模板，所以你看到的前排模板可能仍是旧版本。
- 当前提示词偏“真实普通人”和“人脸一致性”，但没有强约束年轻感、时尚造型、身材比例、全身/七分构图，因此容易出普通、中年、半身照。

## 例图生成公共提示词

### 模型参数

```json
{
  "model": "gpt-image-2",
  "size": "3:4",
  "resolution": "1k",
  "n": 1
}
```

### 例图公共正向提示词

```text
Create a premium realistic portrait photography sample cover for an AI portrait template. One single adult Chinese person matching the requested gender, no celebrity likeness. The image must look like a real editorial photograph shot by a good photographer, not like AI art. Use realistic skin texture, visible pores, natural facial asymmetry, believable hair strands, real fabric wrinkles, detailed real environment, authentic lighting, camera-like depth of field, refined color grading. The person should look attractive but believable, with a natural expression and realistic human posture. No text, no logo, no watermark, no UI elements, no extra people, no child, no pet. Avoid plastic skin, waxy face, overly perfect symmetry, CGI lighting, fantasy effects, cheap studio backdrop, fake poster look, anime, cartoon, 3D render.
```

### 例图公共负向提示词

```text
low quality, blurry, over-smoothed skin, plastic face, waxy skin, fake CGI, anime, cartoon, illustration, 3D render, fantasy armor, futuristic mech, distorted face, extra fingers, deformed hands, multiple people, child, pet, watermark, logo, text overlay, cheap studio background, uncanny face, AI generated look
```

## 当前网页实际模板提示词

### 1. 清冷知性（男士 · 知性）

- `id`: `tpl-male-cool-intellectual-library`
- `slug`: `male-cool-intellectual-library`
- `cover_url`: `/templates/male-cool-intellectual-library.png`
- `sort_order`: `1`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person as a cool intellectual man in a crisp white shirt, inside a modern library with tall shelves, quiet architectural lines, soft natural window light, calm restrained expression, refined but not stiff.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 2. 都市极简（男士 · 都市）

- `id`: `tpl-male-urban-minimal-architecture`
- `slug`: `male-urban-minimal-architecture`
- `cover_url`: `/templates/male-urban-minimal-architecture.png`
- `sort_order`: `2`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person as a modern urban man wearing a black cropped jacket and simple inner layer, standing in a grey-white architectural district, clean lines, soft overcast light, minimalist city fashion photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 3. 松弛韩系（男士 · 生活）

- `id`: `tpl-male-relaxed-korean-cafe`
- `slug`: `male-relaxed-korean-cafe`
- `cover_url`: `/templates/male-relaxed-korean-cafe.png`
- `sort_order`: `3`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a soft knit cardigan and relaxed casual trousers, sitting by a cafe window with daylight, ceramic cup and subtle street view, gentle Korean-inspired lifestyle mood, candid and believable.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 4. 时尚休闲（男士 · 时尚）

- `id`: `tpl-male-fashion-casual-boutique`
- `slug`: `male-fashion-casual-boutique`
- `cover_url`: `/templates/male-fashion-casual-boutique.png`
- `sort_order`: `4`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in an oversized tasteful shirt, clean trousers and subtle accessories, inside a curated fashion boutique with racks, mirrors and warm retail lighting, natural confident pose, realistic fashion editorial photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 5. 文艺青年（男士 · 文艺）

- `id`: `tpl-male-literary-bookstore-linen`
- `slug`: `male-literary-bookstore-linen`
- `cover_url`: `/templates/male-literary-bookstore-linen.png`
- `sort_order`: `5`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a linen shirt in an old bookstore, wooden shelves, stacked books, soft dusty window light, thoughtful expression, gentle film photography texture, realistic and not staged.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 6. 男团生活感（男士 · 潮流）

- `id`: `tpl-male-idol-practice-hall`
- `slug`: `male-idol-practice-hall`
- `cover_url`: `/templates/male-idol-practice-hall.png`
- `sort_order`: `6`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a baseball jacket and clean streetwear, in a dance practice hallway with mirrors and soft fluorescent light, youthful idol lifestyle feeling, natural pose, realistic skin and fabric, no stage fantasy.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 7. 古装剑士（男士 · 古风）

- `id`: `tpl-male-ancient-swordsman`
- `slug`: `male-ancient-swordsman`
- `cover_url`: `/templates/male-ancient-swordsman.png`
- `sort_order`: `7`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person as a handsome realistic ancient Chinese swordsman wearing layered dark Hanfu robes, leather belt and simple sword prop, stone courtyard and bamboo in the background, cinematic daylight, grounded historical drama photography, no magic effects.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 8. 新中式雅士（男士 · 新中式）

- `id`: `tpl-male-new-chinese-teahouse`
- `slug`: `male-new-chinese-teahouse`
- `cover_url`: `/templates/male-new-chinese-teahouse.png`
- `sort_order`: `8`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a modern Chinese jacket inside a refined teahouse, wooden lattice window, tea set, bamboo shadow, soft side light, calm elegant posture, warm muted color grading, realistic fabric and skin.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 9. 城市漫步（男士 · 街拍）

- `id`: `tpl-male-city-walk-sunset`
- `slug`: `male-city-walk-sunset`
- `cover_url`: `/templates/male-city-walk-sunset.png`
- `sort_order`: `9`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a casual jacket walking on a city street at dusk, warm street lights just turning on, soft motion in background, relaxed candid expression, documentary street portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 10. 电影男主（男士 · 电影感）

- `id`: `tpl-male-rainy-film-trenchcoat`
- `slug`: `male-rainy-film-trenchcoat`
- `cover_url`: `/templates/male-rainy-film-trenchcoat.png`
- `sort_order`: `10`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a trench coat on a narrow street after rain, wet pavement reflections, soft practical lights, cinematic but realistic composition, thoughtful expression, 35mm film mood, no exaggerated drama.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 11. 杂志封面（男士 · 棚拍）

- `id`: `tpl-male-magazine-black-turtleneck`
- `slug`: `male-magazine-black-turtleneck`
- `cover_url`: `/templates/male-magazine-black-turtleneck.png`
- `sort_order`: `11`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a black turtleneck for a minimalist grey studio magazine portrait, soft directional light, clean shadows, confident calm gaze, realistic pores and hair texture, premium editorial photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 12. 音乐人气质（男士 · 音乐）

- `id`: `tpl-male-musician-livehouse`
- `slug`: `male-musician-livehouse`
- `cover_url`: `/templates/male-musician-livehouse.png`
- `sort_order`: `12`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a tasteful leather jacket backstage at a livehouse, dim warm bulbs, instrument cases, textured black walls, relaxed musician energy, realistic low-light photography, no rock-star exaggeration.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 13. 运动阳光（男士 · 运动）

- `id`: `tpl-male-sunny-basketball`
- `slug`: `male-sunny-basketball`
- `cover_url`: `/templates/male-sunny-basketball.png`
- `sort_order`: `13`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a clean athletic outfit beside an outdoor basketball court, late afternoon sunlight, relaxed sporty posture, realistic sweat-free lifestyle portrait, natural smile, no action distortion.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 14. 轻商务（男士 · 职场）

- `id`: `tpl-male-smart-casual-office`
- `slug`: `male-smart-casual-office`
- `cover_url`: `/templates/male-smart-casual-office.png`
- `sort_order`: `14`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a light-colored smart casual suit without tie, in a bright open office with glass and wood details, approachable confident expression, natural daylight, premium but relaxed business portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 15. 江边松弛（男士 · 宜宾）

- `id`: `tpl-male-yibin-riverside-relaxed`
- `slug`: `male-yibin-riverside-relaxed`
- `cover_url`: `/templates/male-yibin-riverside-relaxed.png`
- `sort_order`: `15`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a white T-shirt with a casual jacket at Yibin Sanjiangkou riverside during sunset, river breeze, soft skyline, relaxed posture, local city lifestyle photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 16. 艺术策展人（男士 · 艺术）

- `id`: `tpl-male-art-curator-gallery`
- `slug`: `male-art-curator-gallery`
- `cover_url`: `/templates/male-art-curator-gallery.png`
- `sort_order`: `16`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a black shirt inside a contemporary art gallery, white walls, framed artworks, polished concrete floor, soft museum light, composed curator-like presence, realistic editorial portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 17. 冬日氛围（男士 · 氛围）

- `id`: `tpl-male-winter-warm-indoor`
- `slug`: `male-winter-warm-indoor`
- `cover_url`: `/templates/male-winter-warm-indoor.png`
- `sort_order`: `17`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a wool coat in a warm indoor lounge, amber lamp light, textured sofa, window reflection at night, calm winter atmosphere, realistic skin and wool texture.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 18. 机车风（男士 · 酷感）

- `id`: `tpl-male-real-motorcycle-style`
- `slug`: `male-real-motorcycle-style`
- `cover_url`: `/templates/male-real-motorcycle-style.png`
- `sort_order`: `18`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a leather jacket in a clean parking garage or outdoor parking lot with natural side light, motorcycle nearby as subtle prop, cool but realistic pose, no exaggerated biker fantasy.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 19. 宜宾城市名片（男士 · 宜宾）

- `id`: `tpl-male-yibin-night-landmark`
- `slug`: `male-yibin-night-landmark`
- `cover_url`: `/templates/male-yibin-night-landmark.png`
- `sort_order`: `19`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in relaxed smart attire at a recognizable Yibin city landmark at night, river lights and urban skyline bokeh, polished but natural local identity portrait, realistic night photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 20. 傣族风情（男士 · 民族风）

- `id`: `tpl-male-dai-ethnic-portrait`
- `slug`: `male-dai-ethnic-portrait`
- `cover_url`: `/templates/male-dai-ethnic-portrait.png`
- `sort_order`: `20`
- `gender_options`: `['male']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in elegant Dai ethnic-inspired male clothing with tasteful woven fabric, in a tropical courtyard with bamboo, palm leaves and warm daylight, respectful cultural portrait, realistic documentary fashion photography, no costume-party feeling.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 21. 温柔氛围（女士 · 温柔）

- `id`: `tpl-female-warm-cafe-knit`
- `slug`: `female-warm-cafe-knit`
- `cover_url`: `/templates/female-warm-cafe-knit.png`
- `sort_order`: `21`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a soft knit top inside a warm cafe, amber window light, coffee cup, relaxed gentle expression, natural makeup, cozy but refined lifestyle portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 22. 松弛韩系（女士 · 生活）

- `id`: `tpl-female-relaxed-korean-bakery`
- `slug`: `female-relaxed-korean-bakery`
- `cover_url`: `/templates/female-relaxed-korean-bakery.png`
- `sort_order`: `22`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a light cardigan near a small corner bakery, daylight through glass, paper bag and street view, relaxed Korean-inspired lifestyle mood, candid pose, believable natural beauty.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 23. 都市极简（女士 · 都市）

- `id`: `tpl-female-urban-minimal-suit`
- `slug`: `female-urban-minimal-suit`
- `cover_url`: `/templates/female-urban-minimal-suit.png`
- `sort_order`: `23`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a black-and-white minimalist outfit in a modern architectural district, clean composition, soft overcast daylight, composed urban confidence, realistic editorial street portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 24. 女团生活感（女士 · 潮流）

- `id`: `tpl-female-idol-practice-hall`
- `slug`: `female-idol-practice-hall`
- `cover_url`: `/templates/female-idol-practice-hall.png`
- `sort_order`: `24`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a clean athletic dance outfit inside a dance practice room, mirror wall, soft studio light, youthful girl group lifestyle feeling, natural confident pose, realistic skin and hair.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 25. 文艺胶片（女士 · 文艺）

- `id`: `tpl-female-literary-film-bookstore`
- `slug`: `female-literary-film-bookstore`
- `cover_url`: `/templates/female-literary-film-bookstore.png`
- `sort_order`: `25`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a subtle floral dress in an old bookstore, wooden shelves, soft dusty window light, gentle thoughtful expression, film photography grain, real texture and natural posture.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 26. 旗袍写真（女士 · 复古）

- `id`: `tpl-female-qipao-old-house`
- `slug`: `female-qipao-old-house`
- `cover_url`: `/templates/female-qipao-old-house.png`
- `sort_order`: `26`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in an elegant plain-color qipao inside an old heritage house, wooden stairs, patterned glass, soft afternoon light, graceful but natural posture, realistic period-inspired portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 27. 汉服园林（女士 · 古风）

- `id`: `tpl-female-hanfu-garden`
- `slug`: `female-hanfu-garden`
- `cover_url`: `/templates/female-hanfu-garden.png`
- `sort_order`: `27`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in elegant light-toned Hanfu in a traditional Chinese garden, stone path, greenery, soft daylight, fabric layers visible, natural human posture, realistic cultural portrait, no fantasy effects.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 28. 职场高级（女士 · 职场）

- `id`: `tpl-female-premium-office-couture`
- `slug`: `female-premium-office-couture`
- `cover_url`: `/templates/female-premium-office-couture.png`
- `sort_order`: `28`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a light-colored premium tailored women’s professional outfit in a bright modern office, clean desk, glass and wood details, confident approachable expression, natural daylight.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 29. 黑金杂志（女士 · 棚拍）

- `id`: `tpl-female-black-gold-magazine`
- `slug`: `female-black-gold-magazine`
- `cover_url`: `/templates/female-black-gold-magazine.png`
- `sort_order`: `29`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a black dress or black tailored skirt suit for a high-end black and warm gold studio magazine portrait, controlled shadows, elegant confident gaze, realistic skin texture.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 30. 春日花街（女士 · 季节）

- `id`: `tpl-female-spring-flower-street`
- `slug`: `female-spring-flower-street`
- `cover_url`: `/templates/female-spring-flower-street.png`
- `sort_order`: `30`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a light dress on a flower-lined street in spring, soft daylight, gentle breeze, natural smile, realistic lifestyle editorial photography, no fantasy petals overload.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 31. 森系自然（女士 · 自然）

- `id`: `tpl-female-forest-natural-cotton`
- `slug`: `female-forest-natural-cotton`
- `cover_url`: `/templates/female-forest-natural-cotton.png`
- `sort_order`: `31`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a cotton-linen dress in quiet forest greenery, morning light through leaves, relaxed candid pose, natural makeup, realistic skin and hair, airy but not overexposed.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 32. 江边日落（女士 · 宜宾）

- `id`: `tpl-female-yibin-riverside-sunset`
- `slug`: `female-yibin-riverside-sunset`
- `cover_url`: `/templates/female-yibin-riverside-sunset.png`
- `sort_order`: `32`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a trench coat or elegant dress at Yibin Sanjiangkou riverside sunset, broad river view, soft skyline, warm wind, relaxed elegant posture, local lifestyle photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 33. 复古港风（女士 · 复古）

- `id`: `tpl-female-retro-hongkong-neon`
- `slug`: `female-retro-hongkong-neon`
- `cover_url`: `/templates/female-retro-hongkong-neon.png`
- `sort_order`: `33`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a tasteful red-brown retro outfit on a neon street at night, warm tungsten lights, subtle film grain, candid cinematic pose, realistic Hong Kong film-inspired portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 34. 音乐人气质（女士 · 音乐）

- `id`: `tpl-female-musician-livehouse`
- `slug`: `female-musician-livehouse`
- `cover_url`: `/templates/female-musician-livehouse.png`
- `sort_order`: `34`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a black music-inspired outfit inside a livehouse, dim stage spill light, textured walls, microphone stand or instrument case as subtle prop, cool natural confidence, realistic low-light portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 35. 运动阳光（女士 · 运动）

- `id`: `tpl-female-sunny-tennis`
- `slug`: `female-sunny-tennis`
- `cover_url`: `/templates/female-sunny-tennis.png`
- `sort_order`: `35`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a clean athletic outfit on a tennis court, bright but soft daylight, relaxed sporty posture, natural smile, realistic lifestyle portrait, no action distortion.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 36. 旅行松弛（女士 · 旅行）

- `id`: `tpl-female-paris-travel-relaxed`
- `slug`: `female-paris-travel-relaxed`
- `cover_url`: `/templates/female-paris-travel-relaxed.png`
- `sort_order`: `36`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a shirt and long skirt on a Paris street, stone building facades, cafe tables, soft daylight, relaxed travel mood, candid walking pose, realistic travel photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 37. 自媒体博主（女士 · 工作室）

- `id`: `tpl-female-content-creator-studio`
- `slug`: `female-content-creator-studio`
- `cover_url`: `/templates/female-content-creator-studio.png`
- `sort_order`: `37`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in polished casual clothing inside a creator studio, desk, camera, plants and soft daylight, friendly confident expression, modern lifestyle work portrait, realistic and not overly staged.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 38. 艺术写真（女士 · 艺术）

- `id`: `tpl-female-art-studio-dark-dress`
- `slug`: `female-art-studio-dark-dress`
- `cover_url`: `/templates/female-art-studio-dark-dress.png`
- `sort_order`: `38`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in a dark long dress inside an artist studio, canvases, brushes, textured wall, soft directional light, quiet artistic presence, realistic editorial portrait.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 39. 宜宾城市名片（女士 · 宜宾）

- `id`: `tpl-female-yibin-night-landmark`
- `slug`: `female-yibin-night-landmark`
- `cover_url`: `/templates/female-yibin-night-landmark.png`
- `sort_order`: `39`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in elegant contemporary clothing at a Yibin riverside landmark at night, river lights and city skyline bokeh, polished local identity portrait, realistic night photography.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```

### 40. 傣族风情（女士 · 民族风）

- `id`: `tpl-female-dai-ethnic-portrait`
- `slug`: `female-dai-ethnic-portrait`
- `cover_url`: `/templates/female-dai-ethnic-portrait.png`
- `sort_order`: `40`
- `gender_options`: `['female']`
- `recommended_ratios`: `['3:4', '4:5', '9:16']`
- `supported_ratios`: `['1:1', '3:4', '4:5', '9:16']`

**正式生成正向提示词**

```text
Preserve the exact facial identity from all reference photos. Match the same face shape, facial proportions, eyes, eyelids, eyebrows, nose, mouth, lips, jawline, chin, cheekbones, forehead, hairline, skin tone, age impression, and distinctive facial features. Keep the person recognizable as the same real individual; do not beautify them into a different person. Do not change ethnicity, apparent age, face structure, body type, or personal identity. Create a realistic finished portrait photograph, not an AI-looking image. Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field. The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading. Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling. Style the person in elegant Dai ethnic-inspired women’s clothing with tasteful silver details and woven fabric, tropical courtyard with bamboo and palm leaves, warm daylight, respectful cultural portrait, realistic skin and fabric texture, no costume-party feeling.
```

**正式生成负向提示词**

```text
different person, changed face, face swap, identity drift, wrong age, wrong ethnicity, over-smoothed skin, plastic skin, waxy face, AI face, CGI, 3D render, fantasy armor, futuristic mech, anime, cartoon, illustration, beauty filter, overly perfect skin, fake background, cheap studio backdrop, template poster, distorted face, deformed hands, extra fingers, duplicated person, multiple people, child, pet, watermark, logo, text overlay, low resolution, blurry
```
