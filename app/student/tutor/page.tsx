"use client";

import { useState, useRef } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

const INITIAL_MESSAGES = [
  { role: "ai", text: "Hi Amara! 👋 I'm your AI tutor. I can explain concepts, solve problems step-by-step, or help you practise for exams. What subject are we working on today?" },
  { role: "user", text: "Can you explain the quadratic formula?" },
  { role: "ai", text: "Of course! The quadratic formula solves any equation of the form ax² + bx + c = 0.\n\nThe formula is: x = (−b ± √(b²−4ac)) / 2a\n\nThe ± means there are usually two solutions. The part under the root — b²−4ac — is called the discriminant:\n• Positive → 2 solutions\n• Zero → 1 solution\n• Negative → no real solutions\n\nWant me to walk through an example problem?" },
];

const QUICK_PROMPTS = [
  "Explain this topic simply",
  "Give me a step-by-step example",
  "What are common exam mistakes?",
  "Create a practice question",
  "Summarise the key formulas",
];

const SUBJECTS = ["Mathematics", "Biology", "Chemistry", "Physics", "English", "Economics", "Further Maths"];

export default function TutorPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [subject, setSubject]   = useState("Mathematics");
  const bottomRef               = useRef<HTMLDivElement>(null);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">AI Tutor</h2>
          <p className="text-slate-500 text-sm font-medium">Ask anything — get step-by-step explanations, 24/7.</p>
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-body w-full sm:w-48"
        >
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Chat window */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: "560px" }}>

        {/* Chat header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
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

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xs font-black shrink-0">AI</div>
              <div className="bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
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
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${subject}… (Enter to send, Shift+Enter for new line)`}
            rows={1}
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-slate-50 font-body"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {loading ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Prompts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              className="text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-orange-300 hover:text-orange-600 px-3 py-1.5 rounded-full transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}