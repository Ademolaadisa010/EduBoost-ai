"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Sparkles, Eye, EyeOff, BookOpen,
  BrainCircuit, Users, ArrowRight,
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Role = "student" | "mentor";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Email / Password registration ─────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation with toast feedback
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your account…");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.", { id: toastId });
        return;
      }

      toast.success(
        "Account created! Check your email to verify your account. 🎉",
        { id: toastId, duration: 5000 }
      );

      // Short delay so the user reads the toast, then redirect
      setTimeout(() => {
        router.push(role === "mentor" ? "/mentor/onboarding" : "/student/dashboard");
      }, 2000);
    } catch {
      toast.error("Network error. Please check your connection.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-up ────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const toastId = toast.loading("Connecting to Google…");

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const user = credential.user;

      // Only write to Firestore if this is a brand-new user
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);

      if (!existing.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: user.displayName ?? "",
          email: user.email ?? "",
          phone: user.phoneNumber ?? "",
          role,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
        });

        // Send welcome email via your API (fire-and-forget)
        fetch("/api/auth/welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            fullName: user.displayName,
            role,
          }),
        }).catch(() => null);
      }

      toast.success("Signed in with Google! Welcome 🎉", { id: toastId });
      setTimeout(() => {
        router.push(role === "mentor" ? "/mentor/onboarding" : "/Login");
      }, 1200);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled.", { id: toastId });
      } else {
        toast.error("Google sign-in failed. Please try again.", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50 font-body">
      {/* ── Toast provider ─────────────────────────────────────────────────── */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: "14px",
            padding: "14px 18px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          },
          success: {
            iconTheme: { primary: "#f97316", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      {/* ── full-page grid ──────────────────────────────────────────────────── */}
      <div className="min-h-screen lg:grid lg:grid-cols-2">

        {/* ── LEFT BRAND PANEL ───────────────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-900 p-12 xl:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-500 opacity-10 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-500 opacity-10 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-2xl text-white tracking-tight">
              Edu<span className="text-orange-400">Boost</span>
              <span className="text-teal-400"> AI</span>
            </span>
          </div>

          <div className="relative z-10 my-auto">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-4">
              Academic AI Platform
            </p>
            <h1 className="font-display font-black text-white text-4xl xl:text-5xl leading-[1.1] mb-6">
              Join the future of<br />
              <em className="not-italic text-orange-400">smart learning</em>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-md">
              AI-powered study tools, peer collaboration, and expert mentorship — all in one platform.
            </p>

            <div className="mt-10 space-y-3">
              {[
                { icon: <BookOpen className="w-4 h-4" />, color: "bg-orange-500/20 text-orange-300", text: "AI summaries, quizzes & explanations from your notes" },
                { icon: <Users className="w-4 h-4" />, color: "bg-teal-500/20 text-teal-300", text: "Connect with peers and experienced mentors" },
                { icon: <BrainCircuit className="w-4 h-4" />, color: "bg-violet-500/20 text-violet-300", text: "Track progress and improve faster for exams" },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${f.color}`}>
                    {f.icon}
                  </div>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 rounded-2xl bg-white/5 border border-white/8 px-5 py-4">
            <div className="bg-teal-500/20 p-2.5 rounded-xl text-teal-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Students</p>
              <p className="font-display font-black text-white text-lg">10,000+ learners</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ───────────────────────────────────────────── */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 md:px-10 lg:px-14 bg-amber-50">
          <div className="w-full max-w-md">

            {/* mobile logo */}
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-xl text-slate-900">
                Edu<span className="text-orange-500">Boost</span>
                <span className="text-teal-600"> AI</span>
              </span>
            </div>

            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Get started</p>
            <h2 className="font-display font-black text-slate-900 text-3xl xl:text-4xl leading-tight mb-2">
              Create your account
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-7">
              Join thousands of students and mentors transforming how they learn.
            </p>

            {/* Role toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["student", "mentor"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  disabled={loading}
                  className={`rounded-2xl border-2 py-3 text-sm font-bold transition-all ${
                    role === r
                      ? r === "student"
                        ? "border-orange-400 bg-orange-50 text-orange-600 shadow-md shadow-orange-100"
                        : "border-teal-400 bg-teal-50 text-teal-700 shadow-md shadow-teal-100"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {r === "student" ? "Student / Learner" : "Mentor / Tutor"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-bold text-slate-700">Full Name</label>
                <input
                  id="fullName" name="fullName" type="text" required
                  value={formData.fullName} onChange={handleInputChange}
                  placeholder="Amara Tunde"
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">Email Address</label>
                <input
                  id="email" name="email" type="email" required
                  value={formData.email} onChange={handleInputChange}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-slate-700">Phone Number</label>
                <input
                  id="phone" name="phone" type="tel" required
                  value={formData.phone} onChange={handleInputChange}
                  placeholder="+234 801 234 5678"
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"} required
                    value={formData.password} onChange={handleInputChange}
                    placeholder="Create a strong password"
                    disabled={loading}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-2 right-2 flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} required
                    value={formData.confirmPassword} onChange={handleInputChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-2 right-2 flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                  role === "student"
                    ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                    : "bg-teal-600 hover:bg-teal-700 shadow-teal-200"
                }`}
              >
                {loading ? "Creating Account…" : `Create ${role === "student" ? "Student" : "Mentor"} Account`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-amber-50 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0">
                <path d="M21.805 10.023h-9.18v3.955h5.272c-.227 1.272-.954 2.35-2.044 3.077v2.555h3.307c1.936-1.783 3.045-4.41 3.045-7.53 0-.685-.062-1.344-.18-1.977Z" fill="#4285F4" />
                <path d="M12.625 22c2.756 0 5.07-.914 6.76-2.467l-3.307-2.555c-.915.614-2.086.978-3.453.978-2.65 0-4.895-1.79-5.698-4.195H3.508v2.636A10.2 10.2 0 0 0 12.625 22Z" fill="#34A853" />
                <path d="M6.927 13.761a6.136 6.136 0 0 1 0-3.91V7.215H3.508a10.199 10.199 0 0 0 0 9.182l3.419-2.636Z" fill="#FBBC05" />
                <path d="M12.625 5.804c1.498 0 2.843.515 3.902 1.527l2.927-2.927C17.69 2.772 15.38 2 12.625 2A10.2 10.2 0 0 0 3.508 7.215l3.419 2.636c.803-2.405 3.048-4.047 5.698-4.047Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <p className="mt-7 text-center text-sm text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-black text-orange-500 hover:text-orange-600 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}