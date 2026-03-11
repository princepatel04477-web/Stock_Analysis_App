"use client";

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="text-[#5865F2]">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

export default function DiscordSection() {
  return (
    <section className="bg-[#0a0a0a] py-16 px-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-6">
        <DiscordIcon />
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Join Our Discord
        </h2>
        <p className="text-white/40 text-sm max-w-sm">
          Connect with thousands of traders, get daily insights, market analysis, and real-time support
          from the Fxology community.
        </p>
        <button className="border border-white/20 text-white font-medium px-8 py-3 rounded-full text-sm hover:border-[#5865F2]/60 hover:text-[#5865F2] transition-colors">
          Join our discord
        </button>
        <div className="w-full h-px bg-white/5 mt-4" />
      </div>
    </section>
  );
}
