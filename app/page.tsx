"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  Lock,
  FileText,
  BrainCircuit,
  Bot,
  Users,
  CheckCircle2,
  Star,
  TrendingUp,
  // Instagram,
  // Linkedin,
  HelpCircle,
  Check,
  BookOpen,
  Zap,
  MessageCircle,
} from "lucide-react";

/* ─── tiny helper ─────────────────────────────────────────────── */
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── data ──────────────────────────────────────────────────────── */
const features = [
  {
    icon: <FileText className="w-7 h-7" />,
    bg: "bg-orange-100",
    text: "text-orange-600",
    title: "Smart Summarisation",
    desc: "Upload long lecture notes or PDFs and get concise, easy-to-read summaries that surface every key concept.",
  },
  {
    icon: <BrainCircuit className="w-7 h-7" />,
    bg: "bg-teal-100",
    text: "text-teal-600",
    title: "AI Quiz Generator",
    desc: "Turn any study material into interactive flashcards and practice tests to actively test your knowledge.",
  },
  {
    icon: <Bot className="w-7 h-7" />,
    bg: "bg-violet-100",
    text: "text-violet-600",
    title: "24 / 7 AI Tutor",
    desc: "Stuck on a tough topic? Chat with your AI tutor for step-by-step explanations — day or night.",
  },
  {
    icon: <Users className="w-7 h-7" />,
    bg: "bg-rose-100",
    text: "text-rose-600",
    title: "Groups & Mentors",
    desc: "Join subject-based study groups or book 1-on-1 sessions with verified academic mentors.",
  },
];

const steps = [
  {
    num: "01",
    color: "bg-orange-500",
    ring: "ring-orange-200",
    title: "Upload your materials",
    desc: "Drag and drop lecture slides, PDFs, or handwritten notes into the platform.",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    num: "02",
    color: "bg-teal-500",
    ring: "ring-teal-200",
    title: "Choose your action",
    desc: "Pick a summary, a practice quiz, or a deep concept explanation — your call.",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    num: "03",
    color: "bg-violet-500",
    ring: "ring-violet-200",
    title: "Learn and improve",
    desc: "Review AI content, quiz yourself, and track progress until exam day.",
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

const benefits = [
  "Save hours of study time every week",
  "Understand complex topics faster",
  "Practice effectively before every exam",
  "Learn collaboratively with classmates",
];

/* ─── component ─────────────────────────────────────────────────── */
export default function EduBoostPage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  return (
    <>
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-display font-black text-2xl text-slate-900 tracking-tight">
                Edu<span className="text-orange-500">Boost</span>
                <span className="text-teal-600"> AI</span>
              </span>
            </div>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-8">
              {["Features", "How it Works", "Mentors"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-slate-600 hover:text-orange-500 font-semibold text-sm transition-colors"
                >
                  {l}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <a href="#" className="hidden sm:block text-slate-600 hover:text-slate-900 font-semibold text-sm">
                Log in
              </a>
              <a
                href="#"
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-orange-200"
              >
                Try the App
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-44 overflow-hidden bg-amber-50">
          {/* Decorative circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-200 opacity-30 blur-3xl" />
            <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full bg-teal-200 opacity-25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-violet-200 opacity-20 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* Left */}
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  EduBoost AI 2.5 is now live
                </div>

                <h1 className="font-display font-black text-slate-900 leading-[1.08] mb-6 text-[clamp(2.6rem,5vw,4rem)]">
                  Study smarter<br />
                  <em className="not-italic text-orange-500">with AI</em> that<br />
                  actually gets you.
                </h1>

                <p className="text-slate-600 text-lg leading-relaxed mb-9 font-medium">
                  Upload your notes — our AI turns them into summaries, quizzes, and explanations in seconds.
                  Then connect with peers and mentors to go even further.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="#"
                    className="inline-flex justify-center items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="inline-flex justify-center items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-base transition-all"
                  >
                    <PlayCircle className="w-5 h-5 text-teal-500" />
                    Try Demo
                  </a>
                </div>

                {/* Social proof */}
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-2.5">
                    {[
                      "photo-1534528741775-53994a69daeb",
                      "photo-1506794778202-cad84cf45f1d",
                      "photo-1494790108377-be9c29b29330",
                      "photo-1524504388940-b1c1722653e1",
                    ].map((id) => (
                      <img
                        key={id}
                        className="w-9 h-9 rounded-full border-2 border-amber-50 object-cover"
                        src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=64&h=64`}
                        alt=""
                      />
                    ))}
                  </div>
                  <div>
                    <div className="flex text-amber-400 mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs font-semibold">Loved by 10+ students</p>
                  </div>
                </div>
              </div>

              {/* Right — dashboard mock */}
              <div className="relative">
                <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/80 overflow-hidden">
                  {/* Browser bar */}
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="mx-auto bg-white border border-slate-200 rounded-lg px-5 py-1 text-xs text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> eduboost.ai/dashboard
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-6 bg-amber-50/40">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-display font-bold text-lg text-slate-800">
                        Biology 101: Cell Structure
                      </h3>
                      <span className="bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">
                        AI Summary Ready
                      </span>
                    </div>
                    <div className="space-y-4">
                      {/* Key concepts */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-orange-100 p-2 rounded-xl text-orange-500 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-display font-semibold text-slate-800 text-sm mb-1">
                              Key Concepts Extracted
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Mitochondria is the powerhouse of the cell. The cell membrane is semi-permeable.
                              Ribosomes handle protein synthesis.
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Practice Q */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-teal-100 p-2 rounded-xl text-teal-600 mt-0.5">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div className="w-full">
                            <h4 className="font-display font-semibold text-slate-800 text-sm mb-2">
                              Practice Question
                            </h4>
                            <p className="text-xs text-slate-600 mb-3">
                              Which organelle is primarily responsible for generating ATP?
                            </p>
                            <div className="space-y-2">
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-600 flex items-center gap-2 cursor-pointer hover:border-orange-300 transition-colors">
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> Nucleus
                              </div>
                              <div className="bg-teal-50 border border-teal-300 rounded-xl p-2 text-xs text-teal-700 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                                Mitochondria ✓
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -right-4 -bottom-5 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Study Efficiency</p>
                    <p className="font-display font-black text-slate-900 text-base">+45% Improved</p>
                  </div>
                </div>

                {/* Floating chat bubble */}
                <div className="absolute -left-6 top-16 bg-orange-500 text-white p-3 rounded-2xl rounded-tl-sm shadow-lg flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">AI Tutor is ready!</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-3">Platform Features</p>
              <h2 className="font-display font-black text-slate-900 text-4xl md:text-5xl leading-tight mb-5">
                Everything you need<br />
                <em className="not-italic text-teal-600">to actually excel</em>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                AI-powered tools built for how students actually study — not how teachers think they do.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-3xl p-7 border-2 transition-all duration-300 cursor-default",
                    activeFeature === i
                      ? "border-orange-300 shadow-xl shadow-orange-100 -translate-y-1 bg-amber-50"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 shadow-sm"
                  )}
                  onMouseEnter={() => setActiveFeature(i)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", f.bg, f.text)}>
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-xl mb-3">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-amber-50 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-200 opacity-20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-200 opacity-20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">

              {/* Steps */}
              <div>
                <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-3">Simple process</p>
                <h2 className="font-display font-black text-slate-900 text-4xl md:text-5xl leading-tight mb-5">
                  Three steps to study<br />
                  <em className="not-italic text-orange-500">smarter</em>
                </h2>
                <p className="text-slate-500 text-lg font-medium mb-12 leading-relaxed">
                  Spend less time organising and more time actually learning — it&apos;s that simple.
                </p>

                <div className="space-y-8">
                  {steps.map((s) => (
                    <div key={s.num} className="flex gap-5 group">
                      <div
                        className={cn(
                          "flex-shrink-0 w-14 h-14 rounded-2xl text-white flex items-center justify-center font-display font-black text-xl shadow-lg ring-4",
                          s.color,
                          s.ring
                        )}
                      >
                        {s.num}
                      </div>
                      <div className="pt-1">
                        <h4 className="font-display font-bold text-slate-900 text-xl mb-1.5">{s.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed text-sm">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits card */}
              <div className="bg-white rounded-3xl p-9 shadow-2xl shadow-slate-200 border border-slate-100">
                <h3 className="font-display font-black text-slate-900 text-2xl mb-8">
                  Why students <span className="text-orange-500">love us</span>
                </h3>
                <div className="space-y-5">
                  {benefits.map((b) => (
                    <div key={b} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-amber-50 transition-colors">
                      <div className="bg-teal-100 p-1.5 rounded-full text-teal-600 flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-slate-700 font-semibold">{b}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="mt-9 pt-8 border-t-2 border-dashed border-slate-100">
                  <div className="flex items-start gap-4">
                    <img
                      className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100"
                      alt="Sarah J."
                    />
                    <div>
                      <div className="flex text-amber-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-600 text-sm italic leading-relaxed font-medium">
                        &quot;EduBoost AI cut my study time in half and my grades shot up. The quiz generator
                        before exams is an absolute lifesaver!&quot;
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-2">Abdulbasit. — Jamb Aspirant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MENTORS ─────────────────────────────────────────────── */}
        <section id="mentors" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-violet-600 to-teal-500 rounded-3xl p-10 md:p-14 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/3" />

              <div className="grid lg:grid-cols-2 gap-14 items-center relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-7">
                    <Star className="w-3.5 h-3.5 fill-current" /> Premium Feature
                  </div>
                  <h2 className="font-display font-black text-white text-4xl md:text-5xl leading-tight mb-6">
                    Need a human touch?<br />
                    <em className="not-italic opacity-80">Book an expert.</em>
                  </h2>
                  <p className="text-white/80 text-lg mb-9 font-medium leading-relaxed">
                    Browse our network of verified academic mentors and book 1-on-1 video sessions to tackle
                    your toughest subjects.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2.5 bg-white text-violet-700 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-xl shadow-lg"
                  >
                    Browse Mentors
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Mentor card */}
                <div className="flex justify-center lg:justify-end">
                  <div className="bg-white rounded-3xl p-7 shadow-2xl w-full max-w-sm relative hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-5 right-5 bg-teal-100 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Online
                    </div>
                    <div className="flex flex-col items-center text-center mb-6 mt-2">
                      <img
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-violet-50 mb-4"
                        src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200"
                        alt="Dr. James Wilson"
                      />
                      <h4 className="font-display font-black text-slate-900 text-xl">Dr. James Wilson</h4>
                      <p className="text-violet-600 font-bold text-sm mt-0.5">Advanced Mathematics</p>
                      <div className="flex items-center gap-1 mt-2 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                        <span className="text-slate-500 text-xs ml-1 font-semibold">(124 reviews)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50 p-3 rounded-2xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Experience</p>
                        <p className="font-display font-black text-slate-900">8 Years</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Rate</p>
                        <p className="font-display font-black text-slate-900">$45/hr</p>
                      </div>
                    </div>
                    <button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-bold transition-colors shadow-lg shadow-violet-200">
                      Book a Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-orange-500 opacity-10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-teal-500 opacity-10 rounded-full blur-3xl" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-5">Ready to start?</p>
            <h2 className="font-display font-black text-white text-4xl md:text-6xl leading-tight mb-7">
              Start learning smarter<br />
              <em className="not-italic text-orange-400">today.</em>
            </h2>
            <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">
              Join thousands of students already using EduBoost AI to save time and improve their grades.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="#"
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-orange-900/30 hover:-translate-y-0.5"
              >
                Sign Up for Free
              </a>
              <a
                href="#"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-10 py-4 rounded-2xl font-black text-lg transition-colors"
              >
                Try the App
              </a>
            </div>
            <p className="mt-6 text-slate-500 text-sm font-semibold">No credit card required for the free tier.</p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-white border-t-2 border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-xl text-slate-900">
                Edu<span className="text-orange-500">Boost</span>
                <span className="text-teal-600"> AI</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-slate-500">
              {["About Us", "Features", "Contact", "Privacy Policy", "Terms"].map((l) => (
                <a key={l} href="#" className="hover:text-orange-500 transition-colors">
                  {l}
                </a>
              ))}
            </div>

            <div className="flex gap-4 text-slate-400">
              <a href="#" className="hover:text-orange-500 transition-colors"><Star className="w-5 h-5" /></a>
              <a href="#" className="hover:text-orange-500 transition-colors"><Star className="w-5 h-5" /></a>
              <a href="#" className="hover:text-orange-500 transition-colors"><Star className="w-5 h-5" /></a>
            </div>
          </div>
          <p className="mt-10 text-center text-xs text-slate-400 font-semibold">
            &copy; 2026 EduBoost AI Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}