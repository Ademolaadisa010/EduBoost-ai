"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, ChevronDown, Loader2, BookOpen, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "ai" | "user";
  text: string;
}

// ─── API call — Gemini via your /api/claude route ─────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ─── Firebase — fetch student's enrolled subjects ─────────────────────────────
// Firestore paths tried (in order):
//   1. users/{uid}  →  field: subjects  (string[])
//   2. users/{uid}/profile/data  →  field: subjects  (string[])
// Falls back to DEFAULT_SUBJECTS if Firebase isn't configured or field is missing.
async function fetchSubjectsFromFirebase(uid: string): Promise<string[]> {
  const { initializeApp, getApps } = await import("firebase/app");
  const { getFirestore, doc, getDoc } = await import("firebase/firestore");

  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const db  = getFirestore(app);

  // Try top-level user doc first
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists()) {
    const d = userSnap.data();
    if (Array.isArray(d?.subjects) && d.subjects.length > 0) return d.subjects;
  }

  // Try nested profile doc
  const profileSnap = await getDoc(doc(db, "users", uid, "profile", "data"));
  if (profileSnap.exists()) {
    const d = profileSnap.data();
    if (Array.isArray(d?.subjects) && d.subjects.length > 0) return d.subjects;
  }

  return []; // nothing found
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "English",
  "Economics",
  "Further Maths",
  "Government",
  "Literature",
  "Geography",
];

const QUICK_PROMPTS = [
  "Explain this topic simply",
  "Give me a step-by-step example",
  "What are common exam mistakes?",
  "Create a practice question for me",
  "Summarise the key formulas",
];

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    text: "Hi Amara! 👋 I'm your AI tutor. I can explain concepts, solve problems step-by-step, or help you practise for exams. What subject are we working on today?",
  },
  { role: "user", text: "Can you explain the quadratic formula?" },
  {
    role: "ai",
    text: "Of course! The quadratic formula solves any equation of the form ax² + bx + c = 0.\n\nThe formula is: x = (−b ± √(b²−4ac)) / 2a\n\nThe ± means there are usually two solutions. The part under the root — b²−4ac — is called the discriminant:\n• Positive → 2 real solutions\n• Zero → exactly 1 solution\n• Negative → no real solutions\n\nWant me to walk through a worked example?",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function SubjectDropdown({
  value, onChange, subjects, loading,
}: {
  value: string; onChange: (v: string) => void;
  subjects: string[]; loading: boolean;
}) {
  return (
    <div className="relative w-full sm:w-56">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full appearance-none border-2 border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? <option>Loading your subjects…</option>
          : subjects.map((s) => <option key={s} value={s}>{s}</option>)
        }
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        {loading
          ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TutorPage() {
  const [messages, setMessages]             = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]                   = useState("");
  const [sending, setSending]               = useState(false);

  const [subject, setSubject]               = useState("Mathematics");
  const [subjects, setSubjects]             = useState<string[]>(DEFAULT_SUBJECTS);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsFetchState, setSubjectsFetchState] = useState<"idle" | "firebase" | "default" | "error">("idle");

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch subjects on mount ─────────────────────────────────────────────────
  const loadSubjects = async () => {
    setSubjectsLoading(true);
    setSubjectsFetchState("idle");

    try {
      // Replace "PLACEHOLDER_UID" with your real auth logic:
      // const { getAuth } = await import("firebase/auth");
      // const uid = getAuth().currentUser?.uid;
      // if (!uid) throw new Error("Not authenticated");
      const uid = "PLACEHOLDER_UID";

      const fetched = await fetchSubjectsFromFirebase(uid);

      if (fetched.length > 0) {
        setSubjects(fetched);
        setSubject(fetched[0]);
        setSubjectsFetchState("firebase");
      } else {
        setSubjects(DEFAULT_SUBJECTS);
        setSubject(DEFAULT_SUBJECTS[0]);
        setSubjectsFetchState("default");
      }
    } catch (err) {
      console.error("Subject fetch failed:", err);
      setSubjects(DEFAULT_SUBJECTS);
      setSubject(DEFAULT_SUBJECTS[0]);
      setSubjectsFetchState("error");
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => { loadSubjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle subject switch ───────────────────────────────────────────────────
  const handleSubjectChange = (newSubject: string) => {
    if (newSubject === subject) return;
    setSubject(newSubject);
    setMessages((p) => [
      ...p,
      {
        role: "ai",
        text: `Switched to ${newSubject}! 📚 What would you like to work on? I can explain concepts, solve problems step-by-step, or create practice questions.`,
      },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || sending || subjectsLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setSending(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const history = messages
        .slice(-10) // keep last 10 messages to avoid token overflow
        .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`)
        .join("\n");

      const prompt = [
        `You are a friendly, encouraging AI tutor for a Nigerian secondary school student studying ${subject} for WAEC/JAMB.`,
        `Be clear, use relatable examples, and break down complex topics step-by-step.`,
        `Keep responses focused and under 200 words unless solving a multi-step problem.`,
        `Use • for bullet points. Never use markdown headers.`,
        ``,
        `Recent conversation:`,
        history,
        ``,
        `Student: ${userMsg}`,
        `Tutor:`,
      ].join("\n");

      const text = await callGemini(prompt);
      setMessages((p) => [...p, { role: "ai", text }]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "ai", text: "Sorry, I couldn't connect right now. Please try again in a moment." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── Status badge content ────────────────────────────────────────────────────
  const statusBadge = () => {
    if (subjectsLoading) return null;
    if (subjectsFetchState === "firebase") return (
      <p className="text-xs text-teal-600 font-semibold flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> {subjects.length} enrolled subjects loaded
      </p>
    );
    if (subjectsFetchState === "error") return (
      <button onClick={loadSubjects} className="text-xs text-amber-600 font-semibold flex items-center gap-1 hover:text-amber-700 transition-colors">
        <RefreshCw className="w-3 h-3" /> Retry loading subjects
      </button>
    );
    // "default" — silently show nothing extra, defaults are usable
    return null;
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">AI Tutor</h2>
          <p className="text-slate-500 text-sm font-medium">
            Ask anything — get step-by-step explanations, 24/7.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <SubjectDropdown
            value={subject}
            onChange={handleSubjectChange}
            subjects={subjects}
            loading={subjectsLoading}
          />
          {statusBadge()}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div
        className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col"
        style={{ height: "560px" }}
      >
        {/* Chat header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-white text-sm">EduBoost AI Tutor</p>
            <p className="text-slate-400 text-xs font-medium truncate">
              {subjectsLoading ? "Loading your subjects…" : `Currently: ${subject}`}
            </p>
          </div>
          <span className="flex items-center gap-1.5 bg-teal-500/20 border border-teal-500/30 rounded-full px-3 py-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-xs font-black">Online</span>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-amber-50/30">

          {/* Loading shimmer while subjects load */}
          {subjectsLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-slate-200 rounded-full animate-pulse w-3/4" />
                <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          )}

          {!subjectsLoading && messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                  ${m.role === "ai" ? "bg-orange-500 text-white" : "bg-slate-700 text-white"}`}
              >
                {m.role === "ai" ? "AI" : "A"}
              </div>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium whitespace-pre-line
                  ${m.role === "ai"
                    ? "bg-white border-2 border-slate-200 text-slate-700 rounded-tl-sm"
                    : "bg-slate-900 text-white rounded-tr-sm"
                  }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                AI
              </div>
              <div className="bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((d, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t-2 border-slate-200 bg-white px-4 py-3 flex gap-3 items-end flex-shrink-0">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={
              subjectsLoading
                ? "Loading your subjects…"
                : `Ask about ${subject}… (Enter to send, Shift+Enter for new line)`
            }
            disabled={subjectsLoading}
            rows={1}
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-slate-50 font-body disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending || subjectsLoading}
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Quick prompts ── */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Prompts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              disabled={subjectsLoading}
              className="text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-orange-300 hover:text-orange-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}