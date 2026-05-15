import type { PhotoTemplate } from "@/features/templates/types";
import { portraitTemplateSpecs } from "@/features/templates/portrait-template-specs";

const identityGuard = [
  "Identity has the highest priority over template style, atmosphere, and beautification.",
  "Preserve the recognizable facial identity from all reference photos so the subject remains the same real person in every template.",
  "Keep the same core face shape, facial proportions, eye distance, eyes, eyelids, eyebrows, nose bridge, mouth, lips, jawline, chin, cheekbones, forehead, skin undertone, age impression, and distinctive facial features.",
  "Hairstyle, grooming, makeup, and clothing may be naturally adapted to fit the selected portrait style, but do not change the person's face structure, natural complexion, ethnicity, apparent age, body type impression, or personal identity.",
  "Do not average the face into a generic prettier person, influencer face, idol face, or beauty-filtered version that is less recognizable than the reference photos.",
].join(" ");

const templateStyleGuard = [
  "Template styling is important: clothing, hairstyle, grooming, light makeup, accessories, pose, environment, and gentle atmosphere color should closely match the selected template.",
  "Prefer the template's intended fashion direction over the original casual reference outfit or hair, unless that would weaken identity recognition, natural skin tone, facial structure, or balanced exposure.",
  "The portrait may be full-body, seven-tenths, nine-tenths, three-quarter, seated, or half-body; do not default to a tight headshot.",
  "Keep the head-to-body proportion natural and photographic, with a believable human scale rather than an oversized head or tiny body.",
  "Choose the framing that best shows the outfit, hairstyle, posture, and scene while keeping the face clearly recognizable and naturally lit.",
].join(" ");

const integrationGuard = [
  "Generate one continuous real photograph, not a face swap and not a head pasted onto a body.",
  "Head, hair, ears, jaw, neck, shoulders, collar or neckline, arms, hands, and clothing must be physically continuous with natural anatomy, believable proportions, and realistic contact shadows.",
  "Face, neck, hands, and clothing must share the same lighting direction, color temperature, sharpness, lens perspective, and depth of field.",
  "Ensure natural transitions around hairline, temples, ears, jawline, chin, neck, collar, neckline, and shoulders; no cutout seams or hard edges.",
  "The outfit should fit the person's actual body with believable fabric tension, folds, and occlusion.",
].join(" ");

const exposureColorGuard = [
  "Keep balanced natural exposure so the face remains clearly readable.",
  "Preserve the person's natural skin undertone and believable complexion under the template lighting.",
  "Avoid blown highlights, crushed shadows, washed-out skin, gray skin, orange skin, overly red skin, harsh flash, unnatural color cast, and oversaturated grading.",
  "Color grading may support the template atmosphere, but skin tone and facial features must remain natural and consistent.",
].join(" ");

const realismGuard = [
  "Create a realistic finished portrait photograph, not an AI-looking image.",
  "Use natural skin texture, visible pores, subtle facial asymmetry, realistic hair strands, believable fabric wrinkles, real environment detail, authentic light falloff, and camera-like depth of field.",
  "The result should feel like a high-end photographer shot this person on location, with tasteful styling and refined color grading.",
  "Avoid over-retouching, plastic skin, waxy face, fake perfect symmetry, overly glossy eyes, generic influencer face, CGI lighting, surreal background, and template poster feeling.",
].join(" ");

const sharedNegativePrompt = [
  "different person",
  "changed face",
  "face swap",
  "identity drift",
  "wrong age",
  "wrong ethnicity",
  "pasted head",
  "pasted-on face",
  "face cutout",
  "floating head",
  "head cutout",
  "face mask",
  "hard edge around face",
  "hard edge around hairline",
  "visible seam",
  "face swap seam",
  "neck seam",
  "mismatched neck",
  "mismatched jaw",
  "mismatched skin tone",
  "wrong head size",
  "oversized head",
  "tiny head",
  "detached head",
  "broken neck",
  "stiff neck",
  "face brighter than body",
  "face sharper than body",
  "face smoother than body",
  "mismatched lighting between face and body",
  "mismatched color temperature",
  "overexposed",
  "underexposed",
  "blown highlights",
  "crushed shadows",
  "washed out skin",
  "gray skin",
  "orange skin",
  "overly red skin",
  "harsh flash",
  "flat lighting",
  "unnatural color cast",
  "oversaturated",
  "muddy colors",
  "face too bright",
  "face too dark",
  "stock photo body",
  "template body",
  "mannequin body",
  "body from another photo",
  "unnatural collar",
  "bad neckline",
  "clothing not fitting shoulders",
  "tight passport photo",
  "ID photo",
  "only face close-up",
  "cropped forehead",
  "cropped body",
  "AI face",
  "AI-looking",
  "over-smoothed skin",
  "plastic skin",
  "waxy face",
  "oily skin",
  "overly perfect skin",
  "glossy eyes",
  "CGI",
  "3D render",
  "fantasy armor",
  "futuristic mech",
  "anime",
  "cartoon",
  "illustration",
  "fake background",
  "cheap studio backdrop",
  "template poster",
  "distorted face",
  "deformed hands",
  "extra fingers",
  "duplicated person",
  "multiple people",
  "child",
  "pet",
  "watermark",
  "logo",
  "text overlay",
  "low resolution",
  "blurry",
].join(", ");

const defaultRecommendedRatios = ["3:4", "4:5", "9:16"] as const;
const defaultSupportedRatios = ["1:1", "3:4", "4:5", "9:16"] as const;

export const defaultTemplates: PhotoTemplate[] = portraitTemplateSpecs.map(
  (spec, index) => ({
    id: `tpl-${spec.slug}`,
    slug: spec.slug,
    name: spec.name,
    category: spec.category,
    coverUrl: `/templates/${spec.slug}.png`,
    tagline: spec.tagline,
    description: spec.description,
    prompt: `${identityGuard} ${templateStyleGuard} ${integrationGuard} ${exposureColorGuard} ${realismGuard} ${spec.scenePrompt}`,
    negativePrompt: sharedNegativePrompt,
    recommendedRatios: [...(spec.recommendedRatios ?? defaultRecommendedRatios)],
    supportedRatios: [...(spec.supportedRatios ?? defaultSupportedRatios)],
    genderOptions: [spec.gender],
    ageOptions: ["18-25", "26-35", "36-45", "46+"],
    sortOrder: index + 1,
    isActive: true,
  }),
);

export function getDefaultTemplateById(templateId: string) {
  return defaultTemplates.find((template) => template.id === templateId);
}

export function getDefaultTemplateBySlug(slug: string) {
  return defaultTemplates.find((template) => template.slug === slug);
}
