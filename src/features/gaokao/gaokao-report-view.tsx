"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { parseGaokaoReportContent } from "@/features/gaokao/gaokao-report";
import type {
  GaokaoProfile,
  GaokaoRecommendationBucket,
  GaokaoRecommendationItem,
  GaokaoRecommendations,
} from "@/features/gaokao/types";

const bucketMeta: Array<{
  key: GaokaoRecommendationBucket;
  title: string;
  tone: string;
}> = [
  { key: "chong", title: "冲一冲", tone: "bg-[#fff1e8] text-[#8c3f18]" },
  { key: "wen", title: "稳一稳", tone: "bg-[#edf7ed] text-[#276039]" },
  { key: "bao", title: "保一保", tone: "bg-[#eef2ff] text-[#354c91]" },
];

function formatRankGap(value: number | null) {
  if (value === null) {
    return "位次差缺失";
  }

  if (value > 0) {
    return `比你靠后 ${value} 名`;
  }

  if (value < 0) {
    return `比你靠前 ${Math.abs(value)} 名`;
  }

  return "与你位次接近";
}

function formatMajorMeta(
  item: NonNullable<GaokaoRecommendationItem["majorSuggestions"]>[number],
) {
  return [
    item.planCount ? `计划 ${item.planCount} 人` : null,
    item.estimatedRank ? `预估位次 ${item.estimatedRank}` : null,
    item.previousRank ? `2025 位次 ${item.previousRank}` : null,
    item.tuition ? `学费 ${item.tuition} 元/年` : null,
    item.duration ? `学制 ${item.duration}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function RecommendationItemCard({ item }: { item: GaokaoRecommendationItem }) {
  const majorSuggestions = item.majorSuggestions?.slice(0, 2) ?? [];
  const hiddenMajorCount = Math.max(
    0,
    (item.majorSuggestions?.length ?? 0) - majorSuggestions.length,
  );

  return (
    <article className="rounded-[8px] border border-black/8 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words text-sm font-black text-[#222822]">
            {item.schoolName}
          </h4>
          <p className="mt-1 break-words text-xs leading-5 text-[#667064]">
            {item.majorName ?? "专业组信息待核对"}
          </p>
        </div>
        <span className="shrink-0 rounded-[6px] bg-[#f5f7f1] px-2 py-1 text-xs font-black text-[#445044]">
          {item.riskLabel}
        </span>
      </div>
      <div className="mt-2 grid gap-2 text-xs text-[#667064] sm:grid-cols-4">
        <span>{item.year} 年</span>
        <span>{item.score ? `${item.score} 分` : "分数缺失"}</span>
        <span>{item.rank ? `位次 ${item.rank}` : "位次缺失"}</span>
        <span>{formatRankGap(item.rankGap)}</span>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-[#485247]">
        {formatRankGap(item.rankGap)}。{item.reason}
      </p>
      {majorSuggestions.length > 0 ? (
        <div className="mt-3 border-t border-black/8 pt-3">
          <p className="text-xs font-black text-[#384238]">组内建议专业</p>
          <ul className="mt-2 space-y-2">
            {majorSuggestions.map((major) => (
              <li key={`${item.id}-${major.majorName}`} className="text-xs leading-5 text-[#485247]">
                <div className="break-words font-black text-[#222822]">{major.majorName}</div>
                <div className="break-words">{formatMajorMeta(major) || "计划细节需继续核对"}</div>
                {major.majorNote ? <div className="break-words">{major.majorNote}</div> : null}
                <div className="break-words">{major.fitReason}</div>
                {major.riskNote ? (
                  <div className="break-words font-bold text-[#8c3f18]">{major.riskNote}</div>
                ) : null}
              </li>
            ))}
          </ul>
          {hiddenMajorCount > 0 ? (
            <p className="mt-2 rounded-[8px] bg-[#f7f8f5] px-2 py-1 text-xs font-bold text-[#667064]">
              另有 {hiddenMajorCount} 个组内专业，需打开招生计划继续核对。
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RecommendationBucketView({
  title,
  tone,
  items,
}: {
  title: string;
  tone: string;
  items: GaokaoRecommendationItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-[8px] bg-[#f7f8f5] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className={`inline-flex rounded-[6px] px-2 py-1 text-xs font-black ${tone}`}>
          {title} · {items.length} 条
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-white px-2 text-xs font-black text-[#475467] shadow-sm"
        >
          {isOpen ? "收起" : "展开"}
          <ChevronDown
            size={14}
            className={isOpen ? "rotate-180" : ""}
          />
        </button>
      </div>

      {isOpen ? (
        <div className="mt-3 space-y-2">
          {items.length > 0 ? (
            items.map((item) => <RecommendationItemCard key={item.id} item={item} />)
          ) : (
            <p className="rounded-[8px] bg-white p-3 text-sm leading-6 text-[#667064]">
              这一档暂无候选，建议放宽位次范围或偏好后再核对。
            </p>
          )}
          {items.length > 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#d8e0ea] bg-white px-3 py-2 text-xs leading-5 text-[#667064]">
              <span>已看完{title}，是否收起？</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 inline-flex h-7 items-center rounded-[8px] bg-[#f3f7ff] px-2 font-black text-[#1769e8]"
              >
                收起本栏
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-3 block w-full rounded-[8px] bg-white p-3 text-left text-sm leading-6 text-[#667064] shadow-sm"
        >
          当前已收起，点击展开查看{title}候选。
        </button>
      )}
    </section>
  );
}

export function GaokaoReportView({
  summary,
  profile,
  recommendations,
}: {
  summary: string;
  profile: GaokaoProfile;
  recommendations: GaokaoRecommendations;
}) {
  const content = parseGaokaoReportContent({ summary, profile, recommendations });

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-[#7a6a3a]">报告结论</p>
        <h2 className="mt-2 text-lg font-black text-[#1f2523]">
          {content.headline}
        </h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="姓名" value={content.studentSnapshot.name} />
          <Info label="科类" value={content.studentSnapshot.subjectType} />
          <Info
            label="再选"
            value={content.studentSnapshot.optionalSubjects.join("、") || "未填写"}
          />
          <Info
            label="成绩"
            value={[
              content.studentSnapshot.score
                ? `${content.studentSnapshot.score} 分`
                : null,
              content.studentSnapshot.rank
                ? `位次 ${content.studentSnapshot.rank}`
                : null,
            ]
              .filter(Boolean)
              .join(" / ") || "未填写"}
          />
        </dl>
      </section>

      <ReportList title="考生画像" items={content.candidateProfile} />
      <ReportList title="顾问确认参考" items={content.advisorReferences} />

      <section className="rounded-[8px] bg-white p-4 shadow-sm">
        <h3 className="text-base font-black text-[#1f2523]">冲稳保候选</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {bucketMeta.map((bucket) => (
            <RecommendationBucketView
              key={bucket.key}
              title={bucket.title}
              tone={bucket.tone}
              items={recommendations[bucket.key]}
            />
          ))}
        </div>
      </section>

      <ReportList title="策略说明" items={content.strategySummary} />
      <ReportList title="专业和城市取舍" items={content.tradeoffNotes} />
      <ReportList title="民办 / 中外 / 调剂风险" items={content.conditionRisks} />
      <ReportList title="风险提醒" items={content.riskNotes} />
      <ReportList title="下一步核对清单" items={content.nextActions} />

      <section className="rounded-[8px] border border-[#ead2a4] bg-[#fff8e5] p-4 text-sm leading-6 text-[#6d5322]">
        {content.disclaimer}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-[8px] bg-[#f5f7f1] px-3 py-2">
      <dt className="text-[#6d766d]">{label}</dt>
      <dd className="text-right font-bold text-[#222822]">{value}</dd>
    </div>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[8px] bg-white p-4 shadow-sm">
      <h3 className="text-base font-black text-[#1f2523]">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#485247]">
        {items.map((item) => (
          <li key={item} className="rounded-[8px] bg-[#f7f8f5] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
