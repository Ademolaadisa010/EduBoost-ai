"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles, LayoutDashboard, BookOpen, Bot, Users,
  ShieldCheck, HelpCircle, LogOut, Bell, Menu, X,
  ChevronRight, Settings,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast, { Toaster } from "react-hot-toast";

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  classLevel?: string;
  subjects?: string[];
}

const NAV_ITEMS = [
  { href: "/student/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview" },
  { href: "/student/study",     icon: <BookOpen className="w-5 h-5" />,         label: "Study Assistant" },
  { href: "/student/tutor",     icon: <Bot className="w-5 h-5" />,              label: "AI Tutor" },
  { href: "/student/groups",    icon: <Users className="w-5 h-5" />,            label: "Study Groups" },
  { href: "/student/mentors",   icon: <ShieldCheck className="w-5 h-5" />,      label: "Mentors" },
  { href: "/student/quiz",      icon: <HelpCircle className="w-5 h-5" />,       label: "Practice Quiz" },
  { href: "/student/profile",   icon: <Settings className="w-5 h-5" />,         label: "Profile & Settings" },
];

// 👇 Add/remove routes here as you build them
const COMING_SOON = new Set([
  "/student/mentors",
]);

const PAGE_TITLES: Record<string, string> = {
  "/student/dashboard": "Dashboard",
  "/student/study":     "Study Assistant",
  "/student/tutor":     "AI Tutor",
  "/student/groups":    "Study Groups",
  "/student/mentors":   "Mentors",
  "/student/quiz":      "Practice Quiz",
  "/student/profile":   "Profile & Settings",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function firstName(name: string) {
  return name?.split(" ")[0] || "Student";
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/sign-in");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({
            fullName: user.displayName ?? "Student",
            email: user.email ?? "",
            role: "student",
          });
        }
      } catch {
        setProfile({
          fullName: user.displayName ?? "Student",
          email: user.email ?? "",
          role: "student",
        });
      } finally {
        setLoadingProfile(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    const toastId = toast.loading("Signing out…");
    try {
      await signOut(auth);
      toast.success("Signed out successfully.", { id: toastId });
      router.replace("/sign-in");
    } catch {
      toast.error("Sign out failed. Please try again.", { id: toastId });
    }
  };

  const userInitials  = profile ? initials(profile.fullName) : "…";
  const userFirstName = profile ? firstName(profile.fullName) : "…";
  const classLabel    = profile?.classLevel || "Set class in profile";

  return (
    <div className="min-h-screen bg-amber-50 font-body antialiased flex">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: "14px", fontWeight: 600, fontSize: "14px", padding: "14px 18px" },
          success: { iconTheme: { primary: "#f97316", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:z-auto`}>

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
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 ml-10">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-400 text-xs font-black uppercase tracking-widest">Student Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            const isSoon   = COMING_SOON.has(href);

            if (isSoon) {
              return (
                <button
                  key={href}
                  onClick={() => toast("⚙️ Still building this — coming soon!", {
                    style: { background: "#1e293b", color: "#fff", borderRadius: "14px", fontWeight: 600, fontSize: "14px" },
                  })}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold
                    text-slate-500 opacity-50 blur-[0.5px] hover:blur-0 hover:opacity-75
                    hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  {icon}
                  {label}
                  <span className="ml-auto text-[9px] font-black uppercase tracking-widest
                    bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full leading-4">
                    Soon
                  </span>
                </button>
              );
            }

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

        {/* Streak */}
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
          <Link
            href="/student/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
              {loadingProfile ? "…" : userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold truncate">
                {loadingProfile ? "Loading…" : profile?.fullName}
              </p>
              <p className="text-slate-400 text-xs font-semibold truncate">
                {loadingProfile ? "" : classLabel}
              </p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/60 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-200 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-display font-black text-slate-900 text-xl leading-tight">{pageTitle}</h1>
              {!loadingProfile && profile?.classLevel && (
                <p className="text-xs text-slate-400 font-semibold leading-tight">{profile.classLevel}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <Link
              href="/student/profile"
              className="hidden sm:flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-orange-300 rounded-xl px-3 py-2 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xs">
                {loadingProfile ? "…" : userInitials}
              </div>
              <span className="text-slate-700 text-sm font-bold">{loadingProfile ? "…" : userFirstName}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}