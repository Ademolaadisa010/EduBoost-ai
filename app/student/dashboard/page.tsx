"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, HelpCircle, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore";

interface UserProfile {
  fullName:   string;
  email:      string;
  role:       string;
  classLevel?: string;
  subjects?:  string[];
}

interface ActivityItem {
  icon:   string;
  iconBg: string;
  text:   string;
  time:   string;
  ts:     number;
}

interface Stats {
  notes:    number;
  quizzes:  number;
  studyMin: number;
  mentors:  number;
  streak:   number;
}

const SUBJECT_COLORS = [
  { color: "bg-orange-500", text: "text-orange-700" },
  { color: "bg-teal-500",   text: "text-teal-700" },
  { color: "bg-violet-500", text: "text-violet-700" },
  { color: "bg-rose-500",   text: "text-rose-700" },
  { color: "bg-amber-500",  text: "text-amber-700" },
  { color: "bg-blue-500",   text: "text-blue-700" },
  { color: "bg-emerald-500",text: "text-emerald-700" },
  { color: "bg-pink-500",   text: "text-pink-700" },
];

const QUICK_ACTIONS = [
  { icon: "✨", label: "Summarise", href: "/student/study",   color: "bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-700" },
  { icon: "📝", label: "Gen Quiz",  href: "/student/quiz",    color: "bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-700" },
  { icon: "🧠", label: "Explain",   href: "/student/study",   color: "bg-violet-50 border-violet-200 hover:border-violet-400 text-violet-700" },
  { icon: "👥", label: "Groups",    href: "/student/groups",  color: "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700" },
  { icon: "🧑‍🏫", label: "Mentors", href: "/student/mentors", color: "bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 🌤️";
  if (h < 17) return "Good afternoon ☀️";
  return "Good evening 🌙";
}

function firstName(name: string) {
  return name?.split(" ")[0] || "there";
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 2)  return "Just now";
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  if (day === 1) return "Yesterday";
  return `${day} days ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [uid,      setUid]      = useState<string | null>(null);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [stats,    setStats]    = useState<Stats>({ notes: 0, quizzes: 0, studyMin: 0, mentors: 0, streak: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Step 1: Auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/Login"); return; }
      if (!user.emailVerified) { await auth.signOut(); router.replace("/Login"); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({ fullName: user.displayName ?? "Student", email: user.email ?? "", role: "student" });
        }
      } catch {
        setProfile({ fullName: user.displayName ?? "Student", email: user.email ?? "", role: "student" });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // ── Step 2: Load stats + activity once uid is known ─────────────────────────
  useEffect(() => {
    if (!uid) return;

    async function loadDashboard() {
      setStatsLoading(true);
      const activityItems: ActivityItem[] = [];

      try {
        // ── Notes uploaded ────────────────────────────────────────────────────
        const notesSnap = await getDocs(
          collection(db, "users", uid!, "notes")
        );
        const notesCount = notesSnap.size;
        notesSnap.docs.forEach((d) => {
          const data = d.data();
          activityItems.push({
            icon:   "📄",
            iconBg: "bg-orange-100",
            text:   `Uploaded "${data.fileName ?? "a file"}" for study`,
            ts:     data.uploadedAt ? new Date(data.uploadedAt).getTime() : Date.now(),
            time:   "",
          });
        });

        // ── Quiz sessions ─────────────────────────────────────────────────────
        let quizCount = 0;
        let totalStudyMin = 0;
        try {
          const quizSnap = await getDocs(
            query(
              collection(db, "users", uid!, "quizSessions"),
              orderBy("completedAt", "desc"),
              limit(20)
            )
          );
          quizCount = quizSnap.size;
          quizSnap.docs.forEach((d) => {
            const data = d.data();
            const ts   = data.completedAt?.toMillis?.() ?? data.completedAt ?? Date.now();
            const dur  = data.durationMinutes ?? 0;
            totalStudyMin += dur;
            activityItems.push({
              icon:   "✅",
              iconBg: "bg-teal-100",
              text:   `Completed ${data.subject ?? ""} quiz — ${data.score ?? 0}/${data.total ?? 0} correct`,
              ts,
              time:   "",
            });
          });
        } catch { /* quizSessions collection may not exist yet */ }

        // ── Group messages (recent) ───────────────────────────────────────────
        try {
          // Find groups user is in, then get their recent messages
          const groupsSnap = await getDocs(
            query(collection(db, "groups"), where("members", "array-contains-any",
              [{ uid, displayName: profile?.fullName ?? "", role: "admin",  joinedAt: 0 },
               { uid, displayName: profile?.fullName ?? "", role: "member", joinedAt: 0 }]
            ))
          );
          // Simpler: just check all groups the user's uid appears in via adminUid
          const adminGroupsSnap = await getDocs(
            query(collection(db, "groups"), where("adminUid", "==", uid), limit(5))
          );
          adminGroupsSnap.docs.forEach((d) => {
            const data = d.data();
            activityItems.push({
              icon:   "💬",
              iconBg: "bg-violet-100",
              text:   `Active in group "${data.name}"`,
              ts:     data.createdAt ?? Date.now(),
              time:   "",
            });
          });
        } catch { /* groups may not exist */ }

        // ── Mentor sessions ───────────────────────────────────────────────────
        let mentorCount = 0;
        try {
          const mentorSnap = await getDocs(
            query(
              collection(db, "users", uid!, "mentorSessions"),
              orderBy("bookedAt", "desc"),
              limit(10)
            )
          );
          mentorCount = mentorSnap.size;
          mentorSnap.docs.forEach((d) => {
            const data = d.data();
            const ts   = data.bookedAt?.toMillis?.() ?? data.bookedAt ?? Date.now();
            activityItems.push({
              icon:   "🧑‍🏫",
              iconBg: "bg-rose-100",
              text:   `Mentor session booked${data.mentorName ? ` with ${data.mentorName}` : ""}`,
              ts,
              time:   "",
            });
          });
        } catch { /* mentorSessions may not exist */ }

        // ── Streak from user doc ──────────────────────────────────────────────
        const userSnap = await getDoc(doc(db, "users", uid!));
        const streak   = userSnap.data()?.streak ?? 0;

        // ── Sort activity by newest first, add timeAgo labels ────────────────
        const sorted = activityItems
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 8)
          .map((a) => ({ ...a, time: timeAgo(a.ts) }));

        setStats({
          notes:    notesCount,
          quizzes:  quizCount,
          studyMin: totalStudyMin,
          mentors:  mentorCount,
          streak,
        });
        setActivity(sorted);
      } catch (e) {
        console.error("[dashboard] load error:", e);
      } finally {
        setStatsLoading(false);
      }
    }

    loadDashboard();
  }, [uid, profile?.fullName]);

  const subjects    = profile?.subjects ?? [];
  const hasSubjects = subjects.length > 0;
  const hasClass    = !!profile?.classLevel;
  const studyHours  = stats.studyMin > 0 ? `${Math.round(stats.studyMin / 60 * 10) / 10}h` : "0h";

  const subjectRows = subjects.map((name, i) => ({
    name,
    progress: 0,
    ...SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="relative rounded-3xl bg-slate-900 p-7 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-orange-500 opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-teal-500 opacity-10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">{getGreeting()}</p>
            <h2 className="font-display font-black text-white text-2xl sm:text-3xl mb-1">
              {loading
                ? <Skeleton className="h-8 w-52 inline-block" />
                : <>Welcome back, <em className="not-italic text-orange-400">{firstName(profile?.fullName ?? "")}!</em></>
              }
            </h2>
            {loading ? (
              <Skeleton className="h-4 w-48 mt-2" />
            ) : (
              <p className="text-slate-400 text-sm font-medium">
                {hasClass ? `${profile!.classLevel} · ` : ""}
                {hasSubjects
                  ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} tracked`
                  : "Set up your profile to track subjects"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-2xl px-4 py-3 text-center">
              <p className="font-display font-black text-orange-400 text-2xl">
                {statsLoading ? "…" : stats.streak}
              </p>
              <p className="text-orange-300/80 text-xs font-bold uppercase tracking-widest">Day Streak</p>
            </div>
            <div className="bg-teal-500/20 border border-teal-500/30 rounded-2xl px-4 py-3 text-center">
              <p className="font-display font-black text-teal-400 text-2xl">
                {loading ? "…" : subjects.length}
              </p>
              <p className="text-teal-300/80 text-xs font-bold uppercase tracking-widest">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile incomplete nudge ── */}
      {!loading && (!hasClass || !hasSubjects) && (
        <Link href="/student/profile">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-amber-400 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-slate-800 text-sm font-black">Complete your profile</p>
              <p className="text-slate-500 text-xs font-medium">
                {!hasClass && !hasSubjects
                  ? "Add your class level and subjects to unlock subject tracking."
                  : !hasClass
                  ? "Add your class level so the platform knows what to show you."
                  : "Add your subjects to start tracking progress per subject."}
              </p>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full flex-shrink-0">
              Set up →
            </span>
          </div>
        </Link>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
          : [
              { label: "Notes Uploaded",  value: stats.notes,    sub: stats.notes   === 0 ? "Use Study Assistant" : `${stats.notes} file${stats.notes !== 1 ? "s" : ""}`,   icon: <FileText className="w-5 h-5" />,    color: "text-orange-600", bg: "bg-orange-100" },
              { label: "Quizzes Taken",   value: stats.quizzes,  sub: stats.quizzes === 0 ? "Try Practice Quiz"   : `${stats.quizzes} session${stats.quizzes !== 1 ? "s" : ""}`, icon: <HelpCircle className="w-5 h-5" />,  color: "text-teal-600",   bg: "bg-teal-100" },
              { label: "Study Hours",     value: studyHours,     sub: "From quiz sessions",                                                                                       icon: <Clock className="w-5 h-5" />,       color: "text-violet-600", bg: "bg-violet-100" },
              { label: "Mentor Sessions", value: stats.mentors,  sub: stats.mentors === 0 ? "Browse mentors"      : `${stats.mentors} booked`,                                   icon: <ShieldCheck className="w-5 h-5" />, color: "text-rose-600",   bg: "bg-rose-100" },
            ].map((s) => (
              <div key={s.label} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`font-display font-black text-3xl ${s.color} mb-0.5`}>{s.value}</p>
                <p className="text-slate-400 text-xs font-semibold">{s.sub}</p>
              </div>
            ))
        }
      </div>

      {/* ── Subject progress + activity ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Subject Progress</h3>
            {hasSubjects && (
              <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
                {subjects.length} active
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : hasSubjects ? (
            <div className="space-y-4">
              {subjectRows.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                    <span className={`text-xs font-black ${s.text}`}>
                      {s.progress > 0 ? `${s.progress}%` : "No quizzes yet"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color} transition-all duration-700`}
                      style={{ width: s.progress > 0 ? `${s.progress}%` : "3px" }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 font-medium pt-1">
                Progress fills as you complete quizzes per subject.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-3">📚</div>
              <p className="text-slate-700 font-bold text-sm mb-1">No subjects yet</p>
              <p className="text-slate-400 text-xs font-medium mb-4 max-w-xs">
                Add your subjects in your profile and they will appear here with progress tracking.
              </p>
              <Link href="/student/profile" className="text-xs font-black text-orange-600 bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-xl transition-colors">
                Add subjects →
              </Link>
            </div>
          )}
        </div>

        {/* ── Activity feed ── */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Recent Activity</h3>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center text-base flex-shrink-0`}>{a.icon}</div>
                  <p className="text-slate-700 text-sm font-semibold flex-1 truncate">{a.text}</p>
                  <span className="text-slate-400 text-xs font-semibold flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-3">🕐</div>
              <p className="text-slate-700 font-bold text-sm mb-1">No activity yet</p>
              <p className="text-slate-400 text-xs font-medium max-w-xs">
                Start by uploading notes, taking a quiz, or joining a study group.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h3 className="font-display font-bold text-slate-900 text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} href={a.href} className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${a.color}`}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-black">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}