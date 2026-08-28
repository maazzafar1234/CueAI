import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config({ path: ".env.local" });

const rawKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : "";

const groq = new Groq({ apiKey: rawKey });

// Technical domain prompt to prevent technical name misinterpretations
const TECHNICAL_PROMPT =
  "Software Engineering, Java, OOPs, Object-Oriented Programming, String Pool, JavaScript, React, Node.js, Express, SQL, REST API, Data Structures, Algorithms, Hexaview.";

// List of common hallucinations output by Whisper when transcribing background noise/silence
const HALLUCINATION_PHRASES = [
  "thank you for watching",
  "thanks for watching",
  "subscribe",
  "bye",
  "subtitles by",
  "amara.org",
  "you",
  ".",
];

export async function initWhisper() {
  console.log("Using Groq Cloud Whisper Large V3 for STT.");
  return true;
}

/**
 * Calculates audio energy (RMS) to skip silent audio chunks.
 */
function calculateRMS(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Encodes PCM Float32 audio data into a 16kHz WAV buffer
 */
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

  // 1. Ignore short audio buffers (< 1 second of audio at 16kHz)
  if (floatArray.length < 16000) {
    return "";
  }

  // 2. Ignore silent buffers using Voice Activity Gate (RMS Threshold)
  const rms = calculateRMS(floatArray);
  if (rms < 0.015) {
    // Threshold for background ambient noise
    return "";
  }

  const tempFilePath = path.join(os.tmpdir(), `audio_chunk_${Date.now()}.wav`);

  try {
    const wavBuffer = createWavBuffer(floatArray, 16000);
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

    // 3. Filter out Whisper silent background noise hallucinations
    const lowerText = text.toLowerCase();
    if (
      HALLUCINATION_PHRASES.some(
        (phrase) => lowerText === phrase || lowerText.startsWith(phrase),
      )
    ) {
      return "";
    }

    // 4. Ensure minimum string length to prevent single-word triggers
    if (text.length < 5) {
      return "";
    }

    return text;
  } catch (error) {
    console.error("Groq Whisper STT Error:", error.message || error);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    return "";
  }
}
