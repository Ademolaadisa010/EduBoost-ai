import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"EduBoost AI" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Single email: welcome message + verify button combined
export async function sendWelcomeEmail(
  to: string,
  fullName: string,
  role: "student" | "mentor",
  verificationLink: string
) {
  const isStudent = role === "student";
  const accentColor = isStudent ? "#f97316" : "#0d9488";
  const dashboardHref = `${BASE_URL}/${isStudent ? "student/dashboard" : "mentor/onboarding"}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Welcome to EduBoost AI — please verify your email ✉️`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to EduBoost AI</title>
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
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:2px;">
              Welcome aboard! 🎉
            </p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f172a;line-height:1.2;">
              Hi ${fullName}, you're in!
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.7;">
              Your EduBoost AI <strong style="color:#0f172a;">${role}</strong> account has been created.
              First, verify your email address to activate it:
            </p>

            <!-- Verify button -->
            <div style="text-align:center;margin:0 0 32px;">
              <a href="${verificationLink}"
                 style="display:inline-block;background:${accentColor};color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:14px;">
                Verify My Email →
              </a>
            </div>

            <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;line-height:1.7;">
              This link expires in <strong>24 hours</strong>. After verifying you can access your dashboard:
            </p>

            <!-- Dashboard CTA -->
            <div style="text-align:center;margin:0 0 8px;">
              <a href="${dashboardHref}"
                 style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:14px;">
                Go to ${isStudent ? "Student Dashboard" : "Mentor Onboarding"} →
              </a>
            </div>
          </td>
        </tr>

        <!-- Link fallback -->
        <tr>
          <td style="padding:16px 40px 32px;">
            <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px dashed #e2e8f0;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
                Verify button not working? Copy this link:
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">${verificationLink || "No verification link generated — contact support."}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} EduBoost AI · If you didn't sign up, ignore this email.
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
}