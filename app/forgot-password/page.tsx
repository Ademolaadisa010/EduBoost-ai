"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, ArrowRight, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50 font-body">
      <div className="min-h-screen lg:grid lg:grid-cols-2">

        {/* ── LEFT BRAND PANEL ─────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-900 p-12 xl:p-16">
          {/* blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-500 opacity-10 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-500 opacity-10 blur-3xl" />
            <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-violet-500 opacity-8 blur-3xl" />
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
              Password Recovery
            </p>
            <h1 className="font-display font-black text-white text-4xl xl:text-5xl leading-[1.1] mb-6">
              Reset your password,<br />
              <em className="not-italic text-teal-400">get back to learning.</em>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-md">
              No worries — it happens. We&apos;ll send you a secure link to reset your password and get back to your studies in minutes.
            </p>

            {/* steps */}
            <div className="mt-10 space-y-4">
              {[
                { num: "01", color: "bg-orange-500/20 text-orange-300 ring-orange-500/30", title: "Enter your email", desc: "The one you used to sign up" },
                { num: "02", color: "bg-teal-500/20 text-teal-300 ring-teal-500/30", title: "Check your inbox", desc: "We'll send a reset link instantly" },
                { num: "03", color: "bg-violet-500/20 text-violet-300 ring-violet-500/30", title: "Set a new password", desc: "And you're back to learning" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/8 px-4 py-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm ring-2 flex-shrink-0 ${s.color}`}>
                    {s.num}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{s.title}</p>
                    <p className="text-slate-400 text-xs font-medium">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* tip */}
          <div className="relative z-10 rounded-2xl bg-white/5 border border-white/8 px-5 py-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Quick Tip</p>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Check your spam folder if the email doesn&apos;t arrive. The reset link expires in 30 minutes for your security.
            </p>
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

            {success ? (
              /* ── SUCCESS STATE ── */
              <div className="text-center">
                {/* icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-teal-600" />
                </div>

                <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Email Sent!</p>
                <h2 className="font-display font-black text-slate-900 text-3xl leading-tight mb-3">
                  Check your inbox
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-2">
                  We&apos;ve sent a password reset link to
                </p>
                <div className="inline-flex items-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-2 mb-6">
                  <Mail className="w-4 h-4 text-orange-500" />
                  <span className="font-black text-orange-600 text-sm">{email}</span>
                </div>

                <p className="text-slate-400 text-xs font-medium mb-8">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-orange-500 font-black hover:text-orange-600 transition"
                  >
                    try again
                  </button>
                  .
                </p>

                {/* tip card */}
                <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl px-5 py-4 text-left mb-8">
                  <p className="text-teal-700 font-bold text-xs uppercase tracking-widest mb-1">Reminder</p>
                  <p className="text-teal-600 text-sm font-medium leading-relaxed">
                    The reset link expires in <strong>30 minutes</strong>. If it expires, just come back and request a new one.
                  </p>
                </div>

                <Link
                  href="/sign-in"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <>
                {/* back link */}
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-orange-500 text-sm font-bold transition-colors mb-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>

                <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Password Recovery</p>
                <h2 className="font-display font-black text-slate-900 text-3xl xl:text-4xl leading-tight mb-2">
                  Forgot your password?
                </h2>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  Enter the email address linked to your account and we&apos;ll send you a reset link right away.
                </p>

                {/* error */}
                {error && (
                  <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 space-y-3 text-center">
                  <p className="text-sm text-slate-500 font-medium">
                    Remember your password?{" "}
                    <Link href="/sign-in" className="font-black text-orange-500 hover:text-orange-600 transition">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    Don&apos;t have an account?{" "}
                    <Link href="/Register" className="font-black text-teal-600 hover:text-teal-700 transition">
                      Sign up free
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}