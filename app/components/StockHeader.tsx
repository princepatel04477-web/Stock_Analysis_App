"use client";
import { MarketData } from "@/lib/api";
import { formatINR } from "@/lib/format";

interface Props {
  symbol: string;
  marketData: MarketData;
  fromCache: boolean;
}

export default function StockHeader({ symbol, marketData, fromCache }: Props) {
  const { current_price, change_percent, company_name, sector } = marketData;
  const isPositive = change_percent >= 0;

  return (
    <div className="flex justify-between items-start border-b border-[#30363D] pb-5 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">{symbol}</h1>
          <span className="text-xs bg-[#2E3245] text-[#8B949E] px-2 py-1 rounded">NSE</span>
          {fromCache && (
            <span className="text-xs bg-[#1f3a1f] text-[#3FB950] px-2 py-1 rounded border border-[#3FB950]/30">
              Cached
            </span>
          )}
        </div>
        <p className="text-[#8B949E] mt-1">{company_name}</p>
        {sector && sector !== "N/A" && (
          <p className="text-[#8B949E] text-sm mt-0.5">{sector}</p>
        )}
      </div>

      <div className="text-right">
        <div className="text-4xl font-bold">{formatINR(current_price)}</div>
        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
          isPositive
            ? "bg-[#3FB950]/20 text-[#3FB950]"
            : "bg-[#F85149]/20 text-[#F85149]"
        }`}>
          {isPositive ? "+" : ""}{change_percent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
