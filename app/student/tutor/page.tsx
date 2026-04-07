"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, ChevronDown, Loader2, BookOpen, RefreshCw } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "ai" | "user";
  text: string;
}

// ─── Gemini API call via your /api/claude route ───────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ─── Fetch subjects — mirrors exactly what profile page saves ─────────────────
// Profile page saves to: doc(db, "users", uid)  →  field: subjects (string[])
async function fetchSubjectsForUser(uid: string): Promise<string[]> {
  // Primary path — top-level user doc (matches profile page's updateDoc target)
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists()) {
    const d = userSnap.data();
    if (Array.isArray(d?.subjects) && d.subjects.length > 0) {
      return d.subjects as string[];
    }
  }
  return [];
}

// ─── Fetch display name from profile ─────────────────────────────────────────
// Profile page saves fullName to: doc(db, "users", uid) → field: fullName
async function fetchDisplayName(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const d = snap.data();
    return (d?.fullName as string | undefined)?.trim() || "";
  }
  return "";
}

// ─── Default subjects (fallback when none saved in Firestore) ─────────────────
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

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Explain this topic simply",
  "Give me a step-by-step example",
  "What are common exam mistakes?",
  "Create a practice question for me",
  "Summarise the key formulas",
];

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Subject dropdown ─────────────────────────────────────────────────────────
function SubjectDropdown({
  value, onChange, subjects, loading,
}: {
  value: string;
  onChange: (v: string) => void;
  subjects: string[];
  loading: boolean;
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function TutorPage() {
  const router = useRouter();

  // ── Auth + profile ──────────────────────────────────────────────────────────
  const [uid,         setUid]         = useState<string | null>(null);
  const [firstName,   setFirstName]   = useState("there");   // used in greeting
  const [authReady,   setAuthReady]   = useState(false);     // true once onAuthStateChanged fires

  // ── Subjects ────────────────────────────────────────────────────────────────
  const [subjects,         setSubjects]         = useState<string[]>(DEFAULT_SUBJECTS);
  const [subject,          setSubject]          = useState("Mathematics");
  const [subjectsLoading,  setSubjectsLoading]  = useState(true);
  const [fetchState,       setFetchState]       = useState<"idle" | "loaded" | "default" | "error">("idle");

  // ── Chat ────────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  // ── Step 1: listen for Firebase Auth state ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Not logged in → redirect to login
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  // ── Step 2: once auth is ready, load profile + subjects ────────────────────
  useEffect(() => {
    if (!authReady || !uid) return;

    let cancelled = false;

    async function loadProfile() {
      setSubjectsLoading(true);
      setFetchState("idle");

      try {
        // Load display name and subjects in parallel
        const [name, fetched] = await Promise.all([
          fetchDisplayName(uid!),
          fetchSubjectsForUser(uid!),
        ]);

        if (cancelled) return;

        // Set first name for the greeting
        if (name) {
          setFirstName(name.split(" ")[0]);
        }

        // Set subjects
        if (fetched.length > 0) {
          setSubjects(fetched);
          setSubject(fetched[0]);
          setFetchState("loaded");
        } else {
          setSubjects(DEFAULT_SUBJECTS);
          setSubject(DEFAULT_SUBJECTS[0]);
          setFetchState("default");
        }

        // Now build the initial greeting using the real name + first subject
        const greetingName  = name ? name.split(" ")[0] : "there";
        const firstSubject  = fetched.length > 0 ? fetched[0] : DEFAULT_SUBJECTS[0];

        setMessages([
          {
            role: "ai",
            text: `Hi ${greetingName}! 👋 I'm your AI tutor. I can explain concepts, solve problems step-by-step, or help you practise for exams.\n\nI can see you're studying ${firstSubject} — want to start there, or pick a different subject from the dropdown above?`,
          },
        ]);
      } catch (err) {
        if (cancelled) return;
        console.error("[tutor] profile load error:", err);
        setSubjects(DEFAULT_SUBJECTS);
        setSubject(DEFAULT_SUBJECTS[0]);
        setFetchState("error");
        setMessages([
          {
            role: "ai",
            text: "Hi! 👋 I'm your AI tutor. I couldn't load your profile right now, but you can still ask me anything. Pick a subject from the dropdown above to get started.",
          },
        ]);
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [authReady, uid]);

  // ── Handle subject switch ───────────────────────────────────────────────────
  const handleSubjectChange = (newSubject: string) => {
    if (newSubject === subject) return;
    setSubject(newSubject);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: `Switched to ${newSubject}! 📚 What would you like to work on? I can explain concepts, solve problems step-by-step, or create practice questions for you.`,
      },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ── Retry subjects ──────────────────────────────────────────────────────────
  const retrySubjects = async () => {
    if (!uid) return;
    setSubjectsLoading(true);
    setFetchState("idle");
    try {
      const fetched = await fetchSubjectsForUser(uid);
      if (fetched.length > 0) {
        setSubjects(fetched);
        setSubject(fetched[0]);
        setFetchState("loaded");
      } else {
        setFetchState("default");
      }
    } catch {
      setFetchState("error");
    } finally {
      setSubjectsLoading(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || sending || subjectsLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setSending(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const history = messages
        .slice(-10)
        .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`)
        .join("\n");

      const prompt = [
        `You are a friendly, encouraging AI tutor for a Nigerian secondary school student named ${firstName}, studying ${subject} for WAEC/JAMB.`,
        `Be clear, use relatable Nigerian examples where helpful, and break down complex topics step-by-step.`,
        `Keep responses focused and under 200 words unless solving a multi-step problem that requires more.`,
        `Use • for bullet points. Never use markdown headers or asterisks for bold.`,
        ``,
        `Recent conversation:`,
        history,
        ``,
        `Student: ${userMsg}`,
        `Tutor:`,
      ].join("\n");

      const text = await callGemini(prompt);
      setMessages((prev) => [...prev, { role: "ai", text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't connect right now. Please try again in a moment." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusBadge = () => {
    if (subjectsLoading) return null;
    if (fetchState === "loaded") return (
      <p className="text-xs text-teal-600 font-semibold flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> {subjects.length} subjects from your profile
      </p>
    );
    if (fetchState === "default") return (
      <p className="text-xs text-slate-400 font-semibold">
        Using default subjects —{" "}
        <a href="/student/profile" className="text-orange-500 hover:underline font-black">add yours in Profile</a>
      </p>
    );
    if (fetchState === "error") return (
      <button onClick={retrySubjects} className="text-xs text-amber-600 font-semibold flex items-center gap-1 hover:text-amber-700 transition-colors">
        <RefreshCw className="w-3 h-3" /> Retry loading subjects
      </button>
    );
    return null;
  };

  // ── Auth loading gate ────────────────────────────────────────────────────────
  // Show nothing while waiting for Firebase Auth to resolve
  if (!authReady) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-semibold text-sm">Loading your profile…</span>
      </div>
    );
  }

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

        <div className="flex flex-col items-start sm:items-end gap-1.5">
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

          {/* Skeleton while loading */}
          {subjectsLoading && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-slate-200 rounded-full animate-pulse w-3/4" />
                  <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-1/2" />
                  <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {!subjectsLoading && messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                  ${m.role === "ai" ? "bg-orange-500 text-white" : "bg-slate-700 text-white"}`}
              >
                {m.role === "ai" ? "AI" : firstName.charAt(0).toUpperCase()}
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
                ? "Loading your profile…"
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