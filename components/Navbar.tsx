"use client";

import Link from "next/link";
import { Download } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-white"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm">
            ⚡
          </div>
          <span>CueAI</span>
        </Link>

        {/* Navigation Links with Smooth Scrolling */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-emerald-400 transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition">
            How It Works
          </a>
          <a href="#stealth" className="hover:text-emerald-400 transition">
            Stealth & Privacy
          </a>
          <a href="#hotkeys" className="hover:text-emerald-400 transition">
            Hotkeys
          </a>
          <a href="#pricing" className="hover:text-emerald-400 transition">
            Pricing
          </a>
        </div>

        {/* CTA Download Button */}
        <a
          href="/downloads/CueAI-Teleprompter.exe"
          download="CueAI-Teleprompter.exe"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Try CueAI Free</span>
        </a>
      </div>
    </nav>
  );
}
