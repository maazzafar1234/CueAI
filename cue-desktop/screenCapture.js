import screenshot from "screenshot-desktop";
import Tesseract from "tesseract.js";

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
    throw error;
  }
}
