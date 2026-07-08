export const defaultLifeTestCampaignId = "life_test_202607";

export type LifeTestAttributionInput = {
  source?: string | null;
  campaign?: string | null;
  campaignId?: string | null;
  entryScene?: string | null;
  channel?: string | null;
  regionCode?: string | null;
  shareCode?: string | null;
  referrerSessionId?: string | null;
  posterVariant?: string | null;
};

export type LifeTestAttribution = {
  source: string;
  campaign: string;
  campaignId: string;
  entryScene: string;
  channel: string;
  regionCode: string | null;
  shareCode: string | null;
  referrerSessionId: string | null;
  posterVariant: string | null;
};

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function normalizeLifeTestAttribution(
  input: LifeTestAttributionInput = {},
): LifeTestAttribution {
  const campaignId =
    clean(input.campaignId) ?? clean(input.campaign) ?? defaultLifeTestCampaignId;
  const channel = clean(input.channel) ?? clean(input.source) ?? "h5";
  const shareCode = clean(input.shareCode);

  return {
    source: clean(input.source) ?? channel,
    campaign: clean(input.campaign) ?? campaignId,
    campaignId,
    entryScene: clean(input.entryScene) ?? (shareCode ? "share_landing" : "home"),
    channel,
    regionCode: clean(input.regionCode),
    shareCode,
    referrerSessionId: clean(input.referrerSessionId),
    posterVariant: clean(input.posterVariant),
  };
}
