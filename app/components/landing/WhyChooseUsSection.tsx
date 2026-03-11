"use client";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="#39FF14" strokeWidth="2">
        <circle cx="24" cy="24" r="20" strokeOpacity="0.3" />
        <circle cx="24" cy="24" r="14" strokeOpacity="0.5" />
        <line x1="24" y1="8" x2="24" y2="24" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="24" x2="34" y2="24" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "No Time Limit",
    description:
      "Trade at your own pace. No artificial deadlines forcing bad decisions. Complete the challenge whenever you're ready.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="20" stroke="rgba(57,255,20,0.3)" strokeWidth="2" />
        <path
          d="M24 44 A20 20 0 0 1 4 24 A20 20 0 0 1 44 24"
          stroke="#39FF14"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="44" cy="24" r="4" fill="#39FF14" />
      </svg>
    ),
    title: "Fast Progress",
    description:
      "Structured programs designed to fast-track your growth. Achieve your profit targets efficiently and get funded faster.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <ellipse cx="24" cy="24" rx="18" ry="20" stroke="rgba(57,255,20,0.3)" strokeWidth="2" />
        <ellipse cx="24" cy="24" rx="18" ry="8" stroke="rgba(57,255,20,0.5)" strokeWidth="1.5" />
        <path d="M20 14 L24 8 L28 14" fill="#39FF14" strokeWidth="0" />
        <line x1="24" y1="8" x2="24" y2="40" stroke="#39FF14" strokeWidth="2" />
      </svg>
    ),
    title: "Unique programs",
    description:
      "From Copper to Diamond — multiple funding tiers designed to match your experience and trading style.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <rect x="8" y="4" width="20" height="34" rx="4" stroke="rgba(57,255,20,0.5)" strokeWidth="2" />
        <rect x="10" y="10" width="16" height="10" rx="1" fill="rgba(57,255,20,0.2)" />
        <path d="M28 24 L44 18 L44 40 L28 40Z" stroke="#39FF14" strokeWidth="1.5" fill="rgba(57,255,20,0.1)" />
        <polyline points="32,36 36,28 40,32" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "A modern platform",
    description:
      "The Lab™ — our proprietary native platform built specifically for prop traders. Advanced tools, clean UI, zero latency.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Why choose our Prop trading company?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className={cn(
                "group bg-[#111] border border-white/8 rounded-2xl p-8 transition-all duration-300",
                "hover:border-accent/30 hover:shadow-[0_0_30px_rgba(57,255,20,0.08)]"
              )}
            >
              <div className="mb-5">{feat.icon}</div>
              <h3 className="text-xl font-black text-white mb-3 group-hover:text-accent transition-colors">
                {feat.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
