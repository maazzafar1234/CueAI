import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CANDIDATE_PROFILE } from "./resume-context.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for storing local session logs
const LOG_FILE_PATH = path.join(process.cwd(), "interview-session-log.md");

// AbortController to manage active API streaming
let currentAbortController = null;

/**
 * Dynamically resolves the GROQ API key across both development and packaged build paths.
 */
function getGroqApiKey() {
  // 1. Check environment variables
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    return process.env.GROQ_API_KEY.trim();
  }

  // 2. Resolve all potential paths for .env.local (including Electron resources directory)
  const envPaths = [
    process.resourcesPath
      ? path.join(process.resourcesPath, ".env.local")
      : null,
    path.join(process.cwd(), ".env.local"),
    path.join(__dirname, ".env.local"),
    path.join(path.dirname(process.execPath), ".env.local"),
  ].filter(Boolean);

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const fileContent = fs.readFileSync(envPath, "utf8");
        const parsed = dotenv.parse(fileContent);
        if (parsed.GROQ_API_KEY && parsed.GROQ_API_KEY.trim()) {
          console.log(`[Env Loader]: GROQ_API_KEY loaded from ${envPath}`);
          return parsed.GROQ_API_KEY.trim();
        }
      }
    } catch (err) {
      console.warn(
        `[Env Loader Warning]: Failed reading ${envPath}`,
        err.message,
      );
    }
  }

  return "";
}

/**
 * Immediately cancels any ongoing AI response stream.
 * @returns {boolean} Returns true if an active stream was cancelled.
 */
export function cancelCurrentStream() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    console.log("[Stream Controller]: Active stream cancelled.");
    return true;
  }
  return false;
}

const PERSONA_CONTEXT = `
Candidate Context (For technical focus):
- Domain: ${CANDIDATE_PROFILE.role}
- Tech Stack & Skills: ${CANDIDATE_PROFILE.keySkills.join(", ")}
`;

const SYSTEM_PROMPT = `
You are a real-time technical interview teleprompter assistant. Format every response to sound impressive, precise, and professional.

${PERSONA_CONTEXT}

STRICT WRITING RULES:
- NEVER use first-person pronouns like "I", "me", "my", "myself", or "we".
- Speak in objective, high-level technical terms ("Node.js enables execution of...", "This architecture allows...", "Developers utilize...").
- Keep explanations clear, punchy, and structured so they impress an interviewer upon listening.

REQUIRED OUTPUT STRUCTURE:

🗣️ **Interview Answer (What to say):**
• 2-3 concise, high-impact bullet points defining the core technology and key architectural benefit.

⚙️ **How It Works (In simple terms):**
• 2 clear bullet points detailing the internal mechanics, runtime engine, or underlying flow.

💻 **Quick Code Example:**
\`\`\`javascript
// Minimal 3-4 line clean code snippet
\`\`\`
`;

/**
 * Validates if the captured text represents an actual interview question or problem description.
 */
function isInterviewQuestion(text) {
  if (!text || text.trim().length < 6) return false;

  const cleanText = text.trim().toLowerCase();

  // 1. Explicit Question Mark
  if (cleanText.endsWith("?")) return true;

  // 2. Common Question & Problem Description Starters
  const questionStarters = [
    "what",
    "why",
    "how",
    "can you",
    "could you",
    "tell me",
    "explain",
    "describe",
    "compare",
    "difference between",
    "diff between",
    "is there",
    "are there",
    "when should",
    "where do",
    "which one",
    "walk me through",
    "define",
    "give an example",
    "what's",
    "how's",
    "given",
    "find",
    "calculate",
    "write",
    "complete",
    "print",
    "solve",
  ];

  const startsWithQuestion = questionStarters.some((starter) =>
    cleanText.startsWith(starter),
  );
  if (startsWithQuestion) return true;

  // 3. Problem & Technical Pattern Keywords anywhere in text
  const technicalQuestionKeywords = [
    "difference",
    "vs",
    "versus",
    "advantage",
    "disadvantage",
    "architecture",
    "working of",
    "used for",
    "purpose of",
    "concept of",
    "array",
    "integers",
    "minimum",
    "maximum",
    "sum",
    "input format",
  ];

  return technicalQuestionKeywords.some((keyword) =>
    cleanText.includes(keyword),
  );
}

/**
 * Appends the Q&A pair with a timestamp to interview-session-log.md
 */
function logSessionQA(question, answer) {
  const timestamp = new Date().toLocaleString();
  const logEntry = `
---
### 🕒 [${timestamp}]
**❓ Interviewer Question:** ${question}

${answer}

`;

  try {
    fs.appendFileSync(LOG_FILE_PATH, logEntry, "utf8");
    console.log(`[Session Log]: Q&A saved to ${LOG_FILE_PATH}`);
  } catch (err) {
    console.error("Failed to write to session log:", err);
  }
}

export async function generateAnswerCue(questionText, onChunkReceived) {
  const rawKey = getGroqApiKey();

  if (!rawKey) {
    onChunkReceived(
      "[Error: GROQ_API_KEY is missing. Ensure .env.local exists in C:\\Program Files\\CueAI Teleprompter\\resources]",
    );
    return;
  }

  if (!isInterviewQuestion(questionText)) {
    console.log(
      `[Intent Filter Ignored]: "${questionText}" is not a recognized question.`,
    );
    return;
  }

  // Cancel any prior active stream before starting a new request
  cancelCurrentStream();

  currentAbortController = new AbortController();

  try {
    // Instantiate Groq dynamically with resolved key
    const groq = new Groq({ apiKey: rawKey });

    const chatCompletion = await groq.chat.completions.create(
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Question: ${questionText}` },
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.1,
        max_completion_tokens: 350,
        top_p: 1,
        stream: true,
        reasoning_effort: "low",
      },
      { signal: currentAbortController.signal },
    );

    let fullAnswer = "";

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullAnswer += content;
        onChunkReceived(content);
      }
    }

    // Save Q&A to session log after complete response stream
    if (fullAnswer.trim()) {
      logSessionQA(questionText, fullAnswer);
    }
  } catch (error) {
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      console.log("[Stream Aborted]: Request successfully cancelled.");
      onChunkReceived("\n\n*[Stream Stopped]*");
    } else {
      console.error("Groq SDK Error:", error.message || error);
      onChunkReceived(
        `\n[API Error: ${error.message || "Request failed. Check GROQ_API_KEY in .env.local"}]`,
      );
    }
  } finally {
    currentAbortController = null;
  }
}
