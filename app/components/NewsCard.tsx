"use client";
import { MarketData } from "@/lib/api";

interface Props {
  marketData: MarketData;
}

export default function NewsCard({ marketData }: Props) {
  const { news_summary, sentiment } = marketData;

  const sentimentColor =
    sentiment === "Positive" ? "#3FB950"
    : sentiment === "Negative" ? "#F85149"
    : "#FFA500";

  const headlines = news_summary
    ?.split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean) || [];

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📰 Market News</h3>
        <span
          className="text-xs px-2 py-1 rounded border font-semibold"
          style={{ color: sentimentColor, borderColor: `${sentimentColor}40`, background: `${sentimentColor}15` }}
        >
          {sentiment || "Neutral"}
        </span>
      </div>

      {headlines.length > 0 ? (
        <ul className="space-y-3">
          {headlines.map((headline, i) => (
            <li key={i} className="flex gap-3 text-sm text-[#C9D1D9] leading-relaxed">
              <span className="text-[#58A6FF] mt-0.5 shrink-0">▸</span>
              <span>{headline}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[#8B949E] text-sm">No recent news available.</p>
      )}
    </div>
  );
}
