"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    label: "STEP 1",
    title: "Select Your Program",
    content: (
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">Gold Tier</div>
              <div className="text-3xl font-black text-white">$20,000</div>
              <div className="text-white/40 text-sm">Virtual Capital</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <span className="text-yellow-400 text-xl">★</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Profit Target", "10%"],
              ["Max Drawdown", "10%"],
              ["Profit Split", "Up to 90%"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-white/60">
                <span>{k}</span>
                <span className="text-white font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full bg-accent text-black font-bold py-2 rounded-full text-sm">
            Select Program
          </button>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    label: "STEP 2",
    title: "Trade the Markets",
    content: (
      <div className="p-8">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">BTC/USD</span>
            <span className="text-accent text-sm font-bold">+2.87%</span>
          </div>
          {/* Simple chart mockup */}
          <div className="h-32 relative">
            <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39FF14" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 80 L50 65 L100 70 L150 45 L200 50 L250 30 L300 35 L350 20 L400 15"
                fill="none"
                stroke="#39FF14"
                strokeWidth="2"
              />
              <path
                d="M0 80 L50 65 L100 70 L150 45 L200 50 L250 30 L300 35 L350 20 L400 15 L400 100 L0 100Z"
                fill="url(#chartGrad)"
              />
            </svg>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-accent/10 border border-accent/30 rounded-lg p-2 text-center">
              <div className="text-accent font-bold text-sm">BUY</div>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
              <div className="text-red-400 font-bold text-sm">SELL</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    label: "STEP 3",
    title: "Get Paid",
    content: (
      <div className="flex flex-col items-center justify-center p-8 gap-6">
        <div
          className="w-24 h-24 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center animate-pulse-glow"
        >
          <span className="text-5xl">🎉</span>
        </div>
        <div className="text-center">
          <div className="text-4xl font-black text-accent mb-2">$5,400.00</div>
          <div className="text-white/60 text-sm">Payout Completed</div>
        </div>
        <div className="bg-[#0a0a0a] border border-accent/20 rounded-xl p-4 w-full max-w-xs text-sm text-white/60 space-y-1">
          <div className="flex justify-between"><span>Profit Split</span><span className="text-accent font-bold">90%</span></div>
          <div className="flex justify-between"><span>Date</span><span className="text-white">Jun 6, 2023</span></div>
          <div className="flex justify-between"><span>Status</span><span className="text-accent">✓ Approved</span></div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-[#0a0a0a] py-24 px-6 relative">
      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-accent/40" />
      <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-accent/40" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-accent/40" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-accent/40" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            How does it{" "}
            <span className="text-accent">work?</span>
          </h2>
        </div>

        {/* Illustration area */}
        <div className="relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-6">
          {/* Green gradient bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(57,255,20,0.06) 0%, transparent 60%)",
            }}
          />
          <div className="min-h-[320px]">
            {steps[active].content}
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 justify-center">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActive(i)}
              className={cn(
                "px-6 py-3 text-sm font-bold rounded-full transition-all",
                active === i
                  ? "bg-white/10 text-white border-t-2 border-accent"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
