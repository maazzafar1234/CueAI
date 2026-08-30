import pkg from "electron";
const { app, BrowserWindow, globalShortcut, ipcMain } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateAnswerCue, cancelCurrentStream } from "./ai-engine.js";
import { initWhisper } from "./whisper-stt.js";
import { captureAndExtractText } from "./screenCapture.js";
import { createServer } from "http";
import next from "next";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let overlayWindow;
let isProcessingAnswer = false;
let currentAppMode = "screen";
let serverPort = 3000;

// Since Next.js is pre-built via npm script, we run in production mode to serve statically built pages instantly
const dev = process.env.NODE_ENV !== "production";
const parentDir = path.join(__dirname, "..");
const nextApp = next({ dev, dir: __dirname });
const handle = nextApp.getRequestHandler();

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

  const startUrl = `http://localhost:${serverPort}/overlay`;
  overlayWindow.loadURL(startUrl).catch((err) => {
    console.error("[Electron] Failed to load overlay URL:", err);
  });

  overlayWindow.setContentProtection(true);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");

  overlayWindow.webContents.session.setPermissionCheckHandler(() => true);
  overlayWindow.webContents.session.setPermissionRequestHandler((wc, p, cb) =>
    cb(true),
  );

  // Global Shortcuts
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.show();
        overlayWindow.focus();
      }
    }
  });

  // Global Shortcut for toggling STT via hotkey F9
  globalShortcut.register("F9", () => {
    if (currentAppMode !== "voice-manual") {
      console.log("[Electron] F9 blocked: User is in Screen OCR mode.");
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send("status-update", "Mode Mismatch");
      }
      return;
    }

    if (overlayWindow && !overlayWindow.isDestroyed()) {
      console.log("[Electron] Triggering hotkey STT toggle via F9...");
      overlayWindow.webContents.send("trigger-hotkey-stt-toggle");
    }
  });

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

  globalShortcut.register("CommandOrControl+Shift+X", () => {
    cancelCurrentStream();
    isProcessingAnswer = false;
    if (overlayWindow) {
      overlayWindow.webContents.send("clear-cue");
      overlayWindow.webContents.send("status-update", "Screen Cleared");
    }
  });

  globalShortcut.register("Alt+S", async () => {
    if (currentAppMode === "voice-manual") {
      console.log("[Electron] Alt+S blocked: User is in Voice mode.");
      if (overlayWindow) {
        overlayWindow.webContents.send("status-update", "Mode Mismatch");
      }
      return;
    }

    console.log("[Electron] Alt+S pressed! Capturing screen silently...");

    try {
      if (overlayWindow) {
        overlayWindow.webContents.send(
          "status-update",
          "Capturing screen & running OCR...",
        );
      }

      const extractedText = await captureAndExtractText();
      console.log("[Electron] Extracted Screen Text:", extractedText);

      if (!extractedText || extractedText.length === 0) {
        if (overlayWindow) {
          overlayWindow.webContents.send(
            "status-update",
            "No text detected on screen",
          );
        }
        return;
      }

      const response = await fetch(
        `http://localhost:${serverPort}/api/solve-screen`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capturedText: extractedText }),
        },
      );

      const data = await response.json();

      if (overlayWindow) {
        overlayWindow.webContents.send("screen-answer-ready", data);
        overlayWindow.webContents.send("status-update", "Screen Answer Ready");
      }
    } catch (err) {
      console.error("[Electron] Alt+S capture failed:", err);
      if (overlayWindow) {
        overlayWindow.webContents.send(
          "status-update",
          "Error capturing screen",
        );
      }
    }
  });
}

ipcMain.on("set-app-mode", (event, mode) => {
  currentAppMode = mode;
  console.log(`[Electron] App mode successfully updated to: ${currentAppMode}`);
});

ipcMain.on("window-minimize", () => overlayWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (overlayWindow?.isMaximized()) overlayWindow.unmaximize();
  else overlayWindow?.maximize();
});
ipcMain.on("window-hide", () => overlayWindow?.hide());
ipcMain.on("window-close", () => overlayWindow?.close());

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

app.whenReady().then(async () => {
  console.log("[Electron] Preparing Next.js server...");

  try {
    await nextApp.prepare();

    createServer((req, res) => {
      handle(req, res);
    }).listen(serverPort, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${serverPort}`);
      createStealthOverlay();
    });
  } catch (err) {
    console.error("[Electron] Failed to start Next.js server:", err);
  }

  initWhisper()
    .then(() => {
      console.log("[Electron] Whisper STT Ready");
      overlayWindow?.webContents.send("status-update", "Whisper STT Ready");
    })
    .catch((err) => {
      console.error("Failed to load Whisper model:", err);
    });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
