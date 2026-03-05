"use client";
import { Analysis } from "@/lib/api";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface Props {
  analysis: Analysis;
}

const SIGNAL_CONFIG: Record<string, { value: number; color: string }> = {
  "STRONG BUY":  { value: 90, color: "#3FB950" },
  "BUY":         { value: 70, color: "#56D364" },
  "HOLD":        { value: 50, color: "#FFA500" },
  "SELL":        { value: 30, color: "#F85149" },
  "STRONG SELL": { value: 10, color: "#DA3633" },
};

export default function SignalGauge({ analysis }: Props) {
  const { signal, target_price, summary, reasoning } = analysis;
  const config = SIGNAL_CONFIG[signal?.toUpperCase()] || SIGNAL_CONFIG["HOLD"];

  const data = [{ value: config.value, fill: config.color }];

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-2">🎯 AI Signal</h3>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="80%"
              innerRadius="60%" outerRadius="100%"
              startAngle={180} endAngle={0}
              data={data}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#161B22" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal label */}
        <div className="text-center -mt-10">
          <div className="text-3xl font-bold" style={{ color: config.color }}>
            {signal}
          </div>
          {target_price > 0 && (
            <div className="text-[#8B949E] text-sm mt-1">
              Target: <span className="text-white font-semibold">₹{target_price.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-[#C9D1D9] text-sm mt-4 leading-relaxed border-t border-[#30363D] pt-3">
          {summary}
        </p>
      )}

      {/* Reasoning */}
      {reasoning?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {reasoning.map((r, i) => (
            <li key={i} className="text-[#8B949E] text-xs flex gap-2">
              <span style={{ color: config.color }}>▸</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
