"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lesson = { title: string; duration: string; content: string; quiz?: boolean };
type Module = { id: string; icon: string; title: string; subtitle: string; duration: string; lessons: Lesson[] };

const STORAGE_KEY = "niftypulse_progress";

const modules: Module[] = [
  {
    id: "rsi",
    icon: "📊",
    title: "RSI Explained",
    subtitle: "Momentum basics",
    duration: "5 lessons · 15 min",
    lessons: [
      { title: "What is RSI?", duration: "3 min read", content: "RSI (Relative Strength Index) measures momentum on a 0-100 scale. Values above 70 may indicate overbought conditions, while values below 30 may indicate oversold conditions." },
      { title: "How to read RSI values", duration: "2 min", content: "RSI around 50 is neutral. Rising RSI often confirms upward momentum; falling RSI indicates weakening momentum." },
      { title: "RSI divergence strategy", duration: "5 min", content: "Bullish divergence occurs when price makes lower lows while RSI makes higher lows. Bearish divergence is the opposite." },
      { title: "Common RSI mistakes", duration: "3 min", content: "Avoid trading RSI in isolation. Combine with trend and support/resistance context." },
      { title: "Quiz: RSI Basics", duration: "2 min", content: "", quiz: true },
    ],
  },
  {
    id: "ma",
    icon: "📈",
    title: "Moving Averages",
    subtitle: "Trend foundations",
    duration: "5 lessons · 16 min",
    lessons: [
      { title: "Simple vs Exponential MA", duration: "3 min", content: "SMA smooths equally, EMA gives more weight to recent prices." },
      { title: "Golden Cross strategy", duration: "4 min", content: "A shorter MA crossing above longer MA can suggest trend continuation." },
      { title: "Death Cross warning", duration: "3 min", content: "A shorter MA crossing below longer MA can suggest potential weakness." },
      { title: "MA as support/resistance", duration: "4 min", content: "Price often reacts around popular moving averages in trending markets." },
      { title: "Quiz: Moving Averages", duration: "2 min", content: "", quiz: true },
    ],
  },
  {
    id: "candles",
    icon: "🕯️",
    title: "Candlestick Patterns",
    subtitle: "Price action essentials",
    duration: "5 lessons · 19 min",
    lessons: [
      { title: "Reading a candlestick", duration: "3 min", content: "Open, high, low, close define each candle. Body and wick reveal intraday behavior." },
      { title: "Bullish patterns", duration: "5 min", content: "Hammer and bullish engulfing can indicate reversal potential in context." },
      { title: "Bearish patterns", duration: "5 min", content: "Shooting star and bearish engulfing can indicate downside pressure." },
      { title: "Reversal patterns", duration: "4 min", content: "Always validate with volume, trend, and support/resistance levels." },
      { title: "Quiz: Candlesticks", duration: "2 min", content: "", quiz: true },
    ],
  },
  {
    id: "macd",
    icon: "📉",
    title: "MACD Deep Dive",
    subtitle: "Momentum + trend",
    duration: "5 lessons · 16 min",
    lessons: [
      { title: "What is MACD?", duration: "3 min", content: "MACD compares two EMAs to identify momentum shifts." },
      { title: "Signal line crossover", duration: "4 min", content: "MACD crossing above signal may be bullish; below may be bearish." },
      { title: "MACD histogram", duration: "3 min", content: "Histogram expansion/contraction highlights momentum acceleration/deceleration." },
      { title: "MACD divergence", duration: "4 min", content: "Divergence with price can foreshadow trend weakness." },
      { title: "Quiz: MACD", duration: "2 min", content: "", quiz: true },
    ],
  },
  {
    id: "sr",
    icon: "🎯",
    title: "Support & Resistance",
    subtitle: "Key level mastery",
    duration: "5 lessons · 18 min",
    lessons: [
      { title: "Identifying key levels", duration: "4 min", content: "Repeated turning points often define support/resistance zones." },
      { title: "Breakout vs fakeout", duration: "4 min", content: "Wait for confirmation using candle close and volume." },
      { title: "Role reversal concept", duration: "3 min", content: "Broken resistance can become support, and vice versa." },
      { title: "Trading the levels", duration: "5 min", content: "Use predefined risk and invalidation points when trading levels." },
      { title: "Quiz: S&R Levels", duration: "2 min", content: "", quiz: true },
    ],
  },
  {
    id: "risk",
    icon: "💰",
    title: "Risk Management",
    subtitle: "Protect your capital",
    duration: "5 lessons · 16 min",
    lessons: [
      { title: "The 2% rule", duration: "3 min", content: "Risk only a small fraction of capital per trade to survive variance." },
      { title: "Stop loss strategies", duration: "4 min", content: "Place stops where your trade thesis is invalidated." },
      { title: "Position sizing", duration: "4 min", content: "Size positions by risk amount, not conviction alone." },
      { title: "Risk/reward ratio", duration: "3 min", content: "Target favorable reward relative to risk over a series of trades." },
      { title: "Quiz: Risk Management", duration: "2 min", content: "", quiz: true },
    ],
  },
];

const quiz = [
  {
    q: "Which RSI zone is often considered overbought?",
    options: ["Below 30", "Around 50", "Above 70", "Above 20"],
    answer: 2,
  },
  {
    q: "A golden cross happens when:",
    options: ["Long MA crosses above short MA", "Short MA crosses above long MA", "RSI crosses 50", "MACD turns negative"],
    answer: 1,
  },
  {
    q: "Good risk management usually emphasizes:",
    options: ["Bigger positions after losses", "No stop loss", "Consistent position sizing", "Only winning trades"],
    answer: 2,
  },
];

function readProgress(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, number[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export default function LearnPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, number[]>>(readProgress());
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const moduleProgress = (m: Module) => {
    const completed = progress[m.id] || [];
    return Math.min(100, Math.round((completed.length / m.lessons.length) * 100));
  };

  const markComplete = () => {
    if (!activeModule) return;
    const key = activeModule.id;
    const done = new Set(progress[key] || []);
    done.add(lessonIdx + 1);
    const next = { ...progress, [key]: Array.from(done).sort((a, b) => a - b) };
    setProgress(next);
    saveProgress(next);
    if (lessonIdx === activeModule.lessons.length - 1) setShowQuiz(true);
  };

  const score = useMemo(() => {
    let s = 0;
    for (let i = 0; i < quiz.length; i++) if (answers[i] === quiz[i].answer) s++;
    return s;
  }, [answers]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", paddingBottom: 30 }}>
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0a0a0a", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.push("/")} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700 }}>← Back</button>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Learn</div>
      </nav>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>Trading Academy</h1>
        <p style={{ margin: "0 0 22px", color: "#6b7280" }}>Master technical analysis step by step</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {modules.map((m) => {
            const pct = moduleProgress(m);
            const isNew = pct === 0;
            return (
              <div
                key={m.id}
                onClick={() => {
                  setActiveModule(m);
                  setLessonIdx(0);
                  setShowQuiz(false);
                  setSubmitted(false);
                  setAnswers({});
                }}
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 24,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 48 }}>{m.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>{m.title}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{m.subtitle}</div>
                  </div>
                  {isNew ? (
                    <span style={{ background: "rgba(57,255,20,0.1)", color: "#39FF14", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>New</span>
                  ) : (
                    <div style={{ position: "relative", width: 46, height: 46 }}>
                      <svg width="46" height="46" viewBox="0 0 46 46">
                        <circle cx="23" cy="23" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                        <circle cx="23" cy="23" r="20" stroke="#39FF14" strokeWidth="4" fill="none" strokeDasharray={`${(pct / 100) * 126} 126`} strokeLinecap="round" transform="rotate(-90 23 23)" />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{pct}%</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 18, fontSize: 12, color: "#6b7280" }}>{m.duration}</div>
                <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#39FF14", borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {activeModule && (
        <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 30px" }}>
          <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button onClick={() => setActiveModule(null)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>←</button>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{activeModule.title}</div>
              <div style={{ color: "#e5e7eb", fontWeight: 700 }}>{showQuiz ? "Quiz" : activeModule.lessons[lessonIdx].title}</div>
            </div>
            <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 12 }}>
              Lesson {showQuiz ? activeModule.lessons.length : lessonIdx + 1} of {activeModule.lessons.length}
            </div>

            {!showQuiz ? (
              <>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 24, fontSize: 14, color: "#e5e7eb", lineHeight: 1.8 }}>
                  {activeModule.lessons[lessonIdx].content}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                  <button
                    onClick={() => setLessonIdx((n) => Math.max(0, n - 1))}
                    style={{ background: "transparent", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
                  >
                    Previous
                  </button>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={markComplete}
                      style={{ background: "#39FF14", color: "#000", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => setLessonIdx((n) => Math.min(activeModule.lessons.length - 1, n + 1))}
                      style={{ background: "transparent", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {!submitted ? (
                  <div>
                    {quiz.map((q, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>{q.q}</div>
                        <div style={{ display: "grid", gap: 8 }}>
                          {q.options.map((opt, oi) => {
                            const chosen = answers[i] === oi;
                            return (
                              <button
                                key={oi}
                                onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                                style={{
                                  textAlign: "left",
                                  background: chosen ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                                  border: chosen ? "1px solid rgba(57,255,20,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                  color: "#e5e7eb",
                                  borderRadius: 8,
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setSubmitted(true)} style={{ background: "#39FF14", color: "#000", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 30, fontWeight: 800 }}>You scored {score}/{quiz.length}</div>
                    <div style={{ color: "#39FF14", fontSize: 22, fontWeight: 800, marginTop: 8 }}>{Math.round((score / quiz.length) * 100)}%</div>
                    <div style={{ color: "#6b7280", marginTop: 10 }}>Badge earned: {activeModule.title} Completion</div>
                    <button
                      onClick={() => {
                        const idx = modules.findIndex((m) => m.id === activeModule.id);
                        const next = modules[idx + 1];
                        if (next) {
                          setActiveModule(next);
                          setLessonIdx(0);
                          setShowQuiz(false);
                          setSubmitted(false);
                          setAnswers({});
                        }
                      }}
                      style={{ marginTop: 14, background: "#39FF14", color: "#000", border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Continue to next module →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
