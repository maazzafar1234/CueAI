import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY?.trim() || "" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      language: "en",
    });

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    let transcribedText = transcription.text ? transcription.text.trim() : "";

    console.log("\n========================================");
    console.log("🎙️ [Voice Mode Transcribed Question]:", transcribedText);
    console.log("========================================\n");

    if (!transcribedText || transcribedText.length < 3) {
      return NextResponse.json({
        success: true,
        rawText: "",
        answer: "No clear speech detected.",
      });
    }

    const systemPrompt = `You are an elite Software Engineering Technical Interview Coach. 
Provide a direct, interview-ready response. 

CRITICAL FORMATTING RULES:
1. DO NOT use hash symbols (#), markdown asterisks (*), or single quotes (' or ’) around words. Use double quotes if quotation is necessary.
2. Use uppercase plain text titles for sections: DEFINITION, UNDER THE HOOD, REAL-LIFE EXAMPLE, and CODE.
3. Separate each section with clear line breaks.
4. FOR THE CODE SECTION: You MUST enclose the code snippet inside a proper markdown code block using triple backticks followed by the language name (e.g., java or javascript) on a new line, and closing with triple backticks on a new line. Do not write code outside of code blocks.`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcribedText },
      ],
      temperature: 0.2,
    });

    let answer =
      completion.choices[0]?.message?.content || "No answer generated.";

    // Programmatically strip stray single quotes if any slip through
    answer = answer.replace(/['’]/g, "");

    console.log("🤖 [Clean Boxed Code Answer Generated & Sent to UI]");

    return NextResponse.json({
      success: true,
      rawText: transcribedText,
      answer: answer,
    });
  } catch (error: any) {
    console.error("Voice Solve API Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Server Error" },
      { status: 500 },
    );
  }
}
