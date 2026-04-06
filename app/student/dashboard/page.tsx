import { FileText, HelpCircle, Clock, ShieldCheck } from "lucide-react";

const SUBJECTS = [
  { name: "Mathematics", progress: 78, color: "bg-orange-500", text: "text-orange-700" },
  { name: "Biology",     progress: 65, color: "bg-teal-500",   text: "text-teal-700" },
  { name: "Chemistry",   progress: 52, color: "bg-violet-500", text: "text-violet-700" },
  { name: "English",     progress: 88, color: "bg-rose-500",   text: "text-rose-700" },
  { name: "Physics",     progress: 44, color: "bg-amber-500",  text: "text-amber-700" },
];

const ACTIVITY = [
  { icon: "📄", iconBg: "bg-orange-100", text: "Chemistry notes summarised",       time: "2h ago" },
  { icon: "✅", iconBg: "bg-teal-100",   text: "Math quiz — scored 90%",           time: "4h ago" },
  { icon: "💬", iconBg: "bg-violet-100", text: "Posted in SS3 Biology group",      time: "Yesterday" },
  { icon: "🧑‍🏫", iconBg: "bg-rose-100", text: "Mentor session with Mr. Okafor",  time: "2 days ago" },
  { icon: "🧠", iconBg: "bg-amber-100",  text: "AI Tutor: Quadratic equations",    time: "2 days ago" },
];

const QUICK_ACTIONS = [
  { icon: "✨", label: "Summarise",  href: "/student/study",   color: "bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-700" },
  { icon: "📝", label: "Gen Quiz",   href: "/student/study",   color: "bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-700" },
  { icon: "🧠", label: "Explain",    href: "/student/study",   color: "bg-violet-50 border-violet-200 hover:border-violet-400 text-violet-700" },
  { icon: "💬", label: "AI Tutor",   href: "/student/tutor",   color: "bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-700" },
  { icon: "👥", label: "Groups",     href: "/student/groups",  color: "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700" },
  { icon: "🧑‍🏫", label: "Mentors", href: "/student/mentors", color: "bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700" },
];

export default function DashboardPage() {
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
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-1">Good morning 🌤️</p>
            <h2 className="font-display font-black text-white text-2xl sm:text-3xl mb-2">
              Welcome back, <em className="not-italic text-orange-400">Amara!</em>
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              You&apos;re on a 7-day streak. Keep it up — WAEC is in 3 months.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Notes Processed", value: "24",  sub: "+3 this week",  icon: <FileText className="w-5 h-5" />,    color: "text-orange-600", bg: "bg-orange-100" },
          { label: "Quizzes Taken",   value: "61",  sub: "82% avg score", icon: <HelpCircle className="w-5 h-5" />,  color: "text-teal-600",   bg: "bg-teal-100" },
          { label: "Study Hours",     value: "38h", sub: "This month",    icon: <Clock className="w-5 h-5" />,       color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Mentor Sessions", value: "5",   sub: "2 upcoming",    icon: <ShieldCheck className="w-5 h-5" />, color: "text-rose-600",   bg: "bg-rose-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`font-display font-black text-3xl ${s.color} mb-0.5`}>{s.value}</p>
            <p className="text-slate-400 text-xs font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Progress + activity ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Subject Progress</h3>
            <span className="text-xs font-black text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full">
              {SUBJECTS.length} active
            </span>
          </div>
          <div className="space-y-4">
            {SUBJECTS.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-700">{s.name}</span>
                  <span className={`text-xs font-black ${s.text}`}>{s.progress}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 text-base">Recent Activity</h3>
            <button className="text-xs font-black text-teal-600 hover:text-teal-700 transition-colors">View all</button>
          </div>
          <div className="space-y-1">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center text-base flex-shrink-0`}>
                  {a.icon}
                </div>
                <p className="text-slate-700 text-sm font-semibold flex-1 truncate">{a.text}</p>
                <span className="text-slate-400 text-xs font-semibold flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h3 className="font-display font-bold text-slate-900 text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <a
              key={a.label}
              href={a.href}
              className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${a.color}`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-black">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}