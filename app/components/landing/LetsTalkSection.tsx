"use client";

const DISCS = [
  { size: 400, x: -10, y: -5, opacity: 0.06, blur: 40, tint: "#39FF14" },
  { size: 320, x: 30, y: 20, opacity: 0.05, blur: 60, tint: "#39FF14" },
  { size: 280, x: -5, y: 35, opacity: 0.07, blur: 30, tint: "#b8f752" },
  { size: 360, x: 50, y: 5, opacity: 0.04, blur: 50, tint: "#39FF14" },
  { size: 240, x: 20, y: 50, opacity: 0.06, blur: 20, tint: "#39FF14" },
  { size: 300, x: 65, y: 30, opacity: 0.05, blur: 45, tint: "#b8f752" },
];

export default function LetsTalkSection() {
  return (
    <section className="relative min-h-screen bg-[#000] flex items-center justify-center overflow-hidden">
      {/* Glass discs */}
      <div className="absolute inset-0">
        {DISCS.map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: d.size,
              height: d.size,
              left: `${d.x}%`,
              top: `${d.y}%`,
              background: `radial-gradient(circle, rgba(${d.tint === "#39FF14" ? "57,255,20" : "184,247,82"},${d.opacity}) 0%, transparent 70%)`,
              backdropFilter: `blur(${d.blur}px)`,
              WebkitBackdropFilter: `blur(${d.blur}px)`,
              border: `1px solid rgba(57,255,20,0.05)`,
              zIndex: i % 2 === 0 ? 3 : 1,
              animation: `float ${8 + i * 1.5}s ${i * 0.5}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <div className="relative z-2 text-center px-6 select-none">
        <h2
          className="font-black text-white leading-none"
          style={{
            fontSize: "clamp(80px, 15vw, 160px)",
            fontWeight: 900,
          }}
        >
          Let&apos;s Talk
        </h2>
      </div>
    </section>
  );
}
