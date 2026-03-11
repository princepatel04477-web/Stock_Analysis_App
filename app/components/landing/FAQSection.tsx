"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What does overall drawdown mean?",
    a: "Overall drawdown refers to the maximum loss allowed from your highest account balance. If your account reaches this threshold, the challenge ends.",
  },
  {
    q: "What is a Free Trial Account?",
    a: "A Free Trial Account lets you experience our platform with virtual capital, no payment required. You can test our tools and environment before committing.",
  },
  {
    q: "I have completed a training program, what now?",
    a: "Congratulations! Our team will review your results within 24 hours. If successful, you'll receive a funded account contract and payout instructions.",
  },
  {
    q: "What does a real trade mean?",
    a: "A real trade is any market order or pending order that is executed and closed at market price. Scalping, intraday, and swing trades all qualify as real trades in our programs.",
  },
  {
    q: "Can I hold trades during the weekend?",
    a: "Yes! Unlike many other prop firms, Fxology allows holding trades over the weekend. We believe in giving traders maximum flexibility.",
  },
  {
    q: "What is no time limit prop firm?",
    a: "A no time limit prop firm means you can complete the evaluation challenge at your own pace — there's no deadline pressure forcing you into bad trades.",
  },
  {
    q: "Where can I download the trading platform?",
    a: "The Lab™ is available for download on Windows, macOS, iOS, and Android. Visit our downloads page after registration.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number>(3);

  return (
    <section className="bg-[#0a0a0a] py-24 px-6 relative">
      {/* Left decoration */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="flex gap-2">
            {Array.from({ length: 4 }).map((_, col) => (
              <div
                key={col}
                className="w-3 h-3 rounded-sm bg-accent/10 border border-accent/20"
              />
            ))}
          </div>
        ))}
        <div className="mt-4 w-24 h-px bg-accent/30" />
      </div>

      <div className="max-w-[580px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-white/40 text-sm">
            Everything you need to know about Fxology
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  "bg-[#111] rounded-xl border transition-all duration-200 overflow-hidden",
                  isOpen ? "border-accent/30" : "border-white/8"
                )}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className={cn("font-semibold text-sm", isOpen ? "text-white" : "text-white/70")}>
                    {faq.q}
                  </span>
                  <span
                    className={cn(
                      "ml-4 shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                      isOpen ? "border-accent text-accent" : "border-white/20 text-white/40"
                    )}
                  >
                    {isOpen ? <Minus size={12} /> : <Plus size={12} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-white/50 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-8">
          <button className="border border-white/20 text-white/60 font-medium px-6 py-2.5 rounded-full text-sm hover:border-accent/40 hover:text-white transition-all">
            View more questions ›
          </button>
        </div>
      </div>
    </section>
  );
}
