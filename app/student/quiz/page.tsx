"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

const QUIZ_QUESTIONS = [
  {
    subject: "Mathematics",
    q: "If α and β are roots of 2x² − 5x + 3 = 0, find α² + β².",
    options: ["25/4", "13/4", "7/4", "9/4"],
    correct: 1,
    explain: "Using α+β = 5/2 and αβ = 3/2: α²+β² = (α+β)² − 2αβ = 25/4 − 3 = 13/4.",
  },
  {
    subject: "Biology",
    q: "Which process occurs in the mitochondrial matrix?",
    options: ["Glycolysis", "Electron transport chain", "Krebs cycle", "Fermentation"],
    correct: 2,
    explain: "The Krebs cycle (citric acid cycle) takes place in the mitochondrial matrix.",
  },
  {
    subject: "Chemistry",
    q: "What is the molar mass of H₂SO₄?",
    options: ["96 g/mol", "98 g/mol", "100 g/mol", "94 g/mol"],
    correct: 1,
    explain: "H₂SO₄: 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol.",
  },
  {
    subject: "Mathematics",
    q: "Simplify: log₂8 + log₂4",
    options: ["4", "5", "6", "7"],
    correct: 1,
    explain: "log₂8 = 3 (since 2³=8) and log₂4 = 2 (since 2²=4). So 3 + 2 = 5.",
  },
  {
    subject: "English",
    q: "Identify the figure of speech: 'The wind whispered through the trees.'",
    options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
    correct: 2,
    explain: "Giving the wind the human ability to 'whisper' is personification.",
  },
];

const SUBJECTS = ["All", "Mathematics", "Biology", "Chemistry", "English"];

export default function QuizPage() {
  const [filter, setFilter]     = useState("All");
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  const questions = filter === "All" ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter((q) => q.subject === filter);
  const q         = questions[current];

  if (!q) {
    return (
      <div className="text-center py-20">
        <p className="font-display font-bold text-slate-500 text-lg">No questions for &quot;{filter}&quot; yet.</p>
        <button onClick={() => setFilter("All")} className="mt-4 text-sm font-black text-orange-500 hover:underline">Show all questions</button>
      </div>
    );
  }

  const isCorrect = selected === q.correct;

  const handleSelect = (i: number) => { if (answered) return; setSelected(i); };
  const handleCheck  = () => { if (selected === null) return; setAnswered(true); if (isCorrect) setScore((p) => p + 1); };
  const handleNext   = () => {
    if (current < questions.length - 1) { setCurrent((p) => p + 1); setSelected(null); setAnswered(false); }
    else setDone(true);
  };
  const handleRestart = () => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Practice Quiz</h2>
          <p className="text-slate-500 text-sm font-medium">WAEC-style questions to sharpen your exam skills.</p>
        </div>
        {!done && (
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map((s) => (
              <button key={s} onClick={() => { setFilter(s); setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filter === s ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {done ? (
        /* ── Result screen ── */
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl ${
            score === questions.length ? "bg-teal-100" : score >= questions.length / 2 ? "bg-amber-100" : "bg-red-100"
          }`}>
            {score === questions.length ? "🎉" : score >= questions.length / 2 ? "👍" : "💪"}
          </div>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Quiz Complete</p>
          <h3 className="font-display font-black text-slate-900 text-4xl mb-2">{score} / {questions.length}</h3>
          <p className="text-slate-500 font-medium text-sm mb-2">{Math.round((score / questions.length) * 100)}% score</p>
          <p className="text-slate-400 text-sm mb-8">
            {score === questions.length ? "Perfect score! Excellent work." : score >= questions.length / 2 ? "Good effort — review the ones you missed." : "Keep practising — you'll get there!"}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-200 hover:-translate-y-0.5">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      ) : (
        /* ── Quiz card ── */
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Progress bar */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Question {current + 1} of {questions.length}</span>
                <span className="text-xs font-black text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">{q.subject}</span>
              </div>
              <span className="text-xs font-black text-teal-600 bg-teal-100 px-2.5 py-1 rounded-full">Score: {score}/{current}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
            <p className="font-display font-bold text-slate-900 text-lg leading-relaxed mb-6">{q.q}</p>

            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => {
                let style = "border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white cursor-pointer";
                if (selected === i && !answered) style = "border-2 border-orange-400 bg-orange-50 cursor-pointer";
                if (answered && i === q.correct) style = "border-2 border-teal-400 bg-teal-50 cursor-default";
                if (answered && selected === i && i !== q.correct) style = "border-2 border-red-400 bg-red-50 cursor-default";
                return (
                  <button key={i} onClick={() => handleSelect(i)} className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${style}`}>
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

            {/* Action button */}
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
      )}
    </div>
  );
}