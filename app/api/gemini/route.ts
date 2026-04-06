import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, fileContent, fileName } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Build parts — prepend file content if uploaded
    const textParts: { text: string }[] = [];
    if (fileContent && fileName) {
      textParts.push({
        text: `The user uploaded a file called "${fileName}". Here is its content:\n\n${fileContent}\n\n---\n\n`,
      });
    }
    textParts.push({ text: prompt });

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: textParts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: errorData?.error?.message ?? "Gemini API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return NextResponse.json({ content: [{ text }] });
  } catch (err) {
    console.error("Gemini route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}