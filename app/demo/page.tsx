"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Lock,
  Zap,
  Users,
  TrendingUp,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Mode = "summary" | "questions" | "explain";
type GradeResult = "correct" | "partial" | "incorrect" | null;

interface Question {
  question: string;
  answer: string;
}

interface QuestionState {
  userAnswer: string;
  grade: GradeResult;
  feedback: string;
  loading: boolean;
  submitted: boolean;
}

// ── Sample note ───────────────────────────────────────────────────────────────
const SAMPLE_NOTE = `The mitochondria is the powerhouse of the cell. It produces ATP through a process called cellular respiration. This involves three main stages: glycolysis (in the cytoplasm), the Krebs cycle (in the mitochondrial matrix), and the electron transport chain (on the inner mitochondrial membrane). Oxygen is required for aerobic respiration, producing 36–38 ATP molecules per glucose molecule.

Mitochondria have a double-membrane structure: an outer membrane and a highly folded inner membrane called cristae, which increases the surface area for ATP production. They also contain their own DNA and ribosomes, supporting the endosymbiotic theory that they evolved from ancient bacteria.

Key functions beyond energy production include: calcium signalling, heat production, and apoptosis (programmed cell death). Without mitochondria, complex life as we know it would not be possible.`;

// ── Mode config ────────────────────────────────────────────────────────────────
const MODES: {
  key: Mode;
  icon: React.ReactNode;
  label: string;
  shortDesc: string;
  longDesc: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    key: "summary",
    icon: <BookOpen className="w-5 h-5" />,
    label: "Summarise Notes",
    shortDesc: "Key points, fast",
    longDesc: "AI reads your notes and pulls out the most important ideas in a clear bullet-point summary. Perfect for quick review before an exam.",
    activeBorder: "border-orange-400",
    activeBg: "bg-orange-50",
    activeText: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  {
    key: "questions",
    icon: <HelpCircle className="w-5 h-5" />,
    label: "Practice Questions",
    shortDesc: "Test your knowledge",
    longDesc: "AI generates 3 practice questions from your notes. Type your answers and get instant grading with detailed feedback — like a personal tutor.",
    activeBorder: "border-teal-400",
    activeBg: "bg-teal-50",
    activeText: "text-teal-700",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
  },
  {
    key: "explain",
    icon: <Lightbulb className="w-5 h-5" />,
    label: "Explain Simply",
    shortDesc: "Plain-language breakdown",
    longDesc: "AI rewrites complex notes in simple, everyday language using analogies and examples — ideal when you're confused and need a fresh perspective.",
    activeBorder: "border-violet-400",
    activeBg: "bg-violet-50",
    activeText: "text-violet-700",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseQuestions(text: string): Question[] {
  const parts = text.split(/---ANSWERS---|---answers---/);
  const qPart = parts[0] || "";
  const aPart = parts[1] || "";
  const qLines = qPart.split("\n").filter((l) => /^Q\d+[:.]/i.test(l.trim()));
  const aLines = aPart.split("\n").filter((l) => /^A\d+[:.]/i.test(l.trim()));
  return qLines.map((q, i) => ({
    question: q.replace(/^Q\d+[:.]\s*/i, "").trim(),
    answer: (aLines[i] || "").replace(/^A\d+[:.]\s*/i, "").trim(),
  }));
}

// ── CHANGED: now hits /api/gemini instead of /api/claude ─────────────────────
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function SummaryResult({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => {
        const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
        const clean = line.replace(/^[•\-*]\s*/, "");
        return isBullet ? (
          <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-black">✓</span>
            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          </div>
        ) : (
          <p key={i} className="text-sm text-slate-700 leading-relaxed font-semibold" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
        );
      })}
    </div>
  );
}

function ExplainResult({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split("\n").map((l) => l.trim()).filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
      ))}
    </div>
  );
}

function QuestionCard({
  q, index, state, onChange, onSubmit,
}: {
  q: Question; index: number; state: QuestionState;
  onChange: (v: string) => void; onSubmit: () => void;
}) {
  const gradeConfig = {
    correct: { border: "border-teal-300 bg-teal-50/40", icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />, label: "Correct!", labelColor: "text-teal-700" },
    partial: { border: "border-amber-300 bg-amber-50/40", icon: <MinusCircle className="w-4 h-4 text-amber-600" />, label: "Partially Correct", labelColor: "text-amber-700" },
    incorrect: { border: "border-red-300 bg-red-50/40", icon: <AlertCircle className="w-4 h-4 text-red-500" />, label: "Needs Improvement", labelColor: "text-red-600" },
  };

  return (
    <div className={`border-2 rounded-2xl p-5 transition-all duration-300 bg-white ${state.submitted && state.grade === "correct" ? "border-teal-200" : "border-slate-200"}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white text-sm font-black shrink-0">
          {index + 1}
        </div>
        <p className="text-slate-800 font-bold text-sm leading-relaxed pt-1">{q.question}</p>
      </div>

      {(!state.submitted || state.grade !== "correct") && (
        <>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Answer</label>
          <textarea
            value={state.userAnswer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here — be as detailed as you like…"
            rows={3}
            disabled={state.loading}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all bg-slate-50 hover:bg-white font-body"
          />
          <button
            onClick={onSubmit}
            disabled={state.loading || !state.userAnswer.trim()}
            className="mt-3 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-md shadow-teal-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
          >
            {state.loading ? <><Spinner /> Grading…</> : <>Check my answer <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </>
      )}

      {state.submitted && state.grade && state.feedback && (
        <div className={`mt-3 border-2 rounded-xl px-4 py-3 ${gradeConfig[state.grade].border}`}>
          <div className="flex items-center gap-2 mb-1">
            {gradeConfig[state.grade].icon}
            <p className={`font-black text-sm ${gradeConfig[state.grade].labelColor}`}>{gradeConfig[state.grade].label}</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{state.feedback}</p>
          {state.grade !== "correct" && (
            <button onClick={() => onChange("")} className="mt-2 text-xs font-black text-slate-400 hover:text-orange-500 transition-colors underline underline-offset-2">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sign-up nudge banner ───────────────────────────────────────────────────────
function SignupNudge({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <button onClick={onDismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-md shadow-orange-200">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <p className="font-display font-black text-slate-900 text-sm mb-0.5">
            You&apos;re using the free demo
          </p>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Sign up free to unlock groups, mentor sessions, progress tracking, and unlimited AI requests.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              href="/Register"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5"
            >
              Sign up free <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/Login"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-4 py-2 rounded-xl text-xs font-black transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Locked features teaser ────────────────────────────────────────────────────
function LockedFeatures() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Unlock with a free account</p>
      </div>
      <div className="space-y-3">
        {[
          { icon: <Users className="w-4 h-4" />, color: "bg-orange-100 text-orange-600", title: "Study Groups", desc: "Join peers studying the same subjects" },
          { icon: <TrendingUp className="w-4 h-4" />, color: "bg-teal-100 text-teal-600", title: "Progress Tracking", desc: "See how you improve over time" },
          { icon: <Sparkles className="w-4 h-4" />, color: "bg-violet-100 text-violet-600", title: "Mentor Sessions", desc: "Book 1-on-1 sessions with expert tutors" },
        ].map((f) => (
          <div key={f.title} className="flex items-center gap-3 opacity-60">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
              {f.icon}
            </div>
            <div>
              <p className="text-slate-700 text-sm font-bold">{f.title}</p>
              <p className="text-slate-400 text-xs font-medium">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/register"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-sm font-black transition-all"
      >
        Create free account <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [notes, setNotes] = useState("");
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const [summaryText, setSummaryText] = useState("");
  const [explainText, setExplainText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qStates, setQStates] = useState<QuestionState[]>([]);

  const resultRef = useRef<HTMLDivElement>(null);
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;
  const hasResult = summaryText || explainText || questions.length > 0;

  const clearAll = () => {
    setNotes(""); setSummaryText(""); setExplainText("");
    setQuestions([]); setQStates([]); setActiveMode(null); setError("");
  };

  const scrollToResult = () =>
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

  const generate = async (mode: Mode) => {
    if (!notes.trim()) { setError("Please paste some notes first — or click 'Try sample note'!"); return; }
    if (notes.trim().length < 50) { setError("Notes too short. Paste at least a paragraph for best results."); return; }
    setError(""); setLoading(true); setActiveMode(mode);
    setSummaryText(""); setExplainText(""); setQuestions([]); setQStates([]);
    scrollToResult();

    const prompts: Record<Mode, string> = {
      summary: `You are a helpful study assistant. Read the following notes and produce a clear, concise summary.\n\nFormat:\n- One-sentence overview at the top\n- 5-8 bullet points (use • symbol) covering key concepts\n- Bold (**like this**) the most important terms\n\nNotes:\n\n${notes}`,
      questions: `You are a study assistant. Generate exactly 3 practice questions from the notes below.\n\nFormat EXACTLY like this:\nQ1: [question]\nQ2: [question]\nQ3: [question]\n\n---ANSWERS---\nA1: [detailed answer, 2-3 sentences]\nA2: [detailed answer, 2-3 sentences]\nA3: [detailed answer, 2-3 sentences]\n\nNotes:\n\n${notes}`,
      explain: `You are a friendly study assistant. Explain the following notes in simple, plain language as if talking to a curious 15-year-old.\n\n- Use everyday analogies and real-world examples\n- Short paragraphs (3-5 sentences each)\n- Avoid jargon — define any technical terms\n- Keep it engaging\n\nNotes:\n\n${notes}`,
    };

    try {
      // ── CHANGED: callGemini instead of callClaude ──
      const text = await callGemini(prompts[mode]);
      if (mode === "summary") setSummaryText(text);
      else if (mode === "explain") setExplainText(text);
      else {
        const parsed = parseQuestions(text);
        setQuestions(parsed);
        setQStates(parsed.map(() => ({ userAnswer: "", grade: null, feedback: "", loading: false, submitted: false })));
      }
    } catch {
      setError("Something went wrong connecting to the AI. Please try again.");
      setActiveMode(null);
    } finally {
      setLoading(false);
    }
  };

  const gradeAnswer = async (idx: number) => {
    const q = questions[idx];
    if (!qStates[idx].userAnswer.trim()) return;
    setQStates((prev) => prev.map((s, i) => i === idx ? { ...s, loading: true } : s));

    try {
      const prompt = `Grade this student answer. Be encouraging and educational.\n\nQuestion: ${q.question}\nExpected answer: ${q.answer}\nStudent's answer: ${qStates[idx].userAnswer}\n\nRespond EXACTLY:\nVERDICT: [CORRECT / PARTIAL / INCORRECT]\nFEEDBACK: [2-3 sentences of specific, constructive feedback]`;
      // ── CHANGED: callGemini instead of callClaude ──
      const text = await callGemini(prompt);
      const verdictMatch = text.match(/VERDICT:\s*(CORRECT|PARTIAL|INCORRECT)/i);
      const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)/i);
      const grade = (verdictMatch?.[1].toLowerCase() ?? (text.toUpperCase().includes("CORRECT") ? "correct" : text.toUpperCase().includes("PARTIAL") ? "partial" : "incorrect")) as GradeResult;
      const feedback = feedbackMatch?.[1].trim() ?? text.replace(/VERDICT:.*\n?/i, "").replace(/FEEDBACK:/i, "").trim();
      setQStates((prev) => prev.map((s, i) => i === idx ? { ...s, grade, feedback, loading: false, submitted: true } : s));
    } catch {
      setQStates((prev) => prev.map((s, i) => i === idx ? { ...s, loading: false, feedback: "Could not grade. Please try again." } : s));
    }
  };

  const updateQAnswer = (idx: number, val: string) => {
    setQStates((prev) => prev.map((s, i) => i === idx ? { ...s, userAnswer: val, submitted: false, grade: null, feedback: "" } : s));
  };

  return (
    <div className="min-h-screen bg-amber-50 font-body antialiased">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-lg text-slate-900 tracking-tight">
                Edu<span className="text-orange-500">Boost</span>
                <span className="text-teal-600"> AI</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-orange-700 text-xs font-black uppercase tracking-widest">Free Demo</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/Login"
                className="hidden sm:inline-flex items-center gap-1.5 text-slate-600 hover:text-orange-500 text-sm font-black transition-colors border-2 border-slate-200 hover:border-orange-300 px-4 py-2 rounded-xl bg-white"
              >
                Log in
              </Link>
              <Link
                href="/Register"
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black px-4 py-2 rounded-xl shadow-md shadow-orange-200 transition-all hover:-translate-y-0.5"
              >
                Sign up free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">

        {/* ── Page Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-100 border border-teal-200 rounded-full px-4 py-1.5 text-teal-700 text-xs font-black uppercase tracking-widest mb-4">
            <Zap className="w-3.5 h-3.5" />
            No sign-up needed · Try it now
          </div>
          <h1 className="font-display font-black text-slate-900 text-3xl sm:text-4xl leading-tight mb-3">
            Your AI Study Session —{" "}
            <em className="not-italic text-orange-500">completely free</em>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium">
            Paste your notes below, pick what you need, and let AI do the heavy lifting. No account required.
          </p>
        </div>

        {/* ── Sign-up nudge ── */}
        {!nudgeDismissed && (
          <div className="mb-6 max-w-2xl mx-auto">
            <SignupNudge onDismiss={() => setNudgeDismissed(true)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                <h2 className="font-display font-bold text-slate-900 text-sm">Paste Your Notes</h2>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your lecture notes, textbook content, or anything you want to study here…"
                rows={10}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all bg-slate-50 hover:bg-white leading-relaxed font-body"
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                  <span>{wordCount} words</span>
                  <span>{charCount} chars</span>
                  {charCount > 0 && charCount < 50 && <span className="text-amber-500">⚠ Too short</span>}
                  {charCount >= 50 && <span className="text-teal-600">✓ Good</span>}
                </div>
                <div className="flex items-center gap-2">
                  {notes && (
                    <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-bold flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => setNotes(SAMPLE_NOTE)}
                    className="text-xs font-black text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ✦ Try sample
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-3 bg-red-50 border-2 border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl bg-orange-500 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                <h2 className="font-display font-bold text-slate-900 text-sm">Choose What You Need</h2>
              </div>

              <div className="space-y-2.5">
                {MODES.map((mode) => {
                  const isActive = activeMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      onClick={() => generate(mode.key)}
                      disabled={loading}
                      className={`w-full text-left border-2 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none ${
                        isActive && !loading
                          ? `${mode.activeBorder} ${mode.activeBg} shadow-md -translate-y-0.5`
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isActive ? `${mode.activeBg} ${mode.activeText}` : "bg-slate-200 text-slate-500"} transition-colors`}>
                            {mode.icon}
                          </div>
                          <div>
                            <p className="font-display font-bold text-slate-900 text-sm">{mode.label}</p>
                            <p className="text-xs text-slate-500 font-medium">{mode.shortDesc}</p>
                          </div>
                        </div>
                        {loading && isActive && <Spinner />}
                        {isActive && !loading && hasResult && (
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${mode.badgeBg} ${mode.badgeText}`}>Done ✓</span>
                        )}
                        {!loading && (
                          <ArrowRight className={`w-4 h-4 transition-colors ${isActive ? mode.activeText : "text-slate-300"}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <LockedFeatures />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-3 space-y-5">

            {!hasResult && !loading && (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-display font-bold text-slate-900 text-base mb-5">What can this do?</h3>
                <div className="space-y-4">
                  {MODES.map((mode) => (
                    <div key={mode.key} className={`flex items-start gap-4 p-4 rounded-2xl border-2 ${mode.activeBg} ${mode.activeBorder}`}>
                      <div className={`p-2.5 rounded-xl ${mode.activeBg} ${mode.activeText} flex-shrink-0`}>
                        {mode.icon}
                      </div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-sm mb-1">{mode.label}</p>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{mode.longDesc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-semibold">No login required · Your notes are never stored · Powered by Gemini AI</p>
                </div>
              </div>
            )}

            {loading && (
              <div ref={resultRef} className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-900 text-sm">AI is working on it…</p>
                    <p className="text-xs text-slate-400 font-medium">Usually takes 5–10 seconds</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[90, 75, 85, 60, 80].map((w, i) => (
                    <div key={i} className="h-4 bg-slate-100 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}

            {!loading && summaryText && activeMode === "summary" && (
              <div ref={resultRef} className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">Your Summary</p>
                      <p className="text-xs text-slate-400 font-medium">Key points from your notes</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full">Summary</span>
                </div>
                <SummaryResult text={summaryText} />
                <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Go deeper?</p>
                  <div className="flex gap-2">
                    <button onClick={() => generate("questions")} className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors">Practice Questions</button>
                    <button onClick={() => generate("explain")} className="text-xs font-black text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">Explain Simply</button>
                  </div>
                </div>
              </div>
            )}

            {!loading && explainText && activeMode === "explain" && (
              <div ref={resultRef} className="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">Simple Explanation</p>
                      <p className="text-xs text-slate-400 font-medium">Plain language, no jargon</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-violet-700 bg-violet-100 border border-violet-200 px-3 py-1 rounded-full">Explain</span>
                </div>
                <ExplainResult text={explainText} />
                <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-medium">Ready to test yourself?</p>
                  <div className="flex gap-2">
                    <button onClick={() => generate("summary")} className="text-xs font-black text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors">Summarise</button>
                    <button onClick={() => generate("questions")} className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors">Practice Questions</button>
                  </div>
                </div>
              </div>
            )}

            {!loading && questions.length > 0 && activeMode === "questions" && (
              <div ref={resultRef} className="space-y-4">
                <div className="bg-white border-2 border-teal-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-sm">Practice Questions</p>
                        <p className="text-xs text-slate-400 font-medium">{questions.length} questions from your notes</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-teal-700 bg-teal-100 border border-teal-200 px-3 py-1 rounded-full">Quiz</span>
                  </div>
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-xs font-medium leading-relaxed">
                      Answer each question in your own words, then click &quot;Check my answer&quot; for AI feedback. No peeking at your notes first!
                    </p>
                  </div>
                </div>

                {questions.map((q, i) => (
                  <QuestionCard key={i} q={q} index={i} state={qStates[i]} onChange={(v) => updateQAnswer(i, v)} onSubmit={() => gradeAnswer(i)} />
                ))}

                {qStates.some((s) => s.submitted) && (
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="font-display font-bold text-slate-900 text-sm mb-4">Your Progress</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {(["correct", "partial", "incorrect"] as GradeResult[]).map((grade) => {
                        const count = qStates.filter((s) => s.grade === grade).length;
                        const cfg = {
                          correct: { label: "Correct", bg: "bg-teal-50 border-teal-200", text: "text-teal-700" },
                          partial: { label: "Partial", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
                          incorrect: { label: "Incorrect", bg: "bg-red-50 border-red-200", text: "text-red-600" },
                        }[grade!];
                        return (
                          <div key={grade} className={`border-2 rounded-2xl p-3 ${cfg.bg}`}>
                            <p className={`font-display font-black text-2xl ${cfg.text}`}>{count}</p>
                            <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => generate("questions")} className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-black text-teal-700 bg-teal-50 border-2 border-teal-200 py-2.5 rounded-xl hover:bg-teal-100 transition-colors">
                      <RotateCcw className="w-4 h-4" /> Generate new questions
                    </button>
                  </div>
                )}
              </div>
            )}

            {hasResult && !loading && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-900/40">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-black text-white text-base mb-1">Like what you see?</p>
                    <p className="text-slate-300 text-sm font-medium leading-relaxed mb-4">
                      Create a free account to unlock study groups, mentor sessions, unlimited AI, and progress tracking.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/Register" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-900/30 hover:-translate-y-0.5">
                        Create free account <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/Login" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl text-sm font-black transition-colors">
                        Log in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}