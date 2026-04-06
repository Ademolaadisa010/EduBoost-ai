"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const GROUPS = [
  { name: "SS3 Mathematics", subject: "Mathematics", level: "WAEC Prep",  members: 247, online: 12, icon: "📐", joined: true,  color: "orange" },
  { name: "SS3 Biology",     subject: "Biology",     level: "WAEC Prep",  members: 189, online: 8,  icon: "🔬", joined: true,  color: "teal"   },
  { name: "Chemistry Hub",   subject: "Chemistry",   level: "SS2 & SS3",  members: 134, online: 4,  icon: "⚗️", joined: false, color: "violet" },
  { name: "English Mastery", subject: "English",     level: "All levels", members: 312, online: 19, icon: "📖", joined: false, color: "rose"   },
  { name: "Physics Legends", subject: "Physics",     level: "SS3 Focus",  members: 98,  online: 3,  icon: "⚡", joined: false, color: "amber"  },
  { name: "JAMB Warriors",   subject: "Mixed",       level: "JAMB Prep",  members: 421, online: 27, icon: "🎯", joined: false, color: "orange" },
  { name: "Further Maths",   subject: "Mathematics", level: "SS3 Elites", members: 64,  online: 5,  icon: "🔢", joined: false, color: "violet" },
  { name: "Lit-in-English",  subject: "English",     level: "WAEC focus", members: 156, online: 9,  icon: "📚", joined: false, color: "rose"   },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", iconBg: "bg-orange-100" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-300",   text: "text-teal-700",   iconBg: "bg-teal-100"   },
  violet: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-700", iconBg: "bg-violet-100" },
  rose:   { bg: "bg-rose-50",   border: "border-rose-300",   text: "text-rose-700",   iconBg: "bg-rose-100"   },
  amber:  { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-700",  iconBg: "bg-amber-100"  },
};

export default function GroupsPage() {
  const [joined, setJoined] = useState<string[]>(["SS3 Mathematics", "SS3 Biology"]);
  const [search, setSearch] = useState("");

  const filtered = GROUPS.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.subject.toLowerCase().includes(search.toLowerCase())
  );

  const myGroups      = filtered.filter((g) => joined.includes(g.name));
  const discoverGroups = filtered.filter((g) => !joined.includes(g.name));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Study Groups</h2>
          <p className="text-slate-500 text-sm font-medium">Connect with peers studying the same subjects.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-body"
          />
        </div>
      </div>

      {/* My groups */}
      {myGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">My Groups</p>
            <span className="text-xs font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{joined.length}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {myGroups.map((g) => {
              const c = COLOR_MAP[g.color] ?? COLOR_MAP.orange;
              return (
                <div key={g.name} className={`border-2 rounded-2xl p-5 ${c.bg} ${c.border}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center text-xl`}>{g.icon}</div>
                      <div>
                        <p className="font-display font-bold text-slate-900 text-sm">{g.name}</p>
                        <p className={`text-xs font-semibold ${c.text}`}>{g.level}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-teal-700 bg-teal-100 border border-teal-200 rounded-full px-2.5 py-1 text-xs font-black flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />{g.online} online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">{g.members.toLocaleString()} members</span>
                    <button className={`text-xs font-black px-3 py-1.5 rounded-xl border ${c.border} ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}>
                      Open Group →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discover */}
      {discoverGroups.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Discover Groups</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {discoverGroups.map((g) => {
              const c = COLOR_MAP[g.color] ?? COLOR_MAP.orange;
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
                    <span className="text-xs text-slate-400 font-semibold flex-shrink-0">{g.online} online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">{g.members.toLocaleString()} members</span>
                    <button
                      onClick={() => setJoined((p) => [...p, g.name])}
                      className="text-xs font-black bg-slate-900 hover:bg-orange-500 text-white px-3 py-1.5 rounded-xl transition-colors"
                    >
                      + Join Group
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center">
          <p className="font-display font-bold text-slate-500 text-lg">No groups found for &quot;{search}&quot;</p>
          <p className="text-slate-400 text-sm mt-2">Try a different subject or clear your search.</p>
        </div>
      )}
    </div>
  );
}