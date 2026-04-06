"use client";

import { useState, useRef, useCallback } from "react";
import {
  BookOpen, HelpCircle, Lightbulb, Upload, RotateCcw,
  AlertCircle, ChevronRight, Sparkles, ArrowRight,
  CheckCircle2, MinusCircle, FileText, X, CloudUpload,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

type StudyMode = "summary" | "questions" | "explain";
type GradeResult = "correct" | "partial" | "incorrect" | null;

interface Question { question: string; answer: string; }
interface QuestionState {
  userAnswer: string; grade: GradeResult;
  feedback: string; loading: boolean; submitted: boolean;
}
interface UploadedFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  signedUrl: string;
  extractedText: string | null;
}

const SAMPLE_NOTE = `The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration — three stages: glycolysis, the Krebs cycle, and the electron transport chain. Oxygen is required for aerobic respiration, producing 36–38 ATP per glucose.

Mitochondria have a double-membrane structure with a highly folded inner membrane called cristae, increasing surface area for ATP production. They contain their own DNA, supporting the endosymbiotic theory.

Key functions: calcium signalling, heat production, and apoptosis (programmed cell death).`;

const MODES = [
  { key: "summary"   as StudyMode, icon: <BookOpen className="w-5 h-5" />,   label: "Summarise Notes",    desc: "Key bullet points from your notes",  activeBorder: "border-orange-400", activeBg: "bg-orange-50", activeText: "text-orange-600" },
  { key: "questions" as StudyMode, icon: <HelpCircle className="w-5 h-5" />, label: "Practice Questions", desc: "AI-generated questions + grading",    activeBorder: "border-teal-400",   activeBg: "bg-teal-50",   activeText: "text-teal-700"   },
  { key: "explain"   as StudyMode, icon: <Lightbulb className="w-5 h-5" />,  label: "Explain Simply",     desc: "Plain-language breakdown",            activeBorder: "border-violet-400", activeBg: "bg-violet-50", activeText: "text-violet-700" },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function parseQuestions(text: string): Question[] {
  const parts = text.split(/---ANSWERS---|---answers---/);
  const qLines = (parts[0] || "").split("\n").filter((l) => /^Q\d+[:.]/i.test(l.trim()));
  const aLines = (parts[1] || "").split("\n").filter((l) => /^A\d+[:.]/i.test(l.trim()));
  return qLines.map((q, i) => ({
    question: q.replace(/^Q\d+[:.]\s*/i, "").trim(),
    answer: (aLines[i] || "").replace(/^A\d+[:.]\s*/i, "").trim(),
  }));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type === "application/pdf") return "📄";
  if (type === "text/plain") return "📝";
  if (type.includes("word")) return "📘";
  if (type.includes("presentation")) return "📊";
  return "📁";
}

async function callGemini(prompt: string, fileContent?: string, fileName?: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, fileContent, fileName }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export default function StudyPage() {
  const [notes, setNotes]               = useState("");
  const [activeMode, setActiveMode]     = useState<StudyMode | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [summaryText, setSummaryText]   = useState("");
  const [explainText, setExplainText]   = useState("");
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [qStates, setQStates]           = useState<QuestionState[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const resultRef                       = useRef<HTMLDivElement>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const hasResult = summaryText || explainText || questions.length > 0;

  // Source of truth for AI: uploaded file text OR pasted notes
  const activeNotes = uploadedFile?.extractedText || notes;
  const activeFileName = uploadedFile?.fileName;

  const clearAll = () => {
    setNotes(""); setSummaryText(""); setExplainText("");
    setQuestions([]); setQStates([]); setActiveMode(null); setError("");
    setUploadedFile(null);
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Use PDF, TXT, DOCX, or PPTX.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max 50MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}…`);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please sign in to upload files.", { id: toastId });
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.", { id: toastId });
        return;
      }

      setUploadedFile({
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: file.size,
        signedUrl: data.signedUrl,
        extractedText: data.extractedText,
      });

      // Clear pasted notes when file uploaded
      setNotes("");
      setSummaryText(""); setExplainText(""); setQuestions([]); setQStates([]);
      setActiveMode(null); setError("");

      if (data.extractedText) {
        toast.success(`${file.name} uploaded and ready!`, { id: toastId });
      } else {
        toast.success(`${file.name} uploaded! For PDF/DOCX, paste the text content too for best results.`, { id: toastId, duration: 6000 });
      }
    } catch {
      toast.error("Upload failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  // ── Generate AI response ──────────────────────────────────────────────────
  const generate = async (mode: StudyMode) => {
    const source = activeNotes.trim();
    if (!source) {
      setError(uploadedFile ? "File uploaded but no text could be extracted. Please paste the content below." : "Paste your notes first — or upload a file.");
      return;
    }
    if (source.length < 50) {
      setError("Notes too short. Paste at least a paragraph.");
      return;
    }

    setError(""); setLoading(true); setActiveMode(mode);
    setSummaryText(""); setExplainText(""); setQuestions([]); setQStates([]);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    const prompts: Record<StudyMode, string> = {
      summary:   `You are a study assistant. Summarise these notes:\n- One-sentence overview at top\n- 5-8 bullet points (use •) with key concepts\n- Bold (**text**) important terms\n\nNotes:\n${source}`,
      questions: `Generate exactly 3 practice questions from these notes.\nFormat:\nQ1: [question]\nQ2: [question]\nQ3: [question]\n---ANSWERS---\nA1: [2-3 sentence answer]\nA2: [2-3 sentence answer]\nA3: [2-3 sentence answer]\n\nNotes:\n${source}`,
      explain:   `Explain these notes in simple language for a 15-year-old. Use analogies, short paragraphs, no jargon. Define technical terms.\n\nNotes:\n${source}`,
    };

    try {
      // Pass file metadata to Gemini for better context
      const text = await callGemini(prompts[mode], uploadedFile?.extractedText ?? undefined, activeFileName);
      if (mode === "summary") setSummaryText(text);
      else if (mode === "explain") setExplainText(text);
      else {
        const p = parseQuestions(text);
        setQuestions(p);
        setQStates(p.map(() => ({ userAnswer: "", grade: null, feedback: "", loading: false, submitted: false })));
      }
    } catch {
      setError("AI connection failed. Please try again.");
      setActiveMode(null);
    } finally {
      setLoading(false);
    }
  };

  const gradeAnswer = async (idx: number) => {
    if (!qStates[idx].userAnswer.trim()) return;
    setQStates((p) => p.map((s, i) => i === idx ? { ...s, loading: true } : s));
    try {
      const text = await callGemini(
        `Grade this student answer.\nQuestion: ${questions[idx].question}\nExpected: ${questions[idx].answer}\nStudent: ${qStates[idx].userAnswer}\n\nRespond EXACTLY:\nVERDICT: [CORRECT / PARTIAL / INCORRECT]\nFEEDBACK: [2-3 constructive sentences]`
      );
      const verdictMatch  = text.match(/VERDICT:\s*(CORRECT|PARTIAL|INCORRECT)/i);
      const feedbackMatch = text.match(/FEEDBACK:\s*([\s\S]+)/i);
      const grade    = (verdictMatch?.[1].toLowerCase() ?? "incorrect") as GradeResult;
      const feedback = feedbackMatch?.[1].trim() ?? text;
      setQStates((p) => p.map((s, i) => i === idx ? { ...s, grade, feedback, loading: false, submitted: true } : s));
    } catch {
      setQStates((p) => p.map((s, i) => i === idx ? { ...s, loading: false, feedback: "Could not grade. Try again." } : s));
    }
  };

  const gradeConfig = {
    correct:   { border: "border-teal-300 bg-teal-50/40",   icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,  label: "Correct!",          labelColor: "text-teal-700"  },
    partial:   { border: "border-amber-300 bg-amber-50/40", icon: <MinusCircle className="w-4 h-4 text-amber-600" />,  label: "Partially Correct", labelColor: "text-amber-700" },
    incorrect: { border: "border-red-300 bg-red-50/40",     icon: <AlertCircle className="w-4 h-4 text-red-500" />,    label: "Needs Improvement", labelColor: "text-red-600"   },
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Study Assistant</h2>
        <p className="text-slate-500 text-sm font-medium">Upload a file or paste your notes — Gemini AI does the rest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Upload zone */}
          {!uploadedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`bg-white border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all group
                ${dragOver ? "border-orange-500 bg-orange-50 scale-[1.01]" : "border-slate-300 hover:border-orange-400"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.pptx"
                onChange={onFileInput}
                className="hidden"
              />
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? "bg-orange-200" : "bg-orange-100 group-hover:bg-orange-200"}`}>
                {uploading
                  ? <Spinner className="w-6 h-6 text-orange-600" />
                  : <CloudUpload className="w-6 h-6 text-orange-600" />
                }
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-slate-700 text-sm">
                  {uploading ? "Uploading…" : dragOver ? "Drop it!" : "Drop file or click to upload"}
                </p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">PDF · TXT · DOCX · PPTX — up to 50MB</p>
              </div>
            </div>
          ) : (
            /* Uploaded file card */
            <div className="bg-white border-2 border-teal-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-xl flex-shrink-0">
                  {fileIcon(uploadedFile.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-black truncate">{uploadedFile.fileName}</p>
                  <p className="text-slate-400 text-xs font-semibold">{formatFileSize(uploadedFile.fileSize)} · Saved to cloud ✓</p>
                </div>
                <button
                  onClick={() => { setUploadedFile(null); setNotes(""); clearAll(); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {!uploadedFile.extractedText && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-xs font-medium">
                    PDF/DOCX text extraction coming soon. Paste the text below for AI to read it.
                  </p>
                </div>
              )}
              {uploadedFile.extractedText && (
                <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <p className="text-teal-700 text-xs font-bold">Text extracted — ready for AI analysis</p>
                </div>
              )}
              {/* Allow re-upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full text-xs font-black text-slate-500 hover:text-orange-600 transition-colors text-center"
              >
                Upload a different file
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.pptx" onChange={onFileInput} className="hidden" />
            </div>
          )}

          {/* Paste area */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {uploadedFile && !uploadedFile.extractedText ? "Paste notes (PDF fallback)" : "Or paste notes"}
              </p>
              <div className="flex gap-2">
                {(notes || uploadedFile) && (
                  <button onClick={clearAll} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
                <button
                  onClick={() => { setUploadedFile(null); setNotes(SAMPLE_NOTE); }}
                  className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  Try sample
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={uploadedFile?.extractedText ? "File content loaded — you can also add extra notes here…" : "Paste lecture notes, textbook content…"}
              rows={9}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all bg-slate-50 font-body leading-relaxed"
            />
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-400">
              {uploadedFile?.extractedText
                ? <span className="text-teal-600 flex items-center gap-1"><FileText className="w-3 h-3" /> Using uploaded file content</span>
                : <>
                    <span>{wordCount} words</span>
                    {notes.length >= 50 && <span className="text-teal-600">✓ Good length</span>}
                    {notes.length > 0 && notes.length < 50 && <span className="text-amber-500">⚠ Too short</span>}
                  </>
              }
            </div>
            {error && (
              <div className="mt-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </div>

          {/* Mode buttons */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-2.5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Choose action</p>
            {MODES.map((m) => {
              const isActive = activeMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => generate(m.key)}
                  disabled={loading}
                  className={`w-full text-left border-2 rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                    ${isActive && !loading ? `${m.activeBorder} ${m.activeBg} shadow-sm` : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${isActive ? `${m.activeBg} ${m.activeText}` : "bg-slate-200 text-slate-500"}`}>
                        {m.icon}
                      </div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-sm">{m.label}</p>
                        <p className="text-xs text-slate-500 font-medium">{m.desc}</p>
                      </div>
                    </div>
                    {loading && isActive
                      ? <Spinner />
                      : isActive && hasResult
                        ? <span className={`text-xs font-black px-2 py-0.5 rounded-full ${m.activeBg} ${m.activeText}`}>Done ✓</span>
                        : <ChevronRight className="w-4 h-4 text-slate-300" />
                    }
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right column — results ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Empty state */}
          {!hasResult && !loading && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-2">Ready when you are</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
                Upload a file or paste your notes on the left, then choose an AI action.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Powered by Gemini 2.5 Flash
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div ref={resultRef} className="bg-white border-2 border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-slate-900 text-sm">Gemini is thinking…</p>
                  <p className="text-xs text-slate-400 font-medium">Usually 5–10 seconds</p>
                </div>
              </div>
              <div className="space-y-3">
                {[90, 75, 85, 60, 80].map((w, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Summary result */}
          {!loading && summaryText && activeMode === "summary" && (
            <div ref={resultRef} className="bg-white border-2 border-orange-200 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-white" /></div>
                  <div>
                    <p className="font-display font-bold text-slate-900 text-sm">Summary</p>
                    <p className="text-xs text-slate-400 font-medium">
                      {uploadedFile ? `From: ${uploadedFile.fileName}` : "Key concepts extracted"}
                    </p>
                  </div>
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

          {/* Explain result */}
          {!loading && explainText && activeMode === "explain" && (
            <div ref={resultRef} className="bg-white border-2 border-violet-200 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4 text-white" /></div>
                  <div>
                    <p className="font-display font-bold text-slate-900 text-sm">Simple Explanation</p>
                    <p className="text-xs text-slate-400 font-medium">
                      {uploadedFile ? `From: ${uploadedFile.fileName}` : "Plain language, no jargon"}
                    </p>
                  </div>
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

          {/* Questions result */}
          {!loading && questions.length > 0 && activeMode === "questions" && (
            <div ref={resultRef} className="space-y-4">
              <div className="bg-white border-2 border-teal-200 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0"><HelpCircle className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">Practice Questions</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {questions.length} questions · {uploadedFile ? uploadedFile.fileName : "from your notes"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 px-3 py-1 rounded-full">Quiz Mode</span>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-700 text-xs font-medium">Answer in your own words, then click &quot;Check&quot; for Gemini grading.</p>
                </div>
              </div>

              {questions.map((q, i) => {
                const s = qStates[i];
                const gc = s.grade ? gradeConfig[s.grade] : null;
                return (
                  <div key={i} className={`border-2 rounded-2xl p-5 bg-white transition-all ${s.submitted && s.grade === "correct" ? "border-teal-200" : "border-slate-200"}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-teal-500 text-white text-sm font-black flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed pt-1">{q.question}</p>
                    </div>
                    {(!s.submitted || s.grade !== "correct") && (
                      <>
                        <textarea
                          value={s.userAnswer}
                          onChange={(e) => { const v = e.target.value; setQStates((p) => p.map((x, j) => j === i ? { ...x, userAnswer: v, submitted: false, grade: null, feedback: "" } : x)); }}
                          placeholder="Your answer…" rows={3} disabled={s.loading}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 bg-slate-50 font-body"
                        />
                        <button onClick={() => gradeAnswer(i)} disabled={s.loading || !s.userAnswer.trim()}
                          className="mt-3 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-md shadow-teal-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {s.loading ? <><Spinner />Grading…</> : <>Check answer <ArrowRight className="w-3.5 h-3.5" /></>}
                        </button>
                      </>
                    )}
                    {s.submitted && gc && s.feedback && (
                      <div className={`mt-3 border-2 rounded-xl px-4 py-3 ${gc.border}`}>
                        <div className="flex items-center gap-2 mb-1">{gc.icon}<p className={`font-black text-sm ${gc.labelColor}`}>{gc.label}</p></div>
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