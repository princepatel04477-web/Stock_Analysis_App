"use client";
import { cn } from "@/lib/utils";

interface CoinItem {
  name: string;
  symbol: string;
  pct: string;
  positive: boolean;
  color: string;
}

const COINS: CoinItem[] = [
  { name: "Cardano", symbol: "ADA", pct: "+4.21%", positive: true, color: "#0033AD" },
  { name: "Ripple", symbol: "XRP", pct: "-1.34%", positive: false, color: "#00AAE4" },
  { name: "Bitcoin", symbol: "BTC", pct: "+2.87%", positive: true, color: "#F7931A" },
  { name: "Ethereum", symbol: "ETH", pct: "+5.12%", positive: true, color: "#627EEA" },
  { name: "Solana", symbol: "SOL", pct: "-0.98%", positive: false, color: "#9945FF" },
  { name: "BNB", symbol: "BNB", pct: "+1.55%", positive: true, color: "#F3BA2F" },
  { name: "Tether", symbol: "USDT", pct: "+0.01%", positive: true, color: "#26A17B" },
];

function TickerItem({ coin }: { coin: CoinItem }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-[#111] border border-white/5 rounded-xl mx-3 shrink-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: coin.color }}
      >
        {coin.symbol[0]}
      </div>
      <span className="text-white font-semibold text-sm">{coin.name}</span>
      <span className={cn("text-sm font-bold", coin.positive ? "text-accent" : "text-red-400")}>
        {coin.pct}
      </span>
    </div>
  );
}

const doubled = [...COINS, ...COINS, ...COINS, ...COINS];

export default function TickerSection() {
  return (
    <section className="bg-[#0a0a0a] py-16 overflow-hidden">
      {/* Row 1 - left */}
      <div className="relative mb-4">
        <div className="flex animate-ticker">
          {doubled.map((c, i) => (
            <TickerItem key={`r1-${i}`} coin={c} />
          ))}
        </div>
      </div>

      {/* Row 2 - right */}
      <div className="relative mb-16">
        <div className="flex animate-ticker-reverse">
          {doubled.map((c, i) => (
            <TickerItem key={`r2-${i}`} coin={c} />
          ))}
        </div>
      </div>

      {/* CTA split */}
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row gap-8 items-center">
        {/* Left 35% */}
        <div className="md:w-[35%] shrink-0">
          <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-6">
            Stop losing your{" "}
            <span className="text-accent">own</span> money, join us and start earning!
          </h3>
          <div className="flex gap-3 flex-wrap">
            <button className="shimmer-btn text-black font-bold px-6 py-2.5 rounded-full text-sm">
              Start a challenge →
            </button>
            <button className="border border-white/20 text-white font-medium px-6 py-2.5 rounded-full text-sm hover:border-accent/40 transition-colors">
              Free trial
            </button>
          </div>
        </div>

        {/* Right 65% */}
        <div className="md:w-[65%] overflow-hidden">
          <div className="flex flex-wrap gap-0 leading-none select-none pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="text-accent font-black opacity-20 hover:opacity-40 transition-opacity"
                style={{ fontSize: "clamp(60px, 8vw, 130px)", lineHeight: 1 }}
              >
                Start earning{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
