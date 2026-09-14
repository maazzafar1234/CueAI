import pkg from "electron";
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = pkg;
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

const debugLogPath = path.join(os.homedir(), "Desktop", "cueai-debug.txt");
fs.writeFileSync(debugLogPath, "--- APP STARTING ---\n");

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  fs.appendFileSync(debugLogPath, "[LOG] " + args.join(" ") + "\n");
  originalLog(...args);
};
console.error = (...args) => {
  fs.appendFileSync(debugLogPath, "[ERR] " + args.join(" ") + "\n");
  originalError(...args);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
  const logPath = path.join(app.getPath("desktop"), "cueai-unhandled.txt");
  fs.writeFileSync(
    logPath,
    `Unhandled Rejection: ${reason?.stack || reason}\n`,
  );
});

process.on("uncaughtException", (error) => {
  console.error("🔥 FATAL UNCATCHED EXCEPTION:", error);
  const logPath = path.join(app.getPath("desktop"), "cueai-crash.txt");
  fs.writeFileSync(logPath, `Crash: ${error?.stack || error}\n`);
  app.quit();
});

const envPaths = [
  process.resourcesPath ? path.join(process.resourcesPath, ".env.local") : null,
  process.resourcesPath
    ? path.join(process.resourcesPath, "app", ".env.local")
    : null,
  path.join(process.cwd(), ".env.local"),
  path.join(__dirname, ".env.local"),
].filter(Boolean);

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  dotenv.config({ path: ".env.local" });
}

app.setPath(
  "userData",
  path.join(app.getPath("appData"), "real-time-ai-assistant-dev"),
);

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayWindow.isMinimized()) overlayWindow.restore();
      overlayWindow.center();
      overlayWindow.show();
      overlayWindow.focus();
    }
  });
}

let overlayWindow;
let isProcessingAnswer = false;
let currentAppMode = "screen";
let serverPort = 3000;

const dev = !app.isPackaged;

let nextAppDir = __dirname;
if (!dev) {
  const unpackedDir = path.join(process.resourcesPath, "app.asar.unpacked");
  const standardAppDir = path.join(process.resourcesPath, "app");

  if (fs.existsSync(path.join(unpackedDir, ".next"))) {
    nextAppDir = unpackedDir;
  } else if (fs.existsSync(path.join(standardAppDir, ".next"))) {
    nextAppDir = standardAppDir;
  }
}

const nextApp = dev ? null : next({ dev, dir: nextAppDir });
const handle = dev ? null : nextApp.getRequestHandler();

function createTeleprompterWindow(activePort = serverPort) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.center();
    overlayWindow.show();
    overlayWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: Math.floor((screenWidth - 600) / 2),
    y: Math.floor((screenHeight - 500) / 2),
    frame: true,
    transparent: false,
    backgroundColor: "#222222",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  overlayWindow.setContentProtection(true);

  const startUrl =
    process.env.ELECTRON_START_URL || `http://127.0.0.1:${activePort}/overlay`;

  console.log(`[Electron] Loading URL: ${startUrl}`);

  // Self-healing retry loop properly scoped inside the creation function
  const loadWithRetry = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;

    overlayWindow
      .loadURL(startUrl)
      .then(() => {
        console.log("[Electron] Overlay window loaded successfully!");
      })
      .catch(() => {
        setTimeout(loadWithRetry, 1000);
      });
  };

  loadWithRetry();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  // Global shortcuts configuration scoped correctly
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.center();
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
      if (overlayWindow && !overlayWindow.isDestroyed())
        overlayWindow.webContents.send("status-update", "Mode Mismatch");
      return;
    }

    try {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send(
          "status-update",
          "Capturing screen & running OCR...",
        );
      }

      const extractedText = await captureAndExtractText();

      if (!extractedText || extractedText.length === 0) {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send(
            "status-update",
            "No text detected on screen",
          );
        }
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:${activePort}/api/solve-screen`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capturedText: extractedText }),
        },
      );

      const data = await response.json();

      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send("screen-answer-ready", data);
        overlayWindow.webContents.send("status-update", "Screen Answer Ready");
      }
    } catch (err) {
      console.error("[Electron] Alt+S capture failed:", err);
      if (overlayWindow && !overlayWindow.isDestroyed()) {
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

app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("allow-insecure-localhost", "true");

app
  .whenReady()
  .then(async () => {
    console.log("[Electron-Dev] App is ready, initializing services...");

    try {
      console.log("[Electron-Dev] Initializing Whisper STT...");
      await initWhisper();
      console.log("[Electron-Dev] Whisper STT initialized successfully.");
    } catch (whisperErr) {
      console.warn("⚠️ Whisper STT initialization warning:", whisperErr);
    }

    if (dev) {
      console.log("[Electron-Dev] Launching teleprompter window...");
      createTeleprompterWindow(serverPort);

      // 👇 ADD THIS HEARTBEAT INTERVAL TO KEEP TERMINAL/EVENT LOOP ALIVE
      setInterval(() => {
        // Keeps the Node event loop active so the process doesn't exit
      }, 60000);
    } else {
      await nextApp.prepare();
      const server = createServer(async (req, res) => {
        try {
          await handle(req, res);
        } catch (err) {
          console.error("Next.js request handling error:", err);
        }
      });

      server.listen(serverPort, "127.0.0.1", () => {
        console.log(
          `[Electron-Prod] Server running on http://127.0.0.1:${serverPort}`,
        );
        createTeleprompterWindow(serverPort);
      });
    }
  })
  .catch((err) => {
    console.error("🔥 Fatal app.whenReady error:", err);
  });

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
