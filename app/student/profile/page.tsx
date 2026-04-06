"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Save, Plus, X, BookOpen, GraduationCap, User, Phone, Mail } from "lucide-react";

// ── Class levels ──────────────────────────────────────────────────────────────
const CLASS_LEVELS = [
  // Primary
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  // Junior Secondary
  "JSS 1", "JSS 2", "JSS 3",
  // Senior Secondary
  "SS 1", "SS 2", "SS 3",
  // University / Tertiary
  "100 Level", "200 Level", "300 Level", "400 Level", "500 Level",
  // Others
  "A-Level / IJMB", "JUPEB", "NCE Year 1", "NCE Year 2", "NCE Year 3", "Other",
];

// ── Suggested subjects by class group ────────────────────────────────────────
const SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  primary: ["English Language", "Mathematics", "Basic Science", "Social Studies", "Civic Education", "Creative Arts", "Yoruba / Igbo / Hausa"],
  jss: ["English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "Business Studies", "Agricultural Science", "French", "Yoruba / Igbo / Hausa", "Physical & Health Education", "Computer Studies", "Fine Arts", "Home Economics"],
  ss: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Geography", "Economics", "Government", "Commerce", "Agricultural Science", "Further Mathematics", "Literature in English", "CRS / IRS", "French", "Accounting", "Computer Studies", "Technical Drawing", "Food & Nutrition"],
  university: ["General Studies (GST)", "Mathematics", "Statistics", "Physics", "Chemistry", "Biology", "Economics", "Accounting", "Law", "Medicine", "Engineering", "Computer Science", "Business Administration", "Political Science", "Sociology", "Psychology", "Literature", "History"],
};

function getSuggestions(classLevel: string): string[] {
  if (!classLevel) return SUBJECT_SUGGESTIONS.ss;
  const lower = classLevel.toLowerCase();
  if (lower.includes("primary")) return SUBJECT_SUGGESTIONS.primary;
  if (lower.includes("jss")) return SUBJECT_SUGGESTIONS.jss;
  if (lower.includes("ss") || lower.includes("a-level") || lower.includes("jupeb")) return SUBJECT_SUGGESTIONS.ss;
  if (lower.includes("level") || lower.includes("nce")) return SUBJECT_SUGGESTIONS.university;
  return SUBJECT_SUGGESTIONS.ss;
}

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  classLevel: string;
  subjects: string[];
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "", email: "", phone: "", role: "student",
    classLevel: "", subjects: [],
  });

  const [customSubject, setCustomSubject] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/Login"); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            fullName: data.fullName ?? "",
            email: data.email ?? user.email ?? "",
            phone: data.phone ?? "",
            role: data.role ?? "student",
            classLevel: data.classLevel ?? "",
            subjects: data.subjects ?? [],
          });
        }
      } catch (err) {
        console.error("[profile] load error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const toggleSubject = (subject: string) => {
    setProfile((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed || profile.subjects.includes(trimmed)) {
      setCustomSubject("");
      return;
    }
    setProfile((prev) => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    setCustomSubject("");
  };

  const removeSubject = (subject: string) => {
    setProfile((prev) => ({ ...prev, subjects: prev.subjects.filter((s) => s !== subject) }));
  };

  const handleSave = async () => {
    if (!uid) return;
    if (!profile.fullName.trim()) { toast.error("Full name is required."); return; }
    if (!profile.classLevel) { toast.error("Please select your class level."); return; }
    if (profile.subjects.length === 0) { toast.error("Please add at least one subject."); return; }

    setSaving(true);
    const toastId = toast.loading("Saving profile…");
    try {
      await updateDoc(doc(db, "users", uid), {
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        classLevel: profile.classLevel,
        subjects: profile.subjects,
      });
      toast.success("Profile saved! ✓", { id: toastId });
    } catch (err) {
      console.error("[profile] save error:", err);
      toast.error("Could not save. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const suggestions = getSuggestions(profile.classLevel);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500 opacity-10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-2xl shrink-0">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h2 className="font-display font-black text-white text-xl">
              {loading ? "Loading…" : profile.fullName || "Complete your profile"}
            </h2>
            <p className="text-slate-400 text-sm font-medium">{profile.email}</p>
            {profile.classLevel && (
              <span className="inline-block mt-1 text-xs font-black text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-full">
                {profile.classLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
            <User className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="font-display font-bold text-slate-900 text-base">Personal Information</h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400 font-medium">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+234 801 234 5678"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Class Level ── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base">Class / Level</h3>
            <p className="text-xs text-slate-400 font-medium">This shows your class across the platform</p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <select
            value={profile.classLevel}
            onChange={(e) => {
              setProfile((p) => ({ ...p, classLevel: e.target.value, subjects: [] }));
            }}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 appearance-none cursor-pointer"
          >
            <option value="">— Select your class level —</option>
            <optgroup label="Primary School">
              {CLASS_LEVELS.slice(0, 6).map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Junior Secondary (JSS)">
              {CLASS_LEVELS.slice(6, 9).map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Senior Secondary (SS)">
              {CLASS_LEVELS.slice(9, 12).map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="University / Tertiary">
              {CLASS_LEVELS.slice(12, 17).map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Other">
              {CLASS_LEVELS.slice(17).map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        )}
      </div>

      {/* ── Subjects ── */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base">My Subjects</h3>
            <p className="text-xs text-slate-400 font-medium">These appear on your dashboard progress tracker</p>
          </div>
        </div>

        {/* Selected subjects */}
        {profile.subjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 mt-4">
            {profile.subjects.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 border border-orange-200 text-xs font-black px-3 py-1.5 rounded-full">
                {s}
                <button onClick={() => removeSubject(s)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
          </div>
        ) : (
          <>
            {/* Suggested subjects */}
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 mt-4">
              {profile.classLevel ? `Suggested for ${profile.classLevel}` : "Suggested subjects"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const selected = profile.subjects.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all ${
                      selected
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {selected ? "✓ " : ""}{s}
                  </button>
                );
              })}
            </div>

            {/* Custom subject input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSubject()}
                placeholder="Add a custom subject…"
                className="flex-1 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
              <button
                onClick={addCustomSubject}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black px-4 py-2.5 rounded-2xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Save button ── */}
      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </div>
  );
}