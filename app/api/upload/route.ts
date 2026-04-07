import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

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

    // ── Parse form ───────────────────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use PDF, TXT, DOCX, or PPTX." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 400 }
      );
    }

    // ── Read file as base64 (for Gemini) and plain text (for .txt) ───────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    // For .txt files extract text directly; PDF/DOCX go as base64 to Gemini
    let extractedText: string | null = null;
    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8").slice(0, 60000);
    }

    // ── Save file record to Firestore (name + metadata only, no Storage) ─────
    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("notes")
      .doc();

    await docRef.set({
      id: docRef.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      fileId: docRef.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      base64Data,   // sent to Gemini directly on the client
      extractedText,// only populated for .txt files
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}