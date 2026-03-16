"use client";
import { MarketData } from "@/lib/api";
import { formatINR } from "@/lib/format";

interface Props {
  marketData: MarketData;
}

export default function TechnicalSnapshot({ marketData }: Props) {
  const { rsi_14, sma_20, sma_50 } = marketData;

  const rsiColor =
    rsi_14 > 70 ? "#F85149" : rsi_14 < 30 ? "#3FB950" : "#FFA500";

  const rsiLabel =
    rsi_14 > 70 ? "Overbought" : rsi_14 < 30 ? "Oversold" : "Neutral";

  const rows = [
    { label: "RSI (14)", value: rsi_14?.toFixed(1), color: rsiColor, badge: rsiLabel },
    { label: "SMA (20)", value: sma_20 != null ? formatINR(sma_20) : "N/A" },
    { label: "SMA (50)", value: sma_50 != null ? formatINR(sma_50) : "N/A" },
  ];

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">Technical Snapshot</h3>
      <table className="w-full">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#30363D] last:border-0">
              <td className="py-3 text-[#8B949E] text-sm">{row.label}</td>
              <td className="py-3 text-right">
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: row.color || "#FAFAFA" }}
                >
                  {row.value || "N/A"}
                </span>
                {row.badge && (
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded"
                    style={{ color: row.color, border: `1px solid ${row.color}30`, background: `${row.color}15` }}
                  >
                    {row.badge}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
