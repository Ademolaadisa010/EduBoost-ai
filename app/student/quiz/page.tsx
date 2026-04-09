"use client";

import { useState, useEffect } from "react";
import { ArrowRight, RotateCcw, Sparkles, BookOpen, ChevronDown } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Difficulty = "easy" | "normal" | "hard";
type Phase = "setup" | "loading" | "quiz" | "done";

interface Question {
  subject: string;
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

async function generateQuestions(
  subject: string,
  difficulty: Difficulty,
  topic: string
): Promise<Question[]> {
  const topicLine = topic.trim() ? `Topic/focus area: ${topic.trim()}` : "Cover a broad range of topics within the subject.";
  const difficultyGuide = {
    easy:   "Simple recall and basic understanding. Suitable for beginners.",
    normal: "Moderate application and comprehension. WAEC standard.",
    hard:   "Deep analysis, multi-step reasoning. WAEC/JAMB distinction level.",
  }[difficulty];

  const prompt = `You are a Nigerian secondary school exam question generator.

Generate exactly 5 multiple-choice questions for:
- Subject: ${subject}
- Difficulty: ${difficulty} — ${difficultyGuide}
- ${topicLine}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {
    "q": "question text",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explain": "brief explanation of the correct answer"
  }
]

Rules:
- "correct" is the 0-based index of the correct option
- All 4 options must be plausible
- Explanations must be concise (1-2 sentences)
- For maths/chemistry include working in the explanation
- Questions must match the difficulty level strictly`;

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  return parsed.map((item: Omit<Question, "subject">) => ({
    ...item,
    subject,
  }));
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string; border: string; desc: string }> = {
  easy:   { label: "Easy",   color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-400",   desc: "Basic recall & simple concepts" },
  normal: { label: "Normal", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-400", desc: "WAEC standard questions" },
  hard:   { label: "Hard",   color: "text-red-700",    bg: "bg-red-50",    border: "border-red-400",    desc: "WAEC/JAMB distinction level" },
};

export default function QuizPage() {
  // ── Auth / profile ──────────────────────────────────────────────────────────
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setProfileLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.subjects) && data.subjects.length > 0) {
            setUserSubjects(data.subjects);
          }
        }
      } catch { /* silently fall back */ }
      finally { setProfileLoading(false); }
    });
    return () => unsub();
  }, []);

  // ── Setup state ─────────────────────────────────────────────────────────────
  const [subject,    setSubject]    = useState("");
  const [topic,      setTopic]      = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  // Set default subject once subjects load
  useEffect(() => {
    if (userSubjects.length > 0 && !subject) setSubject(userSubjects[0]);
  }, [userSubjects]);

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [phase,    setPhase]    = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [genError, setGenError] = useState("");
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score,    setScore]    = useState(0);

  const q = questions[current];

  // ── Start quiz ──────────────────────────────────────────────────────────────
  const startQuiz = async () => {
    if (!subject) return;
    setPhase("loading");
    setGenError("");
    try {
      const qs = await generateQuestions(subject, difficulty, topic);
      setQuestions(qs);
      setCurrent(0); setSelected(null); setAnswered(false); setScore(0);
      setPhase("quiz");
    } catch {
      setGenError("Failed to generate questions. Please try again.");
      setPhase("setup");
    }
  };

  // ── Quiz actions ─────────────────────────────────────────────────────────────
  const handleSelect  = (i: number) => { if (answered) return; setSelected(i); };
  const handleCheck   = () => {
    if (selected === null) return;
    setAnswered(true);
    if (selected === q.correct) setScore((p) => p + 1);
  };
  const handleNext    = () => {
    if (current < questions.length - 1) {
      setCurrent((p) => p + 1); setSelected(null); setAnswered(false);
    } else {
      setPhase("done");
    }
  };
  const handleRestart = () => {
    setPhase("setup"); setQuestions([]); setGenError("");
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0);
  };
  const handleRetry   = () => startQuiz();

  const dc = DIFFICULTY_CONFIG[difficulty];

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (phase === "setup" || phase === "loading") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Practice Quiz</h2>
          <p className="text-slate-500 text-sm font-medium">AI-generated WAEC-style questions tailored to you.</p>
        </div>

        <div className="max-w-lg mx-auto space-y-5">

          {/* Subject picker */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />Subject
            </label>

            {profileLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold py-2">
                <Spinner /> Loading your subjects…
              </div>
            ) : userSubjects.length > 0 ? (
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full appearance-none border-2 border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body"
                >
                  {userSubjects.map((s) => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
                No subjects saved yet.{" "}
                <a href="/student/profile" className="font-black underline">Add them in Profile →</a>
              </div>
            )}
          </div>

          {/* Topic (optional) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Topic <span className="text-slate-400 normal-case font-semibold tracking-normal">(optional)</span>
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quadratic equations, Photosynthesis, Titration…"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body"
            />
            <p className="text-xs text-slate-400 font-medium mt-2">
              Leave blank to get a broad mix across the subject.
            </p>
          </div>

          {/* Difficulty */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
                const cfg = DIFFICULTY_CONFIG[d];
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`border-2 rounded-xl px-3 py-3 text-center transition-all hover:-translate-y-0.5
                      ${active ? `${cfg.border} ${cfg.bg}` : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
                  >
                    <p className={`text-sm font-black ${active ? cfg.color : "text-slate-600"}`}>{cfg.label}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 leading-tight ${active ? cfg.color : "text-slate-400"}`}>{cfg.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {genError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {genError}
            </div>
          )}

          {/* Start button */}
          <button
            onClick={startQuiz}
            disabled={!subject || phase === "loading"}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5"
          >
            {phase === "loading"
              ? <><Spinner className="w-4 h-4" /> Generating questions…</>
              : <><Sparkles className="w-4 h-4" /> Generate Quiz</>
            }
          </button>

          {phase === "loading" && (
            <p className="text-center text-xs text-slate-400 font-semibold animate-pulse">
              Gemini AI is crafting your {difficulty} {subject} questions…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Practice Quiz</h2>
          <p className="text-slate-500 text-sm font-medium">AI-generated WAEC-style questions tailored to you.</p>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl
            ${score === questions.length ? "bg-teal-100" : pct >= 60 ? "bg-amber-100" : "bg-red-100"}`}>
            {score === questions.length ? "🎉" : pct >= 60 ? "👍" : "💪"}
          </div>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Quiz Complete</p>
          <h3 className="font-display font-black text-slate-900 text-4xl mb-2">{score} / {questions.length}</h3>
          <p className="text-slate-500 font-medium text-sm mb-1">{pct}% score</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${dc.bg} ${dc.color}`}>{dc.label}</span>
            <span className="text-xs font-semibold text-slate-400">{subject}{topic ? ` · ${topic}` : ""}</span>
          </div>
          <p className="text-slate-400 text-sm mb-8">
            {score === questions.length ? "Perfect score! Outstanding work." : pct >= 60 ? "Good effort — review the ones you missed." : "Keep practising — you'll improve!"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={handleRetry}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all hover:-translate-y-0.5">
              <RotateCcw className="w-4 h-4" /> Same settings
            </button>
            <button onClick={handleRestart}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5">
              <Sparkles className="w-4 h-4" /> New Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────────
  const isCorrect = selected === q.correct;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Practice Quiz</h2>
          <p className="text-slate-500 text-sm font-medium">
            {subject}{topic ? ` · ${topic}` : ""} · <span className={`font-black ${dc.color}`}>{dc.label}</span>
          </p>
        </div>
        <button onClick={handleRestart}
          className="flex items-center gap-1.5 text-xs font-black text-slate-500 border-2 border-slate-200 bg-white hover:border-slate-300 px-3 py-2 rounded-xl transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> New Quiz
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">

        {/* Progress */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Question {current + 1} of {questions.length}
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${dc.bg} ${dc.color}`}>{dc.label}</span>
              <span className="text-xs font-black text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">{q.subject}</span>
            </div>
            <span className="text-xs font-black text-teal-600 bg-teal-100 px-2.5 py-1 rounded-full">
              Score: {score}/{current}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <p className="font-display font-bold text-slate-900 text-lg leading-relaxed mb-6">{q.q}</p>

          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let style = "border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white cursor-pointer";
              if (selected === i && !answered) style = "border-2 border-orange-400 bg-orange-50 cursor-pointer";
              if (answered && i === q.correct) style = "border-2 border-teal-400 bg-teal-50 cursor-default";
              if (answered && selected === i && i !== q.correct) style = "border-2 border-red-400 bg-red-50 cursor-default";
              return (
                <button key={i} onClick={() => handleSelect(i)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${style}`}>
                  <span className="font-black mr-2 text-slate-400">{["A", "B", "C", "D"][i]}.</span>
                  {opt}
                  {answered && i === q.correct && <span className="ml-2 text-teal-600">✓</span>}
                  {answered && selected === i && i !== q.correct && <span className="ml-2 text-red-500">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div className={`border-2 rounded-xl px-4 py-3 mb-5 ${isCorrect ? "border-teal-300 bg-teal-50" : "border-amber-300 bg-amber-50"}`}>
              <p className={`font-black text-sm mb-1 ${isCorrect ? "text-teal-700" : "text-amber-700"}`}>
                {isCorrect ? "✅ Correct!" : "📖 Explanation"}
              </p>
              <p className={`text-sm leading-relaxed ${isCorrect ? "text-teal-600" : "text-amber-700"}`}>{q.explain}</p>
            </div>
          )}

          {!answered ? (
            <button onClick={handleCheck} disabled={selected === null}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5">
              Check Answer
            </button>
          ) : (
            <button onClick={handleNext}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5">
              {current < questions.length - 1
                ? <><ArrowRight className="w-4 h-4" /> Next Question</>
                : <>See Results ✨</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}