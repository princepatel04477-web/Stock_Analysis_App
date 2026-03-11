"use client";
import { useEffect, useRef, useState } from "react";

const PNL_FLOATS = [
  { value: "-59.8", positive: false, style: "top-[20%] left-[15%]" },
  { value: "+72.6", positive: true, style: "top-[30%] right-[18%]" },
  { value: "+18.7", positive: true, style: "bottom-[35%] left-[20%]" },
  { value: "-14.2", positive: false, style: "bottom-[25%] right-[22%]" },
];

const SCROLL_TEXTS = ["Who we are?", "And how it all started?"];

export default function CinematicSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTextIdx(1);
        else setTextIdx(0);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen bg-[#000] flex items-center justify-center overflow-hidden"
    >
      {/* 3D chart lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 800 500"
          className="w-full max-w-3xl opacity-40"
          style={{ filter: "drop-shadow(0 0 20px #39FF14)" }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={100 * i + 50}
              x2="800"
              y2={100 * i + 50}
              stroke="#39FF14"
              strokeWidth="0.5"
              strokeOpacity="0.15"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line
              key={`v${i}`}
              x1={100 * i + 50}
              y1="0"
              x2={100 * i + 50}
              y2="500"
              stroke="#39FF14"
              strokeWidth="0.5"
              strokeOpacity="0.15"
            />
          ))}

          {/* Main neon chart line */}
          <path
            d="M50 380 L120 340 L200 310 L250 320 L320 260 L400 220 L450 240 L520 180 L600 150 L680 120 L750 90"
            fill="none"
            stroke="#39FF14"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px #39FF14)" }}
          />

          {/* Area fill */}
          <path
            d="M50 380 L120 340 L200 310 L250 320 L320 260 L400 220 L450 240 L520 180 L600 150 L680 120 L750 90 L750 500 L50 500Z"
            fill="url(#chartAreaGrad)"
            opacity="0.15"
          />

          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39FF14" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Neon dots on chart */}
          {[
            [120, 340], [250, 320], [400, 220], [520, 180], [680, 120],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="5"
              fill="#39FF14"
              style={{ filter: "drop-shadow(0 0 6px #39FF14)" }}
            />
          ))}
        </svg>
      </div>

      {/* Floating P&L numbers */}
      {PNL_FLOATS.map((f) => (
        <div
          key={f.value}
          className={`absolute font-mono font-bold text-xl md:text-2xl ${f.style} ${
            f.positive ? "text-white/20" : "text-white/20"
          } animate-float pointer-events-none`}
        >
          {f.value}
        </div>
      ))}

      {/* Center text */}
      <div className="relative z-10 text-center px-6">
        <h2 className="text-5xl md:text-7xl font-black text-white transition-all duration-700">
          {SCROLL_TEXTS[textIdx]}
        </h2>
      </div>
    </section>
  );
}
