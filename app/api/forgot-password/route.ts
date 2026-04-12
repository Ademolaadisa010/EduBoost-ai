import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/nodemailer";

const FROM = `"EduBoost AI" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Generate Firebase password reset link via Admin SDK
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    let resetLink: string;
    try {
      resetLink = await getAuth().generatePasswordResetLink(email.trim().toLowerCase());
    } catch (err: unknown) {
      // If the user doesn't exist, return success anyway (security best practice)
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        return NextResponse.json({ success: true });
      }
      throw err;
    }

    await transporter.sendMail({
      from: FROM,
      to:   email,
      subject: "Reset your EduBoost AI password 🔐",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:32px 40px;text-align:center;">
            <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              Edu<span style="color:#f97316;">Boost</span><span style="color:#2dd4bf;"> AI</span>
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 16px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:2px;">
              Password Reset 🔐
            </p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f172a;line-height:1.2;">
              Reset your password
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
              We received a request to reset the password for your EduBoost AI account.
              Click the button below to set a new password:
            </p>

            <!-- Reset button -->
            <div style="text-align:center;margin:0 0 32px;">
              <a href="${resetLink}"
                 style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:14px;">
                Reset My Password →
              </a>
            </div>

            <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.7;">
              This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
            </p>
          </td>
        </tr>

        <!-- Link fallback -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px dashed #e2e8f0;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                Button not working? Copy this link:
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">${resetLink}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} EduBoost AI · If you didn't request this, ignore this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json({ error: "Failed to send reset email. Please try again." }, { status: 500 });
  }
}