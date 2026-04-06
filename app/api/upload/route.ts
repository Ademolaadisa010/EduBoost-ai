import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { getApps, initializeApp, cert } from "firebase-admin/app";

// Ensure admin is initialised (same guard as firebase-admin.ts)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g. eduboost-ai-b63fd.appspot.com
  });
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ── Parse multipart form ─────────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Allow: pdf, txt, docx (plain text extraction), pptx
    const allowed = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported. Use PDF, TXT, DOCX, or PPTX." }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB." }, { status: 400 });
    }

    // ── Upload to Firebase Storage ───────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `notes/${uid}/${timestamp}_${safeName}`;

    const bucket = getStorage().bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type, metadata: { uploadedBy: uid, originalName: file.name } },
    });

    // ── Generate signed URL (1 hour) ─────────────────────────────────────────
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    // ── Save file record to Firestore ────────────────────────────────────────
    const docRef = adminDb.collection("users").doc(uid).collection("notes").doc();
    await docRef.set({
      id: docRef.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath,
      signedUrl,
      uploadedAt: new Date().toISOString(),
    });

    // ── Extract text for .txt files (for Gemini context) ─────────────────────
    let extractedText: string | null = null;
    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8").slice(0, 50000); // cap at 50k chars
    }

    return NextResponse.json({
      success: true,
      fileId: docRef.id,
      fileName: file.name,
      fileType: file.type,
      signedUrl,
      extractedText, // null for pdf/docx — client will use URL instead
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}