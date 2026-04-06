"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const MENTORS = [
  { initials: "AO", name: "Mr. Adewale Okafor",   subjects: "Mathematics · Physics",    level: "SS2–SS3",    price: "₦2,500", rating: 4.9, reviews: 87,  color: "bg-orange-500", online: true  },
  { initials: "FN", name: "Dr. Fatima Nwosu",      subjects: "Biology · Chemistry",      level: "All levels", price: "₦3,000", rating: 5.0, reviews: 124, color: "bg-teal-600",   online: true  },
  { initials: "EI", name: "Ms. Emeka Ihejirika",   subjects: "English · Literature",     level: "WAEC focus", price: "₦1,800", rating: 4.7, reviews: 63,  color: "bg-violet-600", online: false },
  { initials: "KB", name: "Mr. Kolade Babatunde",  subjects: "Economics · Accounting",   level: "SS3",        price: "₦2,200", rating: 4.6, reviews: 51,  color: "bg-rose-500",   online: true  },
  { initials: "SA", name: "Mrs. Sola Adeyemi",     subjects: "Mathematics · Further Maths", level: "All levels", price: "₦2,800", rating: 4.8, reviews: 96,  color: "bg-amber-500",  online: false },
  { initials: "TB", name: "Mr. Tunde Badmus",      subjects: "Physics · Chemistry",      level: "SS2–SS3",    price: "₦2,000", rating: 4.5, reviews: 38,  color: "bg-teal-500",   online: true  },
];

const SUBJECTS = ["All", "Mathematics", "Biology", "Chemistry", "Physics", "English", "Economics"];

export default function MentorsPage() {
  const [filter, setFilter]   = useState("All");
  const [booked, setBooked]   = useState<string[]>([]);

  const filtered = filter === "All"
    ? MENTORS
    : MENTORS.filter((m) => m.subjects.includes(filter));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display font-black text-slate-900 text-2xl mb-1">Mentors</h2>
        <p className="text-slate-500 text-sm font-medium">Book 1-on-1 sessions with verified academic mentors.</p>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
              filter === s
                ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Mentor grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const isBooked = booked.includes(m.name);
          return (
            <div key={m.name} className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-white font-black text-base shrink-0`}>
                    {m.initials}
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-900 text-sm">{m.name}</p>
                    <p className="text-slate-500 text-xs font-semibold">{m.subjects}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-black rounded-full px-2.5 py-1 flex-shrink-0 ${
                  m.online ? "bg-teal-100 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.online ? "bg-teal-500 animate-pulse" : "bg-slate-400"}`} />
                  {m.online ? "Online" : "Offline"}
                </span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(m.rating) ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
                ))}
                <span className="text-amber-600 text-xs font-black ml-1">{m.rating}</span>
                <span className="text-slate-400 text-xs font-semibold">({m.reviews} reviews)</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</p>
                  <p className="text-slate-700 text-xs font-bold mt-0.5">{m.level}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                  <p className="font-display font-black text-orange-600 text-sm mt-0.5">{m.price}/hr</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setBooked((p) => isBooked ? p.filter((n) => n !== m.name) : [...p, m.name])}
                className={`w-full py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 ${
                  isBooked
                    ? "bg-teal-50 border-2 border-teal-300 text-teal-700 hover:bg-teal-100"
                    : "bg-slate-900 hover:bg-orange-500 text-white hover:shadow-md hover:shadow-orange-200"
                }`}
              >
                {isBooked ? "✓ Session Booked" : "Book Session"}
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center">
          <p className="font-display font-bold text-slate-500 text-lg">No mentors for &quot;{filter}&quot; yet</p>
          <p className="text-slate-400 text-sm mt-2">Try a different subject filter.</p>
        </div>
      )}
    </div>
  );
}