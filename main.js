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
import fs from "fs";
import os from "os";

process.on("uncaughtException", (error) => {
  const logPath = path.join(os.homedir(), "cueai-error.log");
  fs.writeFileSync(logPath, `Crash: ${error.stack || error}\n`);
});

// SINGLE-INSTANCE LOCK: Prevents background multi-window spawns completely
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (overlayWindow) {
      if (overlayWindow.isMinimized()) overlayWindow.restore();
      overlayWindow.show();
      overlayWindow.focus();
    }
  });
}

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let overlayWindow;
let isProcessingAnswer = false;
let currentAppMode = "screen";
let serverPort = 3000;

const dev = !app.isPackaged;

const nextDir = dev
  ? __dirname
  : path.join(process.resourcesPath, "app.asar.unpacked");

const finalDir = fs.existsSync(nextDir)
  ? nextDir
  : path.join(process.resourcesPath, "app");

const nextApp = next({ dev, dir: finalDir });
const handle = nextApp.getRequestHandler();

function createStealthOverlay(activePort = serverPort) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.focus();
    return;
  }

  overlayWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true, // Hides it from the Windows taskbar and Alt-Tab switcher
    resizable: true,
    hasShadow: false,
    show: false, // Don't show until fully loaded to prevent flickering
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Prevents throttling when out of focus
    },
  });

  // 1. BLOCKS SCREEN SHARE RECORDING (Zoom, Teams, Meet, OBS)
  overlayWindow.setContentProtection(true);

  // 2. MAKES THE WINDOW CLICK-THROUGH OPTIONAL IF DESIRED (or keeps it focused)
  // overlayWindow.setIgnoreMouseEvents(false);

  const startUrl = `http://localhost:${activePort}/overlay`;
  overlayWindow
    .loadURL(startUrl)
    .then(() => {
      overlayWindow.show();
      overlayWindow.focus();
    })
    .catch((err) => {
      console.error("[Electron] Failed to load overlay URL:", err);
    });

  // ... (rest of your global shortcuts and IPC handlers remain the same)

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

  globalShortcut.register("F9", () => {
    if (currentAppMode !== "voice-manual") {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send("status-update", "Mode Mismatch");
      }
      return;
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send("trigger-hotkey-stt-toggle");
    }
  });

  globalShortcut.register("Alt+S", async () => {
    if (currentAppMode === "voice-manual") {
      if (overlayWindow)
        overlayWindow.webContents.send("status-update", "Mode Mismatch");
      return;
    }

    try {
      if (overlayWindow) {
        overlayWindow.webContents.send(
          "status-update",
          "Capturing screen & running OCR...",
        );
      }

      const extractedText = await captureAndExtractText();

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
        `http://localhost:${activePort}/api/solve-screen`,
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
  if (dev) {
    createStealthOverlay(serverPort);
  } else {
    try {
      await nextApp.prepare();
      const server = createServer((req, res) => {
        handle(req, res);
      });

      server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
          server.listen(0, () => {
            const assignedPort = server.address().port;
            createStealthOverlay(assignedPort);
          });
        }
      });

      server.listen(serverPort, () => {
        createStealthOverlay(serverPort);
      });
    } catch (err) {
      console.error("[Electron] Failed to start server:", err);
    }
  }

  initWhisper().catch(() => {});
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
