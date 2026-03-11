"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TIERS = ["Copper", "Bronze", "Silver", "Gold", "Diamond"];

const AMOUNTS = ["$5K", "$10K", "$20K", "$40K"];
const PRICES = ["$25", "$49", "$89", "$169"];

const ROWS = [
  { label: "Profit target", values: ["8%", "8%", "10%", "10%"] },
  { label: "Max drawdown", values: ["10%", "10%", "10%", "10%"] },
  { label: "Daily drawdown", values: ["5%", "5%", "5%", "5%"] },
  { label: "Leverage", values: ["1:100", "1:100", "1:100", "1:100"] },
  { label: "Min trades", values: ["3", "3", "3", "3"] },
  {
    label: "Max days",
    values: ["Unlimited", "Unlimited", "Unlimited", "Unlimited"],
    isGreen: true,
  },
  { label: "Profit split", values: ["70%", "75%", "85%", "90%"] },
  { label: "Fee refund", values: ["✓", "✓", "✓", "✓"] },
  { label: "Max funding", values: ["$200K", "$200K", "$400K", "$400K"] },
];

export default function PricingSection() {
  const [tier, setTier] = useState(0);

  return (
    <section className="bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Shooting star decoration */}
        <div className="relative h-8 mb-6 overflow-hidden">
          <div
            className="absolute h-px bg-gradient-to-r from-transparent via-accent to-transparent"
            style={{
              width: "120px",
              top: "50%",
              left: "40%",
              transform: "rotate(-20deg)",
              animation: "laser-x 4s linear infinite",
            }}
          />
        </div>

        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Best prices in prop industry!
          </h2>
        </div>

        {/* Tier tabs */}
        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {TIERS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTier(i)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all border",
                tier === i
                  ? "bg-accent text-black border-accent"
                  : "bg-transparent text-white/60 border-white/15 hover:border-white/30"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Pricing table */}
        <div className="relative overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-widest w-40">
                    Virtual capital size
                  </th>
                  {AMOUNTS.map((amt, i) => (
                    <th key={amt} className="p-4 text-center">
                      <div className="text-3xl font-black text-white mb-1">{amt}</div>
                      <div className="inline-block bg-accent/10 border border-accent/30 text-accent text-xs font-bold px-3 py-1 rounded-full">
                        Buy for {PRICES[i]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, ri) => (
                  <tr
                    key={row.label}
                    className="border-t border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="p-4 text-white/50 text-sm">{row.label}</td>
                    {row.values.map((v, vi) => (
                      <td key={vi} className="p-4 text-center">
                        {row.isGreen ? (
                          <span className="inline-block bg-accent/10 border border-accent/30 text-accent text-xs font-bold px-3 py-1 rounded-full">
                            {v}
                          </span>
                        ) : (
                          <span className="text-white font-semibold text-sm">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fade mask */}
          <div className="fade-bottom absolute inset-x-0 bottom-0 h-32 pointer-events-none" />
        </div>

        {/* See more button */}
        <div className="flex justify-center mt-6">
          <button className="border border-white/20 text-white/70 font-medium px-6 py-2.5 rounded-full text-sm hover:border-accent/40 hover:text-white transition-all">
            See more details ›
          </button>
        </div>
      </div>
    </section>
  );
}
