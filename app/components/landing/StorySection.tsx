"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function StorySection() {
  const svgRef = useRef<SVGPathElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDrawn(true);
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div className="inline-block border border-white/10 rounded-full px-4 py-1 text-white/40 text-xs font-medium mb-6 tracking-widest uppercase">
            [ Fxology Story ]
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
            Our clients become consistently profitable in a{" "}
            <span className="text-accent">relatively short</span> period of time.
          </h2>
          <div className="space-y-4 text-white/50 text-sm leading-relaxed">
            <p>
              We started with a simple belief: talented traders shouldn&apos;t be held back by lack of capital.
              The traditional path to trading success was gated behind personal risk and financial barriers
              that most people simply couldn&apos;t overcome.
            </p>
            <p>
              Fxology was built to change that. By providing structured evaluation programs with real capital
              backing, we&apos;ve enabled thousands of traders across 150+ countries to prove their skills and
              earn a sustainable income from the markets.
            </p>
            <p>
              Our proprietary trading platform, The Lab™, gives traders every tool they need — from advanced
              charting to real-time risk analytics — all designed to help you succeed.
            </p>
          </div>
          <p className="mt-6 text-white font-bold text-sm">
            Today, <span className="text-accent">Fxology</span> stands as a global leader in prop trading,
            with over $400K paid out to our community of elite traders.
          </p>
        </div>

        {/* Right: Isometric timeline */}
        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 400 260"
            className="w-full max-w-md"
            style={{ filter: "drop-shadow(0 0 20px rgba(57,255,20,0.1))" }}
          >
            {/* Grid */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`hg${i}`}
                x1="40"
                y1={40 + i * 44}
                x2="380"
                y2={40 + i * 44}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            ))}

            {/* Step chart */}
            <path
              ref={svgRef}
              d="M60 220 L60 180 L130 180 L130 150 L200 150 L200 110 L270 110 L270 70 L360 70"
              fill="none"
              stroke="#39FF14"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1000"
              strokeDashoffset={drawn ? 0 : 1000}
              style={{
                transition: drawn ? "stroke-dashoffset 2s ease-out" : "none",
                filter: "drop-shadow(0 0 4px #39FF14)",
              }}
            />

            {/* Area fill */}
            <path
              d="M60 220 L60 180 L130 180 L130 150 L200 150 L200 110 L270 110 L270 70 L360 70 L360 220Z"
              fill="url(#storyGrad)"
              opacity={drawn ? 0.15 : 0}
              style={{ transition: "opacity 1s 1s ease-out" }}
            />

            <defs>
              <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39FF14" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Milestone dots */}
            {[
              { cx: 60, cy: 180 },
              { cx: 130, cy: 150 },
              { cx: 200, cy: 110 },
              { cx: 270, cy: 70 },
            ].map(({ cx, cy }, i) => (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="12"
                  fill="none"
                  stroke="#39FF14"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#39FF14"
                  style={{ filter: "drop-shadow(0 0 4px #39FF14)" }}
                />
              </g>
            ))}

            {/* X-axis labels */}
            {["2009", "2011", "2015", new Date().getFullYear().toString()].map((label, i) => (
              <text
                key={label}
                x={60 + i * 70}
                y={245}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
