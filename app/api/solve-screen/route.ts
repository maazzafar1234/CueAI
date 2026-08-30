import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY?.trim() || "" });

export async function POST(req: Request) {
  try {
    const { capturedText } = await req.json();

    if (
      !capturedText ||
      typeof capturedText !== "string" ||
      capturedText.trim().length < 2
    ) {
      return NextResponse.json({
        success: false,
        rawText: "Empty Capture",
        answer:
          "No text was detected from the screen capture. Please try selecting a clearer area or press Alt + S again.",
      });
    }

    console.log("\n========================================");
    console.log(
      "🖥️ [Screen OCR Captured Content]:",
      capturedText.substring(0, 150),
    );
    console.log("========================================\n");

    // 🧠 Intelligent System Prompt that adapts to Code vs. MCQ format automatically
    const systemPrompt = `You are an expert technical interview assistant. Analyze the provided screen text carefully.
Determine if the screen contains a CODING PROBLEM or a MULTIPLE CHOICE QUESTION (MCQ) with choices/options.

CRITICAL FORMATTING RULES:
1. DO NOT use single quotes (' or ’) or hash symbols (#) anywhere in your response. Use double quotes if quotation is necessary.

2. IF IT IS AN MCQ / SCENARIO QUESTION:
   Format your response using ONLY these uppercase headings:
   - CORRECT OPTION
   - DIRECT ANSWER
   - WHY IT IS CORRECT
   (Highlight the correct letter choice clearly at the top under CORRECT OPTION).

3. IF IT IS A CODING PROBLEM:
   Format your response using ONLY these uppercase headings:
   - OPTIMAL SOLUTION CODE
   - WHY THIS WORKS
   - EDGE CASES HANDLED
   (Under OPTIMAL SOLUTION CODE, provide ONLY the clean code block using triple backticks).`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: capturedText },
      ],
      temperature: 0.2,
    });

    let answer = completion.choices[0]?.message?.content || "";

    if (!answer.trim()) {
      answer =
        "The AI model returned an empty response. Please try capturing again.";
    } else {
      // Safely strip single quotes and hashes without breaking code blocks
      answer = answer.replace(/['’#]/g, "");
    }

    console.log("🤖 [Smart Screen Solution Generated Successfully]");

    return NextResponse.json({
      success: true,
      rawText: capturedText.substring(0, 40) + "...",
      answer: answer,
    });
  } catch (error: any) {
    console.error("Screen Solve API Error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        rawText: "API Error",
        answer: `Error processing screen: ${error?.message || "Unknown server error"}`,
      },
      { status: 500 },
    );
  }
}
