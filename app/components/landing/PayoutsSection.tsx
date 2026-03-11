"use client";

const TEXT_ROW = "Payouts ";
const TEXT_ROW2 = "certificates ";

function buildRow(text: string, count = 8) {
  return Array.from({ length: count }, (_, i) => text).join("");
}

export default function PayoutsSection() {
  const row1 = buildRow(TEXT_ROW, 10);
  const row2 = buildRow(TEXT_ROW2, 8);

  return (
    <section className="relative bg-[#0a0a0a] py-0 overflow-hidden" style={{ minHeight: "60vh" }}>
      {/* Marquee rows */}
      <div className="relative py-16 overflow-hidden">
        {/* Row 1 */}
        <div className="relative mb-4 overflow-hidden">
          <div
            className="flex whitespace-nowrap text-[100px] md:text-[140px] font-black text-white/5 leading-none animate-ticker"
            style={{ willChange: "transform" }}
          >
            <span>{row1}{row1}</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="relative overflow-hidden">
          <div
            className="flex whitespace-nowrap text-[100px] md:text-[140px] font-black text-white/5 leading-none animate-ticker-reverse"
            style={{ willChange: "transform" }}
          >
            <span>{row2}{row2}</span>
          </div>
        </div>

        {/* Certificate Card — absolute center */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ pointerEvents: "none" }}
        >
          <div
            className="pointer-events-auto bg-[#0d1a0d] border border-accent/30 rounded-2xl p-8 w-[340px] md:w-[400px] shadow-[0_0_60px_rgba(57,255,20,0.15)]"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-accent text-xs font-bold tracking-widest uppercase mb-1">
                ✦ Official Document
              </div>
              <div className="text-white font-black text-xl">CERTIFICATE FOR WITHDRAWAL</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Recipient</span>
                <span className="text-white font-bold">Alex Johnson</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Amount</span>
                <span className="text-accent font-black text-lg">$5,400.00</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Date</span>
                <span className="text-white">2023-06-06</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Authorization</span>
                <span className="text-accent font-bold">✓ Approved</span>
              </div>
            </div>

            {/* Stamp */}
            <div className="mt-6 flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-accent/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center text-accent text-xs font-black text-center leading-tight">
                  FX<br />AUTH
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
