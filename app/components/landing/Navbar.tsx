"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["How It Works", "Programs", "Support", "Careers", "Become a Partner"];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-1 shrink-0">
          <span className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-black font-black text-sm">
            Fx
          </span>
          <span className="font-bold text-white text-xl tracking-tight">ology</span>
        </a>

        {/* Center links - desktop */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/70">
          <a href="#" className="flex items-center gap-1 text-white font-semibold">
            <span className="text-accent text-xs">◆</span> Home
          </a>
          {links.map((l) => (
            <a key={l} href="#" className="hover:text-white transition-colors">
              {l}
            </a>
          ))}
          <a
            href="#"
            className="border border-white/20 rounded-full px-4 py-1.5 hover:border-white/40 transition-colors text-white"
          >
            Login / Register
          </a>
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors">
            EN <ChevronDown size={14} />
          </button>
          <button className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-full px-4 py-2 text-sm font-semibold text-white hover:border-accent/40 transition-colors">
            <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <ArrowUpRight size={12} className="text-black" />
            </span>
            Start a challenge
          </button>
          <button className="border border-white/20 rounded-full px-4 py-2 text-sm font-medium text-white hover:border-accent/40 transition-colors">
            Free trial
          </button>
        </div>

        {/* Hamburger */}
        <button
          className="lg:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/5 px-6 py-4 flex flex-col gap-4 text-sm">
          <a href="#" className="text-accent font-semibold">◆ Home</a>
          {links.map((l) => (
            <a key={l} href="#" className="text-white/70 hover:text-white">
              {l}
            </a>
          ))}
          <a href="#" className="text-white/70 hover:text-white">Login / Register</a>
          <button className="w-full bg-accent text-black font-bold rounded-full py-2 mt-2">
            Start a challenge
          </button>
        </div>
      )}
    </nav>
  );
}
