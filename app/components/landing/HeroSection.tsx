"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Instagram, Twitter, ArrowDown } from "lucide-react";

interface Particle {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
  size: string;
}

const MATH_TILES = [
  { text: "(12+12)", style: "top-[22%] left-[8%]", dark: false },
  { text: "-15+6", style: "top-[40%] left-[6%]", dark: false },
  { text: "3y", style: "top-[62%] left-[10%]", dark: false },
  { text: "17+6-4", style: "top-[30%] right-[8%]", dark: false },
  { text: "-8", style: "top-[50%] right-[6%]", dark: false },
  { text: "5x9", style: "bottom-[18%] right-[10%]", dark: false },
  { text: "24", style: "bottom-[12%] left-[18%]", dark: true },
  { text: "12", style: "top-[14%] right-[16%]", dark: true },
];

export default function HeroSection() {
  const [cookieDismissed, setCookieDismissed] = useState(false);

  const particles: Particle[] = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: `${8 + Math.random() * 12}s`,
        delay: `${Math.random() * 10}s`,
        size: `${2 + Math.random() * 3}px`,
      })),
    []
  );

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `particle-drift ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      ))}

      {/* Green radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Math tiles */}
      {MATH_TILES.map((tile) => (
        <div
          key={tile.text}
          className={cn(
            "absolute font-mono text-sm font-bold px-3 py-1.5 rounded-lg animate-float pointer-events-none hidden md:block",
            tile.dark
              ? "bg-[#0a0a0a] border border-white/10 text-white/60"
              : "bg-white/10 backdrop-blur-sm text-white/80 border border-white/10"
          )}
          style={{ animationDelay: `${Math.random() * 3}s` }}
        >
          <span
              className={
                tile.dark
                  ? "text-white/60"
                  : tile.text.startsWith("-")
                  ? "text-red-400"
                  : "text-accent"
              }
            >
              {tile.text}
            </span>
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-sm font-medium">
          Our Capital, Your
          <span className="flex items-center gap-1 bg-accent text-black font-bold px-2 py-0.5 rounded-full text-xs">
            ✦ Success
          </span>
        </div>

        {/* Headlines */}
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-4">
          <span className="block green-glow-text text-accent">No Time Limit Prop Firm</span>
          <span className="block green-glow-text text-accent">Conquer the market</span>
        </h1>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3 my-8 text-sm font-medium text-white/80">
          {[
            { icon: "👤", text: "The Lab™ Native platform" },
            { icon: "✓", text: "Fast progress" },
            { icon: "🕐", text: "No time Limit" },
            { icon: "⚡", text: "Unique programs" },
          ].map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
            >
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button className="shimmer-btn text-black font-bold px-8 py-3 rounded-full text-base flex items-center gap-2 hover:scale-105 transition-transform">
            Start a challenge →
          </button>
          <button className="border border-white/30 text-white font-medium px-8 py-3 rounded-full text-base hover:border-accent/50 transition-colors">
            Free trial
          </button>
        </div>
      </div>

      {/* Bottom left: social */}
      <div className="absolute bottom-8 left-8 hidden md:flex items-center gap-3">
        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Follow Us</span>
        <div className="flex gap-2">
          {[Instagram, Twitter].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-accent/40 transition-colors"
            >
              <Icon size={14} className="text-white/60" />
            </a>
          ))}
          {/* Discord */}
          <a
            href="#"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-accent/40 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-white/60">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom right: scroll */}
      <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-2 text-white/40 text-xs font-medium">
        Scroll to explore
        <ArrowDown size={14} />
      </div>

      {/* Cookie Banner */}
      {!cookieDismissed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl max-w-md w-[calc(100%-2rem)]">
          <span className="text-2xl">🍪</span>
          <p className="text-sm text-white/70 flex-1">
            We use cookies to improve your experience
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCookieDismissed(true)}
              className="text-xs text-white/50 hover:text-white/80 px-3 py-1.5 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => setCookieDismissed(true)}
              className="text-xs bg-accent text-black font-bold px-3 py-1.5 rounded-full hover:bg-accent-2 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
