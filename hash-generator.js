import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated directory path from 'dist' to 'release-builds' (and subfolder if electron-builder creates one like win-unpacked or win-x64)
const filePath = path.join(
  __dirname,
  "release-builds",
  "win-unpacked",
  "CueAI Teleprompter.exe",
);
// Note: If you are pointing to the installer instead, change path to the .exe installer in 'release-builds' directly.

try {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256").update(fileBuffer);
  const hex = hashSum.digest("hex");
  console.log("--- Build File Verification ---");
  console.log("File:", filePath);
  console.log("SHA-256 Hash:", hex);
} catch (err) {
  console.error("Error reading file for hashing:", err.message);
}
