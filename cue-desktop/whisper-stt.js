import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config({ path: ".env.local" });

const rawKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : "";
const groq = new Groq({ apiKey: rawKey });

const TECHNICAL_PROMPT =
  "Software Engineering, Java, OOPs, Object-Oriented Programming, String Pool, JavaScript, React, Node.js, Express, SQL, REST API, Data Structures, Algorithms, Hexaview.";

const IGNORED_PHRASES = [
  "thank you",
  "thanks",
  "bye",
  "subtitles by",
  "amara.org",
  "you",
  ".",
];

let audioBufferQueue = [];
let accumulatedLength = 0;
const TARGET_CHUNK_SIZE = 16000 * 5; // Accumulate ~5 seconds of audio

// Rate limit protection cooldown tracker
let lastApiCallTimestamp = 0;
const COOLDOWN_MS = 7000; // Minimum 7 seconds between Groq API requests to stay under 20 RPM limit

export async function initWhisper() {
  console.log(
    "Using Groq Cloud Whisper Large V3 for STT (Rate-Limit Protected).",
  );
  return true;
}

function createWavBuffer(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return Buffer.from(buffer);
}

export async function transcribeAudioBuffer(audioData) {
  if (!rawKey) return "";

  const floatArray =
    audioData instanceof Float32Array ? audioData : new Float32Array(audioData);

  audioBufferQueue.push(floatArray);
  accumulatedLength += floatArray.length;

  // Wait until we have accumulated enough audio data (~5 seconds)
  if (accumulatedLength < TARGET_CHUNK_SIZE) {
    return "";
  }

  // 🛑 RATE LIMIT GUARD: Check if we are calling Groq too fast (< 7 seconds apart)
  const now = Date.now();
  if (now - lastApiCallTimestamp < COOLDOWN_MS) {
    // Clear buffer so we don't build up stale audio during cooldown
    audioBufferQueue = [];
    accumulatedLength = 0;
    return "";
  }

  const mergedSamples = new Float32Array(accumulatedLength);
  let offset = 0;
  for (const chunk of audioBufferQueue) {
    mergedSamples.set(chunk, offset);
    offset += chunk.length;
  }

  audioBufferQueue = [];
  accumulatedLength = 0;

  const tempFilePath = path.join(os.tmpdir(), `audio_chunk_${Date.now()}.wav`);

  try {
    lastApiCallTimestamp = Date.now(); // Stamp time of request
    const wavBuffer = createWavBuffer(mergedSamples, 16000);
    fs.writeFileSync(tempFilePath, wavBuffer);

    const translation = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3",
      prompt: TECHNICAL_PROMPT,
      response_format: "json",
      language: "en",
      temperature: 0.0,
    });

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    let text = translation.text ? translation.text.trim() : "";
    const lowerText = text.toLowerCase();

    // Ignore filler words or short phrases that flood your logs and waste limits
    if (
      !text ||
      text.length < 8 ||
      IGNORED_PHRASES.some((phrase) => lowerText.includes(phrase))
    ) {
      return "";
    }

    return text;
  } catch (error) {
    console.error("Groq Whisper STT Error:", error?.message || error);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    return "";
  }
}
