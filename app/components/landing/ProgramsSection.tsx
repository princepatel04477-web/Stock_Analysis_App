"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PROGRAMS = [
  {
    id: "bronze",
    tier: "Bronze 3",
    number: "3",
    description: "Entry-level program designed for new traders to prove their skills and grow their account steadily.",
    gradient: "from-[#1a1208] to-[#0a0a0a]",
    numberColor: "text-amber-700/20",
    accent: "#cd7f32",
  },
  {
    id: "silver",
    tier: "Silver 2",
    number: "2",
    description: "Intermediate level for traders with consistent results seeking higher capital allocation.",
    gradient: "from-[#111520] to-[#0a0a0a]",
    numberColor: "text-slate-400/15",
    accent: "#c0c0c0",
  },
  {
    id: "gold",
    tier: "Gold 1",
    number: "1",
    description: "Advanced program for experienced traders.",
    rating: "★★★★ For advanced traders",
    gradient: "from-[#1a1500] to-[#0a0a0a]",
    numberColor: "text-yellow-400/15",
    accent: "#FFD700",
    diagonal: true,
  },
  {
    id: "diamond",
    tier: "Diamond",
    number: "◆",
    description: "Elite program for the most experienced prop traders with maximum capital and splits.",
    rating: "★★★★★ For experienced traders",
    gradient: "from-[#10071a] to-[#0a0a0a]",
    numberColor: "text-purple-400/15",
    accent: "#a855f7",
  },
];

export default function ProgramsSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Choose one of our programs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROGRAMS.map((prog) => {
            const isHovered = hovered === prog.id;
            const isDimmed = hovered !== null && !isHovered;

            return (
              <div
                key={prog.id}
                onMouseEnter={() => setHovered(prog.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-white/8 p-8 cursor-pointer transition-all duration-300 bg-gradient-to-br",
                  prog.gradient,
                  isHovered && "scale-[1.02] border-white/20",
                  isDimmed && "opacity-40"
                )}
                style={{
                  boxShadow: isHovered
                    ? `0 0 40px ${prog.accent}22`
                    : "none",
                }}
              >
                {/* Giant number bg */}
                <div
                  className={cn(
                    "absolute right-4 bottom-0 font-black text-[160px] leading-none select-none pointer-events-none",
                    prog.numberColor
                  )}
                >
                  {prog.number}
                </div>

                {/* Diagonal pattern for gold */}
                {prog.diagonal && (
                  <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, #FFD700 0px, #FFD700 1px, transparent 1px, transparent 20px)",
                    }}
                  />
                )}

                {/* Stars for diamond */}
                {prog.id === "diamond" && (
                  <div className="absolute top-4 right-20 text-purple-300/30 text-2xl animate-pulse">
                    ✦ ✦ ✦
                  </div>
                )}

                <div className="relative z-10">
                  <h3
                    className="text-3xl font-black mb-2"
                    style={{ color: prog.accent }}
                  >
                    {prog.tier}
                  </h3>
                  {prog.rating && (
                    <div className="text-white/50 text-xs font-medium mb-3">
                      {prog.rating}
                    </div>
                  )}
                  <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-[220px]">
                    {prog.description}
                  </p>
                  <button
                    className="border border-white/20 text-white text-xs font-bold px-5 py-2 rounded-full hover:border-white/40 transition-colors tracking-widest"
                  >
                    LEARN MORE ›
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
