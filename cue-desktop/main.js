import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateAnswerCue, cancelCurrentStream } from "./ai-engine.js";
import { initWhisper, transcribeAudioBuffer } from "./whisper-stt.js";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let overlayWindow;
let isWhisperReady = false;
let isProcessingAnswer = false;

function createStealthOverlay() {
  overlayWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile("index.html");

  overlayWindow.setContentProtection(true);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");

  // Grant session audio permissions automatically
  overlayWindow.webContents.session.setPermissionCheckHandler(() => true);
  overlayWindow.webContents.session.setPermissionRequestHandler((wc, p, cb) =>
    cb(true),
  );

  // Global Hotkey 1: Ctrl+Shift+H to Hide/Show Window
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (overlayWindow.isVisible()) overlayWindow.hide();
    else {
      overlayWindow.show();
      overlayWindow.focus();
    }
  });

  // Global Hotkey 2: Ctrl+Space to Toggle Whisper STT Recording
  globalShortcut.register("CommandOrControl+Space", () => {
    if (overlayWindow) {
      overlayWindow.webContents.send("trigger-hotkey-stt-toggle");
    }
  });

  // Global Hotkey 3: Ctrl+Escape to Emergency Cancel AI Streaming
  globalShortcut.register("CommandOrControl+Alt+S", () => {
    const wasCancelled = cancelCurrentStream();
    isProcessingAnswer = false;
    if (overlayWindow) {
      overlayWindow.webContents.send(
        "status-update",
        wasCancelled ? "Stream Cancelled" : "No active stream to cancel",
      );
    }
  });

  // Global Hotkey 4: Ctrl+Shift+X to Clear Teleprompter Screen
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    cancelCurrentStream();
    isProcessingAnswer = false;
    if (overlayWindow) {
      overlayWindow.webContents.send("clear-cue");
      overlayWindow.webContents.send("status-update", "Screen Cleared");
    }
  });
}

// Window Management IPC Handlers
ipcMain.on("window-minimize", () => overlayWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (overlayWindow?.isMaximized()) overlayWindow.unmaximize();
  else overlayWindow?.maximize();
});
ipcMain.on("window-hide", () => overlayWindow?.hide());
ipcMain.on("window-close", () => overlayWindow?.close());

// Receive Audio Buffer for Local Whisper Processing
ipcMain.on("process-audio-chunk", async (event, floatArray) => {
  if (!isWhisperReady || isProcessingAnswer) return;

  const float32Data = new Float32Array(floatArray);
  const text = await transcribeAudioBuffer(float32Data);

  if (text) {
    isProcessingAnswer = true;
    console.log("Interviewer Voice Captured:", text);
    overlayWindow.webContents.send("status-update", `Captured: "${text}"`);

    overlayWindow.webContents.send("ai-start");
    await generateAnswerCue(text, (chunk) => {
      overlayWindow.webContents.send("ai-stream-chunk", chunk);
    });

    overlayWindow.webContents.send("ai-end");
    isProcessingAnswer = false;
  }
});

// Manual Input Trigger Handler
ipcMain.on("ask-ai", async (event, questionText) => {
  isProcessingAnswer = true;
  event.sender.send("ai-start");
  await generateAnswerCue(questionText, (chunk) => {
    event.sender.send("ai-stream-chunk", chunk);
  });
  event.sender.send("ai-end");
  isProcessingAnswer = false;
});

ipcMain.on("cancel-ai-stream", () => {
  cancelCurrentStream();
  isProcessingAnswer = false;
  overlayWindow?.webContents.send("status-update", "Stream Cancelled");
});

ipcMain.on("resume-listen-lock", () => {
  isProcessingAnswer = false;
});

app.whenReady().then(async () => {
  createStealthOverlay();
  console.log("Loading local Whisper model...");
  try {
    await initWhisper();
    isWhisperReady = true;
    console.log("Whisper model loaded successfully.");
    overlayWindow.webContents.send("status-update", "Whisper STT Ready");
  } catch (err) {
    console.error("Failed to load Whisper model:", err);
    overlayWindow.webContents.send("status-update", "Whisper STT Load Error");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
