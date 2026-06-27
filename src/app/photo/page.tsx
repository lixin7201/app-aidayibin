import { getStoredSessionFromCookies } from "@/features/auth/session";
import { AiPhotoApp } from "@/features/h5/ai-photo-app";
import { getQuotaSnapshot } from "@/features/quota/quota-service";
import { listTemplates } from "@/features/templates/template-repository";
import type {
  PhotoTemplate,
  PublicPhotoTemplate,
} from "@/features/templates/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toPublicTemplate(template: PhotoTemplate): PublicPhotoTemplate {
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    category: template.category,
    coverUrl: getTemplatePreviewUrl(template.coverUrl),
    animatedCoverUrl: template.animatedCoverUrl,
    tagline: template.tagline,
    description: template.description,
    recommendedRatios: template.recommendedRatios,
    supportedRatios: template.supportedRatios,
    genderOptions: template.genderOptions,
    ageOptions: template.ageOptions,
    sortOrder: template.sortOrder,
    isActive: template.isActive,
  };
}

function getTemplatePreviewUrl(coverUrl: string) {
  if (!coverUrl.startsWith("/templates/") || !coverUrl.endsWith(".png")) {
    return coverUrl;
  }

  return coverUrl.replace("/templates/", "/templates/thumbs/").replace(
    /\.png$/,
    ".webp",
  );
}

export default async function PhotoPage() {
  const user = await getStoredSessionFromCookies();
  const [templates, quota] = await Promise.all([
    listTemplates(),
    user
      ? getQuotaSnapshot(user)
      : Promise.resolve({
          dailyLimit: 3,
          dailySuccessCount: 0,
          dailyRemaining: 0,
          campaignLimit: 10,
          campaignSuccessCount: 0,
          campaignRemaining: 0,
          dailySubmitLimit: 5,
          dailySubmitCount: 0,
          hasRunningTask: false,
          platformDailyLimit: 3000,
          platformDailySuccessCount: 0,
          platformDailyRemaining: 3000,
          isUnlimited: false,
        }),
  ]);

  return (
    <AiPhotoApp
      initialTemplates={templates.map(toPublicTemplate)}
      initialQuota={quota}
      currentUser={
        user
          ? {
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            }
          : null
      }
    />
  );
}
