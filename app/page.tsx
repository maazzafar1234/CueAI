"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Play,
  Zap,
  Bot,
  EyeOff,
  Lock,
  Download,
  Mic,
  Code2,
  ShieldCheck,
  ScanLine,
  Sparkles,
} from "lucide-react";

const DOWNLOAD_URL =
  "https://github.com/maazzafar1234/CueAI/releases/download/v2.0.0/CueAI.Teleprompter.Setup.2.0.0.exe";

// Explicitly type variants using Framer Motion's `Variants` type
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"voice" | "screen">("screen");

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans overflow-x-hidden scroll-smooth">
      {/* Background Mesh Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/15 to-cyan-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-xl shadow-inner shadow-emerald-500/10"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            CueAI v2.0 Released • Voice & Screen OCR Overlay Engine
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-8 text-white"
          >
            Ace Virtual Interviews with <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Real-Time AI Teleprompts
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            CueAI listens live during video calls and auto-captures on-screen
            code or MCQs to render instant, tailored answers on a transparent
            overlay.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download for Windows (.exe)
            </a>
            <button className="w-full sm:w-auto px-7 py-4 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-medium rounded-xl transition flex items-center justify-center gap-2.5 backdrop-blur-sm">
              <Play className="w-4 h-4 text-emerald-400 fill-current" /> Watch
              1-Min Demo
            </button>
          </motion.div>
        </motion.div>

        {/* INTERACTIVE PREVIEW MOCKUP */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="mt-12 max-w-4xl mx-auto rounded-xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-md"
        >
          {/* Mock Header Controls */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CueAI Teleprompter Overlay</span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab("screen")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === "screen"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                Screen Assist (Alt+S)
              </button>
              <button
                onClick={() => setActiveTab("voice")}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === "voice"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Voice Mode
              </button>
            </div>
          </div>

          {/* Dynamic Content Preview */}
          {activeTab === "screen" ? (
            <div className="space-y-4 text-left font-sans text-sm text-slate-200 animate-fadeIn">
              <div className="text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">
                    📸 Auto Screen Capture (OCR):
                  </span>{" "}
                  "Select the correct output for `console.log(typeof NaN)`."
                </div>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-emerald-400 font-mono">
                  Alt + S
                </kbd>
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Instant AI Answer:</span>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-emerald-300 text-sm">
                    Answer: Option B ("number")
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    <strong>Reasoning:</strong> In JavaScript,{" "}
                    <code className="text-emerald-400">NaN</code> (Not-a-Number)
                    is technically a numeric data type defined by IEEE 754
                    floating-point standard, so{" "}
                    <code className="text-emerald-400">typeof NaN</code> returns{" "}
                    <code className="text-emerald-400 font-bold">"number"</code>
                    .
                  </p>
                </div>
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>💻 Verified Snippet:</span>
                </div>
                <div className="bg-[#020617] border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto text-slate-300">
                  <pre className="m-0 leading-relaxed">
                    <code>
                      <span className="text-emerald-400">console</span>.
                      <span className="text-blue-400">log</span>(
                      <span className="text-purple-400">typeof</span>{" "}
                      <span className="text-yellow-300">NaN</span>);{" "}
                      <span className="text-slate-500">
                        {/* Output: "number" */}
                      </span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left font-sans text-sm text-slate-200 animate-fadeIn">
              <div className="text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                ❓ Interviewer Question: "Explain Object-Oriented Programming
                principles."
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1">
                  🗣️ Interview Answer (What to say):
                </div>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-300">
                  <li>
                    Object-Oriented Programming structures software design
                    around data or objects rather than functions and logic.
                  </li>
                  <li>
                    Four core pillars include{" "}
                    <strong className="text-emerald-400 font-semibold">
                      Encapsulation
                    </strong>
                    ,{" "}
                    <strong className="text-emerald-400 font-semibold">
                      Inheritance
                    </strong>
                    ,{" "}
                    <strong className="text-emerald-400 font-semibold">
                      Polymorphism
                    </strong>
                    , and{" "}
                    <strong className="text-emerald-400 font-semibold">
                      Abstraction
                    </strong>
                    .
                  </li>
                </ul>
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1">
                  ⚙️ How It Works (In simple terms):
                </div>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-300">
                  <li>
                    Classes serve as blueprints while objects represent
                    instantiated runtime memory structures.
                  </li>
                </ul>
              </div>

              <div>
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>💻 Quick Code Example:</span>
                </div>
                <div className="bg-[#020617] border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto text-slate-300">
                  <pre className="m-0 leading-relaxed">
                    <code>
                      <span className="text-purple-400">class</span>{" "}
                      <span className="text-yellow-300">Car</span> {"{"}
                      {"\n"}{" "}
                      <span className="text-purple-400">constructor</span>
                      (brand) {"{"}
                      {"\n"} <span className="text-cyan-400">this</span>.brand =
                      brand;{"\n"} {"}"}
                      {"\n"} <span className="text-blue-400">startEngine</span>
                      () {"{"}
                      {"\n"} <span className="text-emerald-400">console</span>
                      .log(
                      <span className="text-emerald-300">{`\`\${this.brand} engine running\``}</span>
                      );{"\n"} {"}"}
                      {"\n"}
                      {"}"}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* SECTION 1: FEATURES */}
      <section
        id="features"
        className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/40"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Designed for peak performance
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Sub-second response streaming, OCR auto-capture, and global
              hotkeys give you full control.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <ScanLine className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                Auto Screen OCR (Alt+S)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Silently captures screen regions to solve MCQs, code challenges,
                or theoretical questions instantly.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <EyeOff className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                100% Screen-Share Invisible
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hardware-level OS display protection hides overlay pixels from
                Zoom, Teams, and Meet screen shares.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                Sub-300ms Responses
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Groq Whisper Large-v3 transcribes speech in real time with LPU
                inference streaming responses fast.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">
                CV & Context Injector
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your resume or job description. CueAI customizes every
                answer to mirror your experience.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/80"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              3 simple steps from launch to live teleprompt assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl">
              <div className="text-emerald-400 font-mono text-xl font-bold mb-3">
                01
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Launch Desktop Overlay
              </h3>
              <p className="text-slate-400 text-sm">
                Run the lightweight standalone executable. The transparent
                overlay pins safely above your interview call window.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl">
              <div className="text-emerald-400 font-mono text-xl font-bold mb-3">
                02
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Speak or Capture Screen
              </h3>
              <p className="text-slate-400 text-sm">
                Whisper STT listens to live incoming audio, or press{" "}
                <code className="text-emerald-400">Alt + S</code> to silently
                capture MCQs/code directly off screen.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-xl">
              <div className="text-emerald-400 font-mono text-xl font-bold mb-3">
                03
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Read Live Cues
              </h3>
              <p className="text-slate-400 text-sm">
                Structured spoken points, theoretical inner workings, and code
                solutions stream directly onto your transparent screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: STEALTH & PRIVACY */}
      <section
        id="stealth"
        className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/40"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Stealth & Privacy
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Built from the ground up for maximum privacy and zero detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">
                  Screen Capture Exclusion
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Utilizes native OS window display affinity (
                  <code className="text-emerald-400">setContentProtection</code>
                  ) to prevent recording software and screen shares from
                  rendering the teleprompter window.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
              <Lock className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">
                  Local Session Privacy
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  All transcriptions and generated Q&A logs stay on your
                  computer (
                  <code className="text-emerald-400">
                    interview-session-log.md
                  </code>
                  ). No personal data is stored on remote servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOTKEYS */}
      <section
        id="hotkeys"
        className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/60"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Zero-Mouse Hotkey Controls
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Manage speech capture, screen OCR, window stealth, and stream
              execution using global keyboard shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-[10px] font-mono text-emerald-400 mb-2 flex items-center justify-between">
                <span>SCREEN ASSIST</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                Auto Capture & Solve
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Silently captures screen & solves MCQs/code.
              </p>
              <kbd className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-semibold">
                Alt + S
              </kbd>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-[10px] font-mono text-emerald-400 mb-2 flex items-center justify-between">
                <span>STT CONTROL</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                Toggle Voice Capture
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Turns Whisper voice listening ON or OFF.
              </p>
              <kbd className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-semibold">
                f9
              </kbd>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-[10px] font-mono text-cyan-400 mb-2 flex items-center justify-between">
                <span>STEALTH MODE</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                Hide / Show Overlay
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Toggles teleprompter window visibility.
              </p>
              <kbd className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs font-semibold">
                Ctrl + Shift + H
              </kbd>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-[10px] font-mono text-rose-400 mb-2 flex items-center justify-between">
                <span>STOP STREAM</span>
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                Abort Stream
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Terminates ongoing AI answer generation.
              </p>
              <kbd className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-rose-400 font-mono text-xs font-semibold">
                Ctrl + Alt + S / Esc
              </kbd>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-[10px] font-mono text-indigo-400 mb-2 flex items-center justify-between">
                <span>SCREEN CLEAR</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1">
                Clear Screen
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                Wipes content from teleprompter.
              </p>
              <kbd className="inline-block px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 font-mono text-xs font-semibold">
                Ctrl + Shift + X
              </kbd>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PRICING */}
      <section
        id="pricing"
        className="py-24 relative z-10 border-t border-slate-900 bg-slate-950/80"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Transparent Pricing
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Open source core teleprompter available for standalone deployment.
            </p>
          </div>

          <div className="max-w-md mx-auto p-8 rounded-2xl bg-slate-900/60 border border-emerald-500/40 text-center shadow-2xl">
            <div className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-2">
              Standalone Edition
            </div>
            <div className="text-4xl font-extrabold text-white mb-4">
              $0{" "}
              <span className="text-sm font-normal text-slate-400">/ Free</span>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Full desktop application access with Voice STT, Auto Screen OCR,
              local session logging, and stealth overlay support.
            </p>
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
            >
              Download Standalone .exe
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
