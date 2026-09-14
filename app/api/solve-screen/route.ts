import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const capturedText = body?.capturedText;

    if (
      !capturedText ||
      typeof capturedText !== "string" ||
      capturedText.trim().length < 2
    ) {
      return NextResponse.json({
        success: false,
        rawText: "Empty Query",
        answer:
          "No text or question was provided. Please type a valid query or try capturing again.",
      });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      console.error("❌ [API Error]: GROQ_API_KEY is missing!");
      return NextResponse.json({
        success: false,
        rawText: "Configuration Error",
        answer:
          "Error: GROQ_API_KEY is missing in your environment variables or .env.local file.",
      });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are an elite competitive programmer and senior software engineer. Analyze the provided screen text carefully.

🚨 ABSOLUTE LANGUAGE OVERRIDE RULE (HIGHEST PRIORITY):
1. Look for the programming language selector or compiler environment dropdown visible in the editor header (e.g., "C++ (17)", "C++", "Java", "Python", "C").
2. Your response's SOLUTION CODE block MUST match that exact language environment. If the screen header shows "C++ (17)" or "C++", you are strictly forbidden from writing Python or Java code. You must write modern C++ code using standard templates (like #include <bits/stdc++.h> or equivalent).

HUMAN-LIKE & PLAGIARISM-FREE CODING STYLE:
- Keep code concise, clean, and production-ready. Include helpful, natural inline comments explaining key logic steps like a human developer would.
- Ensure optimal time and space complexity.
-Ensure that you provide shortest code possible while maintaining clarity and readability. Avoid unnecessary verbosity or redundant code structures.

STRICT FORMATTING RULES:
1. DO NOT use single quotes (' or ’) anywhere in your response unless absolutely required inside a string literal. Hash symbols (#) ARE ALLOWED and required for preprocessor directives like #include.

2. IF IT IS A CODING PROBLEM:
   Format your response using ONLY these exact uppercase headings in this exact sequence:
   - OPTIMAL APPROACH
   - COMPLEXITY ANALYSIS
   - SOLUTION CODE
   (Under SOLUTION CODE, provide ONLY the clean code block using triple backticks with the exact language identifier matching the screen environment, e.g., cpp).

3. IF IT IS AN MCQ / SCENARIO QUESTION:
   Format your response using ONLY these uppercase headings in this exact sequence:
   - CORRECT OPTION
   - DIRECT ANSWER
   - WHY IT IS CORRECT
   (Highlight the correct letter choice clearly at the top under CORRECT OPTION).

4. IF IT IS A GENERAL TECHNICAL QUESTION:
   Provide structured, high-impact explanations in professional terms without first-person pronouns.`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", // 👈 UPDATED TO ACTIVE PRODUCTION MODEL
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: capturedText },
      ],
      temperature: 0.2,
    });

    let answer = completion.choices[0]?.message?.content || "";

    if (!answer.trim()) {
      answer =
        "The AI model returned an empty response. Please try submitting again.";
    }

    return NextResponse.json({
      success: true,
      rawText:
        capturedText.length > 40
          ? capturedText.substring(0, 40) + "..."
          : capturedText,
      answer: answer,
    });
  } catch (error: any) {
    console.error("🔥 [Screen Solve API Error]:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        rawText: "API Error",
        answer: `Error processing query: ${error?.message || "Unknown server error"}`,
      },
      { status: 200 }, // 👈 Using 200 instead of 500 prevents Next.js rendering crash screens
    );
  }
}
