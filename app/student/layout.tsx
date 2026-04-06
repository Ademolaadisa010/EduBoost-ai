"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles, LayoutDashboard, BookOpen, Bot, Users,
  ShieldCheck, HelpCircle, LogOut, Bell, Menu, X, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/student/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview" },
  { href: "/student/study",     icon: <BookOpen className="w-5 h-5" />,         label: "Study Assistant" },
  { href: "/student/tutor",     icon: <Bot className="w-5 h-5" />,              label: "AI Tutor" },
  { href: "/student/groups",    icon: <Users className="w-5 h-5" />,            label: "Study Groups" },
  { href: "/student/mentors",   icon: <ShieldCheck className="w-5 h-5" />,      label: "Mentors" },
  { href: "/student/quiz",      icon: <HelpCircle className="w-5 h-5" />,       label: "Practice Quiz" },
];

const PAGE_TITLES: Record<string, string> = {
  "/student/dashboard": "Dashboard",
  "/student/study":     "Study Assistant",
  "/student/tutor":     "AI Tutor",
  "/student/groups":    "Study Groups",
  "/student/mentors":   "Mentors",
  "/student/quiz":      "Practice Quiz",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <div className="min-h-screen bg-amber-50 font-body antialiased flex">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:z-auto`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-lg text-white">
                Edu<span className="text-orange-400">Boost</span>
                <span className="text-teal-400"> AI</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 ml-10">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-400 text-xs font-black uppercase tracking-widest">Student Portal</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all
                  ${isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40"
                    : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
                  }`}
              >
                {icon}
                {label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Streak badge */}
        <div className="px-3 py-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🔥</div>
            <div>
              <p className="font-display font-black text-white text-sm">7-day streak!</p>
              <p className="text-slate-400 text-xs font-semibold">Keep it going 💪</p>
            </div>
          </div>
        </div>

        {/* User + logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
              AT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">Amara Tunde</p>
              <p className="text-slate-400 text-xs font-semibold">SS3 Student</p>
            </div>
          </div>
          <Link
            href="/Login"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="font-display font-black text-slate-900 text-xl">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xs">
                AT
              </div>
              <span className="text-slate-700 text-sm font-bold">Amara</span>
            </div>
          </div>
        </header>

        {/* Page-specific content */}
        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}