"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, Eye, EyeOff, BookOpen, BrainCircuit, TrendingUp, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-amber-50 font-body">
      <div className="min-h-screen lg:grid lg:grid-cols-2">

        {/* ── LEFT BRAND PANEL ─────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-900 p-12 xl:p-16">
          {/* background blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-500 opacity-10 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-500 opacity-10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-500 opacity-8 blur-3xl" />
          </div>

          {/* logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-black text-2xl text-white tracking-tight">
              Edu<span className="text-orange-400">Boost</span>
              <span className="text-teal-400"> AI</span>
            </span>
          </div>

          {/* headline */}
          <div className="relative z-10 my-auto">
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-4">
              Welcome back
            </p>
            <h1 className="font-display font-black text-white text-4xl xl:text-5xl leading-[1.1] mb-6">
              Learn smarter with<br />
              <em className="not-italic text-teal-400">personalized AI</em>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-md">
              Access adaptive study tools, guided feedback, and progress-focused learning — built for modern students.
            </p>

            {/* feature pills */}
            <div className="mt-10 space-y-3">
              {[
                { icon: <BrainCircuit className="w-4 h-4" />, color: "bg-orange-500/20 text-orange-300", text: "Personalized learning paths powered by AI insights" },
                { icon: <BookOpen className="w-4 h-4" />, color: "bg-teal-500/20 text-teal-300", text: "Faster revision with intelligent summaries and practice help" },
                { icon: <TrendingUp className="w-4 h-4" />, color: "bg-violet-500/20 text-violet-300", text: "Clean dashboard for focused academic growth" },
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

          {/* bottom quote */}
          <div className="relative z-10 rounded-2xl bg-white/5 border border-white/8 px-5 py-4">
            <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
              &quot;EduBoost AI cut my study time in half and my grades shot up. The quiz generator before exams is a lifesaver!&quot;
            </p>
            <p className="mt-2 text-xs font-black text-white">Sarah J. — University Student</p>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ─────────────────────────────────── */}
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

            {/* heading */}
            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Welcome back</p>
            <h2 className="font-display font-black text-slate-900 text-3xl xl:text-4xl leading-tight mb-2">
              Sign in to your account
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-8">
              Continue your learning journey with secure access to your AI-powered tools.
            </p>

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-2 right-2 flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((p) => !p)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-300"
                />
                Remember me for 30 days
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* divider */}
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
              type="button"
              onClick={handleGoogle}
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

            {/* sign up link */}
            <p className="mt-7 text-center text-sm text-slate-500 font-medium">
              Don&apos;t have an account?{" "}
              <Link
                href="/Register"
                className="font-black text-orange-500 hover:text-orange-600 transition"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}