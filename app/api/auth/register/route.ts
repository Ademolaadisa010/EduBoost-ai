import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[register] body received:", { ...body, password: "***" });

    const { fullName, email, phone, password, role } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password || !role) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!["student", "mentor"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    // ── 1. Create user via Admin SDK (safe to run server-side) ────────────────
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: email.trim(),
        password,
        displayName: fullName.trim(),
        emailVerified: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const firebaseErrors: Record<string, string> = {
        "auth/email-already-exists": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
      };
      const message = (code && firebaseErrors[code]) ?? "Failed to create account.";
      console.error("[register] createUser error:", code, err);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // ── 2. Generate email verification link ───────────────────────────────────
    let verificationLink = "";
    try {
      verificationLink = await adminAuth.generateEmailVerificationLink(email.trim());
    } catch (err) {
      console.error("[register] verification link error:", err);
    }

    // ── 3. Save profile to Firestore ──────────────────────────────────────────
    try {
      await adminDb.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[register] firestore write error:", err);
    }

    // ── 4. Send emails (fire-and-forget) ──────────────────────────────────────
    sendWelcomeEmail(email.trim(), fullName.trim(), role, verificationLink).catch((err) =>
      console.error("[nodemailer] email failed:", err)
    );

    return NextResponse.json(
      {
        message: "Account created! Check your email to verify your account.",
        uid: userRecord.uid,
        role,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}