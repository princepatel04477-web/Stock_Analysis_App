"use client";

const BEAMS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  rotation: i * 45,
  delay: i * 0.4,
}));

const DOTS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: (i % 5) * 16,
  y: Math.floor(i / 5) * 16,
}));

export default function JoinUsSection() {
  return (
    <section className="relative bg-[#0a0a0a] py-32 px-6 overflow-hidden flex items-center justify-center min-h-[70vh]">
      {/* Beam lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {BEAMS.map((b) => (
          <div
            key={b.id}
            className="absolute w-px bg-gradient-to-t from-transparent via-accent/20 to-transparent"
            style={{
              height: "80vh",
              transform: `rotate(${b.rotation}deg)`,
              animation: `beam-expand 3s ${b.delay}s ease-out infinite`,
              transformOrigin: "center center",
            }}
          />
        ))}
      </div>

      {/* Corner dot grids */}
      <div className="absolute top-12 left-12 opacity-20">
        <svg width="64" height="48" viewBox="0 0 64 48">
          {DOTS.map((d) => (
            <circle key={d.id} cx={d.x + 4} cy={d.y + 4} r="2" fill="#39FF14" />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-12 right-12 opacity-20">
        <svg width="64" height="48" viewBox="0 0 64 48">
          {DOTS.map((d) => (
            <circle key={d.id} cx={d.x + 4} cy={d.y + 4} r="2" fill="#39FF14" />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        {/* App icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[#0d1a0d] border border-accent/30 flex items-center justify-center animate-pulse-glow">
            <span className="text-accent font-black text-2xl">Fx</span>
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl border border-accent/20 scale-125 opacity-50 animate-pulse" />
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
          Join us today and start making money with{" "}
          <span className="text-accent">Fxology</span>
        </h2>
        <p className="text-white/40 text-base mb-8 max-w-md">
          Take the challenge, prove your skills, and start trading with our capital today.
          No time limit, no excuses.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button className="shimmer-btn text-black font-bold px-8 py-3 rounded-full text-base hover:scale-105 transition-transform">
            Try for free
          </button>
          <button className="border border-white/20 text-white font-medium px-8 py-3 rounded-full text-base hover:border-accent/40 transition-colors">
            I want to join
          </button>
        </div>
      </div>
    </section>
  );
}
