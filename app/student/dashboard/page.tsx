"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles, LayoutDashboard, BookOpen, Bot, Users, ShieldCheck,
  HelpCircle, LogOut, Bell, ChevronRight, TrendingUp, Zap,
  FileText, BrainCircuit, Lightbulb, RotateCcw, CheckCircle2,
  AlertCircle, MinusCircle, ArrowRight, Star, Send, Upload,
  Menu, X, Clock, Target, Flame, Award, MessageCircle,
  Search, Filter, CalendarDays, Eye, EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "study" | "tutor" | "groups" | "mentors" | "quiz";
type StudyMode = "summary" | "questions" | "explain";
type GradeResult = "correct" | "partial" | "incorrect" | null;

interface Question { question: string; answer: string; }
interface QuestionState {
  userAnswer: string; grade: GradeResult;
  feedback: string; loading: boolean; submitted: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SAMPLE_NOTE = `The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration — three stages: glycolysis, the Krebs cycle, and the electron transport chain. Oxygen is required for aerobic respiration, producing 36–38 ATP per glucose.

Mitochondria have a double-membrane structure with a highly folded inner membrane called cristae, increasing surface area for ATP production. They contain their own DNA, supporting the endosymbiotic theory.

Key functions: calcium signalling, heat production, and apoptosis (programmed cell death).`;

const SUBJECTS = [
  { name: "Mathematics", progress: 78, color: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700" },
  { name: "Biology", progress: 65, color: "bg-teal-500", light: "bg-teal-100", text: "text-teal-700" },
  { name: "Chemistry", progress: 52, color: "bg-violet-500", light: "bg-violet-100", text: "text-violet-700" },
  { name: "English", progress: 88, color: "bg-rose-500", light: "bg-rose-100", text: "text-rose-700" },
  { name: "Physics", progress: 44, color: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700" },
];

const GROUPS = [
  { name: "SS3 Mathematics", subject: "Mathematics", level: "WAEC Prep", members: 247, online: 12, icon: "📐", joined: true, color: "orange" },
  { name: "SS3 Biology", subject: "Biology", level: "WAEC Prep", members: 189, online: 8, icon: "🔬", joined: true, color: "teal" },
  { name: "Chemistry Hub", subject: "Chemistry", level: "SS2 & SS3", members: 134, online: 4, icon: "⚗️", joined: false, color: "violet" },
  { name: "English Mastery", subject: "English", level: "All levels", members: 312, online: 19, icon: "📖", joined: false, color: "rose" },
  { name: "Physics Legends", subject: "Physics", level: "SS3 Focus", members: 98, online: 3, icon: "⚡", joined: false, color: "amber" },
  { name: "JAMB Warriors", subject: "Mixed", level: "JAMB Prep", members: 421, online: 27, icon: "🎯", joined: false, color: "orange" },
];

const MENTORS = [
  { initials: "AO", name: "Mr. Adewale Okafor", subjects: "Mathematics · Physics", level: "SS2–SS3", price: "₦2,500", rating: 4.9, reviews: 87, color: "bg-orange-500", online: true },
  { initials: "FN", name: "Dr. Fatima Nwosu", subjects: "Biology · Chemistry", level: "All levels", price: "₦3,000", rating: 5.0, reviews: 124, color: "bg-teal-600", online: true },
  { initials: "EI", name: "Ms. Emeka Ihejirika", subjects: "English · Literature", level: "WAEC focus", price: "₦1,800", rating: 4.7, reviews: 63, color: "bg-violet-600", online: false },
  { initials: "KB", name: "Mr. Kolade Babatunde", subjects: "Economics · Accounting", level: "SS3", price: "₦2,200", rating: 4.6, reviews: 51, color: "bg-rose-500", online: true },
  { initials: "SA", name: "Mrs. Sola Adeyemi", subjects: "Mathematics · Further Maths", level: "All levels", price: "₦2,800", rating: 4.8, reviews: 96, color: "bg-amber-500", online: false },
];

const ACTIVITY = [
  { icon: "📄", iconBg: "bg-orange-100", text: "Chemistry notes summarised", time: "2h ago" },
  { icon: "✅", iconBg: "bg-teal-100", text: "Math quiz — scored 90%", time: "4h ago" },
  { icon: "💬", iconBg: "bg-violet-100", text: "Posted in SS3 Biology group", time: "Yesterday" },
  { icon: "🧑‍🏫", iconBg: "bg-rose-100", text: "Mentor session with Mr. Okafor", time: "2 days ago" },
  { icon: "🧠", iconBg: "bg-amber-100", text: "AI Tutor: Quadratic equations", time: "2 days ago" },
];

const QUIZ_QUESTIONS = [
  { q: "If α and β are roots of 2x² − 5x + 3 = 0, find α² + β².", options: ["25/4", "13/4", "7/4", "9/4"], correct: 1, explain: "Using α+β = 5/2 and αβ = 3/2: α²+β² = (α+β)² − 2αβ = 25/4 − 3 = 13/4." },
  { q: "Which process occurs in the mitochondrial matrix?", options: ["Glycolysis", "Electron transport chain", "Krebs cycle", "Fermentation"], correct: 2, explain: "The Krebs cycle (citric acid cycle) takes place in the mitochondrial matrix." },
  { q: "What is the molar mass of H₂SO₄?", options: ["96 g/mol", "98 g/mol", "100 g/mol", "94 g/mol"], correct: 1, explain: "H₂SO₄: 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseQuestions(text: string): Question[] {
  const parts = text.split(/---ANSWERS---|---answers---/);
  const qLines = (parts[0] || "").split("\n").filter((l) => /^Q\d+[:.]/i.test(l.trim()));
  const aLines = (parts[1] || "").split("\n").filter((l) => /^A\d+[:.]/i.test(l.trim()));
  return qLines.map((q, i) => ({
    question: q.replace(/^Q\d+[:.]\s*/i, "").trim(),
    answer: (aLines[i] || "").replace(/^A\d+[:.]\s*/i, "").trim(),
  }));
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("/api/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { tab: Tab; icon: React.ReactNode; label: string }[] = [
  { tab: "overview", icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview" },
  { tab: "study", icon: <BookOpen className="w-5 h-5" />, label: "Study Assistant" },
  { tab: "tutor", icon: <Bot className="w-5 h-5" />, label: "AI Tutor" },
  { tab: "groups", icon: <Users className="w-5 h-5" />, label: "Study Groups" },
  { tab: "mentors", icon: <ShieldCheck className="w-5 h-5" />, label: "Mentors" },
  { tab: "quiz", icon: <HelpCircle className="w-5 h-5" />, label: "Practice Quiz" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewSection() {
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative rounded-3xl bg-slate-900 p-7 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-orange-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-teal-500 opacity-10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">Good morning 🌤️</p>
            <h2 className="font-display font-black text-white text-2xl sm:text-3xl mb-2">
              Welcome back, <em className="not-italic text-orange-400">Amara!</em>
            </h2>
            <p className="text-slate-400 text-sm font-medium">You&apos;re on a 7-day streak. Keep it up — WAEC is in 3 months.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl px-4 py-3 text-center">
              <p className="font-display font-black text-orange-400 text-2xl">7</p>
              <p className="text-orange-300/80 text-xs font-bold uppercase tracking-widest">Day Streak</p>
            </div>
            <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl px-4 py-3 text-center">
              <p className="font-display font-black text-teal-400 text-2xl">82%</p>
              <p className="text-teal-300/80 text-xs font-bold uppercase tracking-widest">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Notes Processed", value: "24", sub: "+3 this week", icon: <FileText className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-100" },
          { label: "Quizzes Taken", value: "61", sub: "82% avg score", icon: <HelpCircle className="w-5 h-5" />, color: "text-teal-600", bg: "bg-teal-100" },
          { label: "Study Hours", value: "38h", sub: "This month", icon: <Clock className="w-5 h-5" />, color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Mentor Sessions", value: "5", sub: "2 upcoming", icon: <ShieldCheck className="w-5 h-5" />, color: "text-rose-600", bg: "bg-rose-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`font-display font-black text-3xl ${s.color} mb-0.5`}>{s.value}</p>
            <p className="text-slate-400 text-xs font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Subject progress */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Subject Progress</h3>
            <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">{SUBJECTS.length} active</span>
          </div>
          <div className="space-y-4">
            {SUBJECTS.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-700">{s.name}</span>
                  <span className={`text-xs font-black ${s.text}`}>{s.progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Recent Activity</h3>
            <button className="text-xs font-black text-teal-600 hover:text-teal-700 transition-colors">View all</button>
          </div>
          <div className="space-y-1">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center text-base flex-shrink-0`}>{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-semibold truncate">{a.text}</p>
                </div>
                <span className="text-slate-400 text-xs font-semibold flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div>
        <h3 className="font-display font-bold text-slate-900 text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: "✨", label: "Summarise", color: "bg-orange-50 border-orange-200 hover:border-orange-400", text: "text-orange-700" },
            { icon: "📝", label: "Gen Quiz", color: "bg-teal-50 border-teal-200 hover:border-teal-400", text: "text-teal-700" },
            { icon: "🧠", label: "Explain", color: "bg-violet-50 border-violet-200 hover:border-violet-400", text: "text-violet-700" },
            { icon: "🗂️", label: "Flashcards", color: "bg-rose-50 border-rose-200 hover:border-rose-400", text: "text-rose-700" },
            { icon: "📊", label: "Weak Areas", color: "bg-amber-50 border-amber-200 hover:border-amber-400", text: "text-amber-700" },
            { icon: "📋", label: "Exam Qs", color: "bg-slate-50 border-slate-200 hover:border-slate-400", text: "text-slate-700" },
          ].map((a) => (
            <button key={a.label} className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className={`text-xs font-black ${a.text}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: STUDY ASSISTANT
// ═══════════════════════════════════════════════════════════════════════════════
function StudySection() {
  const [notes, setNotes] = useState("");
  const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [explainText, setExplainText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qStates, setQStates] = useState<QuestionState[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const hasResult = summaryText || explainText || questions.length > 0;

  const clearAll = () => { setNotes(""); setSummaryText(""); setExplainText(""); setQuestions([]); setQStates([]); setActiveMode(null); setError(""); };

  const generate = async (mode: StudyMode) => {
    if (!notes.trim()) { setError("Paste your notes first — or click 'Try sample'."); return; }
    if (notes.trim().length < 50) { setError("Notes too short. Paste at least a paragraph."); return; }
    setError(""); setLoading(true); setActiveMode(mode);
    setSummaryText(""); setExplainText(""); setQuestions([]); setQStates([]);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    const prompts: Record<StudyMode, string> = {
      summary: `You are a study assistant. Summarise these notes:\n- One-sentence overview at top\n- 5-8 bullet points (use •) with key concepts\n- Bold (**text**) important terms\n\nNotes:\n${notes}`,
      questions: `Generate exactly 3 practice questions from these notes.\nFormat:\nQ1: [question]\nQ2: [question]\nQ3: [question]\n---ANSWERS---\nA1: [2-3 sentence answer]\nA2: [2-3 sentence answer]\nA3: [2-3 sentence answer]\n\nNotes:\n${notes}`,
      explain: `Explain these notes in simple language for a 15-year-old. Use analogies, short paragraphs (3-5 sentences), no jargon. Define technical terms.\n\nNotes:\n${notes}`,
    };

    try {
      const text = await callClaude(prompts[mode]);
      if (mode === "summary") setSummaryText(text);
      else if (mode === "explain") setExplainText(text);
      else { const p = parseQuestions(text); setQuestions(p); setQStates(p.map(() => ({ userAnswer: "", grade: null, feedback: "", loading: false, submitted: false }))); }
    } catch { setError("AI connection failed. Please try again."); setActiveMode(null); }
    finally { setLoading(false); }
  };

  const gradeAnswer = async (idx: number) => {
    const q = questions[idx];
    if (!qStates[idx].userAnswer.trim()) return;
    setQStates((p) => p.map((s, i) => i === idx ? { ...s, loading: true } : s));
    try {
      const text = await callClaude(`Grade this student answer.\nQuestion: ${q.question}\nExpected: ${q.answer}\nStudent: ${qStates[idx].userAnswer}\n\nRespond EXACTLY:\nVERDICT: [CORRECT / PARTIAL / INCORRECT]\nFEEDBACK: [2-3 constructive sentences]`);
      const verdictMatch = text.match(/VERDICT:\s*(CORRECT|PARTIAL|INCORRECT)/i);
      const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)/i);
      const grade = (verdictMatch?.[1].toLowerCase() ?? "incorrect") as GradeResult;
      const feedback = feedbackMatch?.[1].trim() ?? text;
      setQStates((p) => p.map((s, i) => i === idx ? { ...s, grade, feedback, loading: false, submitted: true } : s));
    } catch { setQStates((p) => p.map((s, i) => i === idx ? { ...s, loading: false, feedback: "Could not grade. Try again." } : s)); }
  };

  const MODES = [
    { key: "summary" as StudyMode, icon: <BookOpen className="w-5 h-5" />, label: "Summarise Notes", desc: "Key bullet points from your notes", activeBorder: "border-orange-400", activeBg: "bg-orange-50", activeText: "text-orange-600" },
    { key: "questions" as StudyMode, icon: <HelpCircle className="w-5 h-5" />, label: "Practice Questions", desc: "AI-generated questions + grading", activeBorder: "border-teal-400", activeBg: "bg-teal-50", activeText: "text-teal-700" },
    { key: "explain" as StudyMode, icon: <Lightbulb className="w-5 h-5" />, label: "Explain Simply", desc: "Plain-language breakdown", activeBorder: "border-violet-400", activeBg: "bg-violet-50", activeText: "text-violet-700" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Study Assistant</h2>
        <p className="text-slate-500 text-sm font-medium">Upload or paste your notes and let AI do the heavy lifting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload zone */}
          <div className="bg-white border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors group">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-slate-700 text-sm">Drop PDF, slides, or text</p>
              <p className="text-slate-400 text-xs font-medium mt-0.5">PDF, .docx, .txt, .pptx — up to 50MB</p>
            </div>
          </div>

          {/* Text input */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Or paste notes</p>
              <div className="flex gap-2">
                {notes && <button onClick={clearAll} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"><RotateCcw className="w-3 h-3" />Clear</button>}
                <button onClick={() => setNotes(SAMPLE_NOTE)} className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors">Try sample</button>
              </div>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste lecture notes, textbook content…" rows={8}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all bg-slate-50 font-body leading-relaxed" />
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-400">
              <span>{wordCount} words</span>
              {notes.length >= 50 && <span className="text-teal-600">✓ Good length</span>}
              {notes.length > 0 && notes.length < 50 && <span className="text-amber-500">⚠ Too short</span>}
            </div>
            {error && <div className="mt-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          </div>

          {/* Mode buttons */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-2.5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Choose action</p>
            {MODES.map((m) => {
              const isActive = activeMode === m.key;
              return (
                <button key={m.key} onClick={() => generate(m.key)} disabled={loading}
                  className={`w-full text-left border-2 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isActive && !loading ? `${m.activeBorder} ${m.activeBg} shadow-sm -translate-y-0.5` : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${isActive ? `${m.activeBg} ${m.activeText}` : "bg-slate-200 text-slate-500"}`}>{m.icon}</div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-sm">{m.label}</p>
                        <p className="text-xs text-slate-500 font-medium">{m.desc}</p>
                      </div>
                    </div>
                    {loading && isActive ? <Spinner /> : isActive && hasResult ? <span className={`text-xs font-black px-2 py-0.5 rounded-full ${m.activeBg} ${m.activeText}`}>Done ✓</span> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — results */}
        <div className="lg:col-span-3 space-y-4">
          {!hasResult && !loading && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-orange-500" /></div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Ready when you are</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">Paste your notes on the left and choose an action to get started. Try the sample note if you&apos;re new!</p>
            </div>
          )}

          {loading && (
            <div ref={resultRef} className="bg-white border-2 border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center animate-pulse"><Sparkles className="w-5 h-5 text-white" /></div>
                <div><p className="font-display font-bold text-slate-900 text-sm">AI is working…</p><p className="text-xs text-slate-400 font-medium">Usually 5–10 seconds</p></div>
              </div>
              <div className="space-y-3">{[90, 75, 85, 60, 80].map((w, i) => <div key={i} className="h-4 bg-slate-100 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />)}</div>
            </div>
          )}

          {!loading && summaryText && activeMode === "summary" && (
            <div ref={resultRef} className="bg-white border-2 border-orange-200 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-white" /></div>
                  <div><p className="font-display font-bold text-slate-900 text-sm">Summary</p><p className="text-xs text-slate-400 font-medium">Key concepts extracted</p></div>
                </div>
                <span className="text-xs font-black text-orange-700 bg-orange-100 px-3 py-1 rounded-full">Done ✓</span>
              </div>
              <div className="space-y-2.5">
                {summaryText.split("\n").map((l) => l.trim()).filter(Boolean).map((line, i) => {
                  const isBullet = /^[•\-*]/.test(line);
                  const clean = line.replace(/^[•\-*]\s*/, "");
                  return isBullet
                    ? <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-black">✓</span><span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} /></div>
                    : <p key={i} className="text-sm font-semibold text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
                })}
              </div>
              <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 flex gap-2 justify-end">
                <button onClick={() => generate("questions")} className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors">Practice Questions</button>
                <button onClick={() => generate("explain")} className="text-xs font-black text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">Explain Simply</button>
              </div>
            </div>
          )}

          {!loading && explainText && activeMode === "explain" && (
            <div ref={resultRef} className="bg-white border-2 border-violet-200 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4 text-white" /></div>
                  <div><p className="font-display font-bold text-slate-900 text-sm">Simple Explanation</p><p className="text-xs text-slate-400 font-medium">Plain language, no jargon</p></div>
                </div>
                <span className="text-xs font-black text-violet-700 bg-violet-100 px-3 py-1 rounded-full">Done ✓</span>
              </div>
              <div className="space-y-3">
                {explainText.split("\n").map((l) => l.trim()).filter(Boolean).map((p, i) =>
                  <p key={i} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                )}
              </div>
              <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200 flex gap-2 justify-end">
                <button onClick={() => generate("summary")} className="text-xs font-black text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors">Summarise</button>
                <button onClick={() => generate("questions")} className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors">Practice Questions</button>
              </div>
            </div>
          )}

          {!loading && questions.length > 0 && activeMode === "questions" && (
            <div ref={resultRef} className="space-y-4">
              <div className="bg-white border-2 border-teal-200 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0"><HelpCircle className="w-4 h-4 text-white" /></div>
                    <div><p className="font-display font-bold text-slate-900 text-sm">Practice Questions</p><p className="text-xs text-slate-400 font-medium">{questions.length} questions · type answers below</p></div>
                  </div>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 px-3 py-1 rounded-full">Quiz Mode</span>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-xs font-medium">Answer in your own words, then click &quot;Check&quot; for AI grading. Don&apos;t peek at notes!</p>
                </div>
              </div>
              {questions.map((q, i) => {
                const s = qStates[i];
                const gradeConfig = {
                  correct: { border: "border-teal-300 bg-teal-50/40", icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />, label: "Correct!", labelColor: "text-teal-700" },
                  partial: { border: "border-amber-300 bg-amber-50/40", icon: <MinusCircle className="w-4 h-4 text-amber-600" />, label: "Partially Correct", labelColor: "text-amber-700" },
                  incorrect: { border: "border-red-300 bg-red-50/40", icon: <AlertCircle className="w-4 h-4 text-red-500" />, label: "Needs Improvement", labelColor: "text-red-600" },
                };
                return (
                  <div key={i} className={`border-2 rounded-2xl p-5 bg-white transition-all ${s.submitted && s.grade === "correct" ? "border-teal-200" : "border-slate-200"}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-teal-500 text-white text-sm font-black flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed pt-1">{q.question}</p>
                    </div>
                    {(!s.submitted || s.grade !== "correct") && (
                      <>
                        <textarea value={s.userAnswer} onChange={(e) => { const v = e.target.value; setQStates((p) => p.map((x, j) => j === i ? { ...x, userAnswer: v, submitted: false, grade: null, feedback: "" } : x)); }}
                          placeholder="Your answer…" rows={3} disabled={s.loading}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 bg-slate-50 font-body" />
                        <button onClick={() => gradeAnswer(i)} disabled={s.loading || !s.userAnswer.trim()}
                          className="mt-3 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-md shadow-teal-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {s.loading ? <><Spinner />Grading…</> : <>Check answer <ArrowRight className="w-3.5 h-3.5" /></>}
                        </button>
                      </>
                    )}
                    {s.submitted && s.grade && s.feedback && (
                      <div className={`mt-3 border-2 rounded-xl px-4 py-3 ${gradeConfig[s.grade].border}`}>
                        <div className="flex items-center gap-2 mb-1">{gradeConfig[s.grade].icon}<p className={`font-black text-sm ${gradeConfig[s.grade].labelColor}`}>{gradeConfig[s.grade].label}</p></div>
                        <p className="text-sm text-slate-600 leading-relaxed">{s.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: AI TUTOR
// ═══════════════════════════════════════════════════════════════════════════════
function TutorSection() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi Amara! 👋 I'm your AI tutor. I can explain concepts, solve problems step-by-step, or help you practice for exams. What subject are we working on today?" },
    { role: "user", text: "Can you explain the quadratic formula?" },
    { role: "ai", text: "Of course! The quadratic formula solves any equation of the form ax² + bx + c = 0.\n\nThe formula is: x = (−b ± √(b²−4ac)) / 2a\n\nThe ± means there are usually two solutions. The part under the root — b²−4ac — is called the discriminant. It tells you how many real solutions exist:\n• If positive → 2 solutions\n• If zero → 1 solution\n• If negative → no real solutions\n\nWant me to walk through an example?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setLoading(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const history = messages.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
      const prompt = `You are a friendly, encouraging AI tutor for a Nigerian secondary school student studying ${subject}. Be clear, use examples, and break down complex topics step-by-step. Keep responses focused and under 200 words unless solving a problem that requires more.\n\nConversation so far:\n${history}\n\nStudent: ${userMsg}\nTutor:`;
      const text = await callClaude(prompt);
      setMessages((p) => [...p, { role: "ai", text }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">AI Tutor</h2>
          <p className="text-slate-500 text-sm font-medium">Ask anything — get step-by-step explanations, 24/7.</p>
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className="border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body">
          {["Mathematics", "Biology", "Chemistry", "Physics", "English", "Economics"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: "560px" }}>
        {/* Chat header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0"><Bot className="w-5 h-5 text-white" /></div>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">EduBoost AI Tutor</p>
            <p className="text-slate-400 text-xs font-medium">Specialising in {subject}</p>
          </div>
          <span className="flex items-center gap-1.5 bg-teal-500/20 border border-teal-500/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-xs font-black">Online</span>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-amber-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${m.role === "ai" ? "bg-orange-500 text-white" : "bg-slate-700 text-white"}`}>
                {m.role === "ai" ? "AI" : "A"}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium whitespace-pre-line ${m.role === "ai" ? "bg-white border-2 border-slate-200 text-slate-700 rounded-tl-sm" : "bg-slate-900 text-white rounded-tr-sm"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0">AI</div>
              <div className="bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <div className="flex gap-1">{[0, 0.2, 0.4].map((d, i) => <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}</div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t-2 border-slate-200 bg-white px-4 py-3 flex gap-3 items-end">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${subject}… (Enter to send)`} rows={1}
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-slate-50 font-body" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            {loading ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick prompts</p>
        <div className="flex flex-wrap gap-2">
          {["Explain this topic simply", "Give me a step-by-step example", "What are common exam mistakes?", "Create a practice question", "Summarise the key formulas"].map((p) => (
            <button key={p} onClick={() => { setInput(p); }}
              className="text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-orange-300 hover:text-orange-600 px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: GROUPS
// ═══════════════════════════════════════════════════════════════════════════════
function GroupsSection() {
  const [joined, setJoined] = useState<string[]>(["SS3 Mathematics", "SS3 Biology"]);
  const [search, setSearch] = useState("");

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", iconBg: "bg-orange-100" },
    teal: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700", iconBg: "bg-teal-100" },
    violet: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", iconBg: "bg-violet-100" },
    rose: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-700", iconBg: "bg-rose-100" },
    amber: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", iconBg: "bg-amber-100" },
  };

  const filtered = GROUPS.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Study Groups</h2>
          <p className="text-slate-500 text-sm font-medium">Connect with peers studying the same subjects.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups…"
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-body" />
        </div>
      </div>

      {/* My groups */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">My Groups</p>
          <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{joined.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {GROUPS.filter((g) => joined.includes(g.name)).map((g) => {
            const c = colorMap[g.color] || colorMap.orange;
            return (
              <div key={g.name} className={`border-2 rounded-2xl p-5 ${c.bg} ${c.border}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl`}>{g.icon}</div>
                    <div>
                      <p className={`font-display font-bold text-slate-900 text-sm`}>{g.name}</p>
                      <p className={`text-xs font-semibold ${c.text}`}>{g.level}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-teal-700 bg-teal-100 border border-teal-200 rounded-full px-2.5 py-1 text-xs font-black"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />{g.online} online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">{g.members.toLocaleString()} members</span>
                  <button className={`text-xs font-black px-3 py-1.5 rounded-xl ${c.bg} ${c.text} border ${c.border} hover:opacity-80 transition-opacity`}>Open Group →</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discover */}
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Discover Groups</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.filter((g) => !joined.includes(g.name)).map((g) => {
            const c = colorMap[g.color] || colorMap.orange;
            return (
              <div key={g.name} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl`}>{g.icon}</div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">{g.name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{g.level}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{g.online} online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">{g.members.toLocaleString()} members</span>
                  <button onClick={() => setJoined((p) => [...p, g.name])}
                    className="text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl transition-colors">
                    + Join Group
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: MENTORS
// ═══════════════════════════════════════════════════════════════════════════════
function MentorsSection() {
  const [filter, setFilter] = useState("All");
  const subjects = ["All", "Mathematics", "Biology", "Chemistry", "English", "Economics"];

  const filtered = filter === "All" ? MENTORS : MENTORS.filter((m) => m.subjects.includes(filter));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Mentors</h2>
        <p className="text-slate-500 text-sm font-medium">Book 1-on-1 sessions with verified academic mentors.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {subjects.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filter === s ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Mentor cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div key={m.name} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-white font-black text-base`}>{m.initials}</div>
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">{m.name}</p>
                  <p className="text-slate-500 text-xs font-semibold">{m.subjects}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-black rounded-full px-2.5 py-1 ${m.online ? "bg-teal-100 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${m.online ? "bg-teal-500 animate-pulse" : "bg-slate-400"}`} />{m.online ? "Online" : "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(m.rating) ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />)}
              <span className="text-amber-600 text-xs font-black ml-1">{m.rating}</span>
              <span className="text-slate-400 text-xs font-semibold">({m.reviews} reviews)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</p>
                <p className="text-slate-700 text-xs font-bold mt-0.5">{m.level}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                <p className="font-display font-black text-orange-600 text-sm mt-0.5">{m.price}/hr</p>
              </div>
            </div>

            <button className="w-full bg-slate-900 hover:bg-orange-500 text-white py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-200">
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: PRACTICE QUIZ
// ═══════════════════════════════════════════════════════════════════════════════
function QuizSection() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[current];
  const isCorrect = selected === q.correct;

  const handleOption = (i: number) => { if (answered) return; setSelected(i); };
  const handleCheck = () => { if (selected === null) return; setAnswered(true); if (isCorrect) setScore((p) => p + 1); };
  const handleNext = () => {
    if (current < QUIZ_QUESTIONS.length - 1) { setCurrent((p) => p + 1); setSelected(null); setAnswered(false); }
    else setDone(true);
  };
  const handleRestart = () => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Practice Quiz</h2>
        <p className="text-slate-500 text-sm font-medium">WAEC-style questions to sharpen your exam skills.</p>
      </div>

      {done ? (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${score === QUIZ_QUESTIONS.length ? "bg-teal-100" : score >= QUIZ_QUESTIONS.length / 2 ? "bg-amber-100" : "bg-red-100"}`}>
            <p className="font-display font-black text-4xl">{score === QUIZ_QUESTIONS.length ? "🎉" : score >= QUIZ_QUESTIONS.length / 2 ? "👍" : "💪"}</p>
          </div>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Quiz Complete</p>
          <h3 className="font-display font-black text-slate-900 text-3xl mb-2">{score} / {QUIZ_QUESTIONS.length}</h3>
          <p className="text-slate-500 font-medium text-sm mb-2">{Math.round((score / QUIZ_QUESTIONS.length) * 100)}% score</p>
          <p className="text-slate-400 text-sm mb-8">{score === QUIZ_QUESTIONS.length ? "Perfect score! Excellent work." : score >= QUIZ_QUESTIONS.length / 2 ? "Good effort — review the ones you missed." : "Keep practising — you&apos;ll get there!"}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Progress bar */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Question {current + 1} of {QUIZ_QUESTIONS.length}</span>
              <span className="text-xs font-black text-teal-600 bg-teal-100 px-2.5 py-1 rounded-full">Score: {score}/{current}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${((current + (answered ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100}%` }} />
            </div>
          </div>

          {/* Question card */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
            <p className="font-display font-bold text-slate-900 text-lg leading-relaxed mb-6">{q.q}</p>

            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => {
                let style = "border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white";
                if (selected === i && !answered) style = "border-2 border-orange-400 bg-orange-50";
                if (answered && i === q.correct) style = "border-2 border-teal-400 bg-teal-50";
                if (answered && selected === i && i !== q.correct) style = "border-2 border-red-400 bg-red-50";
                return (
                  <button key={i} onClick={() => handleOption(i)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${style} ${!answered ? "cursor-pointer" : "cursor-default"}`}>
                    <span className="font-black mr-2 text-slate-400">{["A", "B", "C", "D"][i]}.</span> {opt}
                    {answered && i === q.correct && <span className="ml-2 text-teal-600">✓</span>}
                    {answered && selected === i && i !== q.correct && <span className="ml-2 text-red-500">✗</span>}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className={`border-2 rounded-xl px-4 py-3 mb-4 ${isCorrect ? "border-teal-300 bg-teal-50" : "border-amber-300 bg-amber-50"}`}>
                <p className={`font-black text-sm mb-1 ${isCorrect ? "text-teal-700" : "text-amber-700"}`}>{isCorrect ? "✅ Correct!" : "📖 Explanation"}</p>
                <p className={`text-sm leading-relaxed ${isCorrect ? "text-teal-600" : "text-amber-700"}`}>{q.explain}</p>
              </div>
            )}

            <div className="flex gap-3">
              {!answered ? (
                <button onClick={handleCheck} disabled={selected === null}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5">
                  Check Answer
                </button>
              ) : (
                <button onClick={handleNext}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5">
                  {current < QUIZ_QUESTIONS.length - 1 ? <><ArrowRight className="w-4 h-4" />Next Question</> : <>See Results ✨</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PAGE_TITLES: Record<Tab, string> = {
    overview: "Dashboard",
    study: "Study Assistant",
    tutor: "AI Tutor",
    groups: "Study Groups",
    mentors: "Mentors",
    quiz: "Practice Quiz",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewSection />;
      case "study": return <StudySection />;
      case "tutor": return <TutorSection />;
      case "groups": return <GroupsSection />;
      case "mentors": return <MentorsSection />;
      case "quiz": return <QuizSection />;
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 font-body antialiased flex">

      {/* ── SIDEBAR ── */}
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:z-auto`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-lg text-white">
                Edu<span className="text-orange-400">Boost</span><span className="text-teal-400"> AI</span>
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 ml-10">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-400 text-xs font-black uppercase tracking-widest">Student Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}>
                {icon}
                {label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Streak badge */}
        <div className="px-3 py-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🔥</div>
            <div>
              <p className="font-display font-black text-white text-sm">7-day streak!</p>
              <p className="text-slate-400 text-xs font-semibold">Keep it going 💪</p>
            </div>
          </div>
        </div>

        {/* User + logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">AT</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">Amara Tunde</p>
              <p className="text-slate-400 text-xs font-semibold">SS3 Student</p>
            </div>
          </div>
          <Link href="/Login" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-200 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="font-display font-black text-slate-900 text-xl">{PAGE_TITLES[activeTab]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xs">AT</div>
              <span className="text-slate-700 text-sm font-bold">Amara</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}