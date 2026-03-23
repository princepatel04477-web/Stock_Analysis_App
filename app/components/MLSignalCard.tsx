"use client";

interface LimeFeature {
  feature: string;
  weight: number;
}

interface Explanation {
  sentiment_weight: number;
  price_above_sma: boolean;
  volatility: string;
}

interface Prediction {
  signal: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  explanation: Explanation;
  lime_features: LimeFeature[];
  error?: string;
}

interface Props {
  prediction: Prediction;
}

const SIGNAL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  BUY:     { color: "#3FB950", bg: "#3FB95015", border: "#3FB95040" },
  SELL:    { color: "#F85149", bg: "#F8514915", border: "#F8514940" },
  NEUTRAL: { color: "#FFA500", bg: "#FFA50015", border: "#FFA50040" },
};

export type { Prediction };

export default function MLSignalCard({ prediction }: Props) {
  const { signal, confidence, explanation, lime_features } = prediction;
  const style = SIGNAL_STYLE[signal] || SIGNAL_STYLE["NEUTRAL"];
  const pct = Math.round(confidence * 100);

  return (
    <div className="bg-[#1E2130] border border-[#2E3245] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">ML Prediction</h3>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
          style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
        >
          {signal}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#8B949E] mb-1.5">
          <span>Confidence</span>
          <span className="font-mono font-bold" style={{ color: style.color }}>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#161B22]">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: style.color }}
          />
        </div>
      </div>

      {/* LIME feature contributions */}
      {lime_features.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#8B949E] mb-2">Top feature contributions</p>
          <div className="flex flex-wrap gap-2">
            {lime_features.map((f, i) => {
              const positive = f.weight >= 0;
              const chipColor = positive ? "#3FB950" : "#F85149";
              return (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded border font-mono"
                  style={{
                    color: chipColor,
                    borderColor: `${chipColor}40`,
                    background: `${chipColor}10`,
                  }}
                >
                  {f.feature} {positive ? "+" : ""}{f.weight.toFixed(3)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation details */}
      <div className="border-t border-[#30363D] pt-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-[#8B949E]">Sentiment Score</span>
          <span className="font-mono font-bold text-[#C9D1D9]">{explanation.sentiment_weight.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#8B949E]">Price vs SMA(20)</span>
          <span className="font-mono font-bold" style={{ color: explanation.price_above_sma ? "#3FB950" : "#F85149" }}>
            {explanation.price_above_sma ? "Above" : "Below"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#8B949E]">Volatility</span>
          <span className="font-mono font-bold text-[#C9D1D9]">{explanation.volatility}</span>
        </div>
      </div>

      {prediction.error && (
        <p className="text-[#F85149] text-xs mt-3 border-t border-[#30363D] pt-2">
          {prediction.error}
        </p>
      )}
    </div>
  );
}
