"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatItem {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: 400, prefix: "$", suffix: "K+", label: "Total Payouts" },
  { value: 15, suffix: "K+", label: "Active Traders" },
  { value: 150, suffix: "+", label: "Countries" },
  { value: 16, suffix: "h", label: "Avg Support Response" },
];

function useCountUp(target: number, active: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

function StatCell({ stat, active }: { stat: StatItem; active: boolean }) {
  const count = useCountUp(stat.value, active);
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="text-5xl md:text-6xl font-black mb-3">
        {stat.prefix && <span className="text-white">{stat.prefix}</span>}
        <span className="text-white">{count}</span>
        <span className="text-accent">{stat.suffix}</span>
      </div>
      <div className="text-white/50 text-sm font-medium tracking-wide uppercase">
        {stat.label}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#0a0a0a] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Trading Statistics
          </h2>
          <p className="text-white/40 text-base">
            Real numbers from our trading community
          </p>
        </div>

        <div ref={ref} className="relative grid grid-cols-2 gap-0">
          {/* Divider lines */}
          <div
            className={cn(
              "absolute left-1/2 top-0 bottom-0 w-px bg-accent/30 origin-top transition-transform duration-1000",
              active ? "scale-y-100" : "scale-y-0"
            )}
          />
          <div
            className={cn(
              "absolute top-1/2 left-0 right-0 h-px bg-accent/30 origin-left transition-transform duration-1000",
              active ? "scale-x-100" : "scale-x-0"
            )}
          />

          {STATS.map((stat, i) => (
            <div key={stat.label} className="border border-transparent">
              <StatCell stat={stat} active={active} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
