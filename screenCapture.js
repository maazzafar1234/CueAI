import screenshot from "screenshot-desktop";
import Tesseract from "tesseract.js";
import fs from "fs";
import path from "path";
import os from "os";

export async function captureAndExtractText() {
  try {
    // Captures the entire primary screen buffer
    const imgBuffer = await screenshot({ format: "png" });

    // Extracts full text via Tesseract OCR
    const {
      data: { text },
    } = await Tesseract.recognize(imgBuffer, "eng");

    return text.trim();
  } catch (error) {
    console.error("Screen capture / OCR error:", error);

    // Write detailed error log to user directory for packaged debugging
    try {
      const logPath = path.join(os.homedir(), "cueai-error.log");
      fs.appendFileSync(
        logPath,
        `Screen Capture Error: ${error.stack || error}\n`,
      );
    } catch (logErr) {
      console.error("Failed to write to error log:", logErr);
    }

    throw error;
  }
}
