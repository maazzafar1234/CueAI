import pkg from "electron";
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { generateAnswerCue, cancelCurrentStream } from "./ai-engine.js";
import { initWhisper } from "./whisper-stt.js";
import { captureAndExtractText } from "./screenCapture.js";
import { createServer } from "http";
import http from "http";
import next from "next";
import fs from "fs";
import os from "os";
import getPort from "get-port";

// 👇 CRITICAL SECURITY FLAGS TO PREVENT LOCALHOST BLOCKS & CRASHES
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("allow-insecure-localhost", "true");
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.commandLine.appendSwitch("web-security", "false");

// Ensure app user data path is set correctly before writing logs
const dataPath = app.getPath ? app.getPath("appData") : os.tmpdir();
const resolvedUserData = path.join(dataPath, "real-time-ai-assistant");
try {
  app.setPath("userData", resolvedUserData);
} catch (e) {}

// 👇 ROBUST LOGGING PATH: Uses userData folder when installed, project folder during development
const logDir = app.isPackaged ? app.getPath("userData") : process.cwd();
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (e) {}

const debugLogPath = path.join(logDir, "cueai-debug.txt");

const logDebug = (msg) => {
  if (
    typeof msg === "string" &&
    (msg.includes("Fast Refresh") ||
      msg.includes("webpack-internal") ||
      msg.includes("preloaded using link preload"))
  ) {
    return;
  }

  const formatted = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(debugLogPath, formatted);
  } catch (e) {
    console.error("Log error:", e);
  }
};

// 👇 UPGRADED CONSOLE ERROR INTERCEPTOR TO CAPTURE REAL ERROR DETAILS
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMsg = args
    .map((arg) => {
      if (arg instanceof Error) {
        return `[Error] ${arg.message}\nStack: ${arg.stack}`;
      }
      if (typeof arg === "object" && arg !== null) {
        try {
          // If it's a Next.js internal error object with message/err properties
          return arg.message
            ? `${arg.message}\n${arg.stack || ""}`
            : JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  logDebug(`🔥 [Detailed Server Error]: ${errorMsg}`);
  originalConsoleError(...args);
};

try {
  fs.writeFileSync(debugLogPath, "--- CUEAI APP STARTING ---\n");
  logDebug(`Log file initialized successfully at: ${debugLogPath}`);
} catch (e) {
  console.error("Init log error:", e);
}

process.on("uncaughtException", (error) => {
  logDebug(`🔥 FATAL CRASH: ${error?.stack || error}`);
});

process.on("unhandledRejection", (reason) => {
  logDebug(`🔥 UNHANDLED REJECTION: ${reason?.stack || reason}`);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

let overlayWindow = null;
let currentAppMode = "screen";
const dev = !app.isPackaged;

let nextAppDir = __dirname;
if (!dev) {
  const unpackedDir = path.join(process.resourcesPath, "app.asar.unpacked");
  const standardAppDir = path.join(process.resourcesPath, "app");
  const unpackedNext = path.join(unpackedDir, ".next");
  const standardNext = path.join(standardAppDir, ".next");

  if (fs.existsSync(unpackedNext)) {
    nextAppDir = unpackedDir;
  } else if (fs.existsSync(standardNext)) {
    nextAppDir = standardAppDir;
  } else {
    nextAppDir = path.join(process.resourcesPath, "app.asar");
  }
}

const nextApp = dev ? null : next({ dev: false, dir: nextAppDir });
const handle = dev ? null : nextApp.getRequestHandler();

function createTeleprompterWindow(activePort) {
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
    frame: false,
    transparent: true,
    backgroundColor: "#222222",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  overlayWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      logDebug(`[Renderer Console] ${message} (Source: ${sourceId}:${line})`);
    },
  );

  overlayWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      logDebug(
        `🔥 Did Fail Load: ${errorDescription} (${errorCode}) for URL: ${validatedURL}`,
      );
    },
  );

  overlayWindow.webContents.on("render-process-gone", (event, details) => {
    logDebug(`🔥 Renderer Process Gone: ${JSON.stringify(details)}`);
  });

  overlayWindow.setContentProtection(true);

  const targetPort = dev ? 3000 : activePort;
  const startUrl =
    process.env.ELECTRON_START_URL || `http://127.0.0.1:${targetPort}/overlay`;
  logDebug(`Target URL: ${startUrl}`);

  const pollServerAndLoad = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;

    logDebug("Checking if Next.js server is ready...");

    http
      .get(startUrl, (res) => {
        res.resume();
        logDebug("Server is up and responding! Loading window URL...");
        overlayWindow.loadURL(startUrl).catch((err) => {
          logDebug(`Load URL error: ${err}`);
        });
      })
      .on("error", () => {
        logDebug("Server not ready yet, retrying in 1 second...");
        setTimeout(pollServerAndLoad, 1000);
      });
  };

  pollServerAndLoad();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

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
      overlayWindow?.webContents.send("status-update", "Mode Mismatch");
      return;
    }
    overlayWindow?.webContents.send("trigger-hotkey-stt-toggle");
  });

  globalShortcut.register("Alt+S", async () => {
    if (currentAppMode === "voice-manual") {
      overlayWindow?.webContents.send("status-update", "Mode Mismatch");
      return;
    }

    try {
      overlayWindow?.webContents.send(
        "status-update",
        "Capturing screen & running OCR...",
      );
      const extractedText = await captureAndExtractText();

      if (!extractedText || extractedText.length === 0) {
        overlayWindow?.webContents.send(
          "status-update",
          "No text detected on screen",
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:${targetPort}/api/solve-screen`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capturedText: extractedText }),
        },
      );

      const data = await response.json();
      overlayWindow?.webContents.send("screen-answer-ready", data);
      overlayWindow?.webContents.send("status-update", "Screen Answer Ready");
    } catch (err) {
      logDebug(`Alt+S capture failed: ${err}`);
      overlayWindow?.webContents.send(
        "status-update",
        "Error capturing screen",
      );
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
  event.sender.send("ai-start");
  await generateAnswerCue(questionText, (chunk) => {
    event.sender.send("ai-stream-chunk", chunk);
  });
  event.sender.send("ai-end");
});

ipcMain.on("cancel-ai-stream", () => {
  cancelCurrentStream();
  overlayWindow?.webContents.send("status-update", "Stream Cancelled");
});

app.whenReady().then(async () => {
  logDebug("App is ready, initializing services...");

  try {
    await initWhisper();
    logDebug("Whisper STT initialized successfully.");
  } catch (whisperErr) {
    logDebug(`⚠️ Whisper STT initialization warning: ${whisperErr}`);
  }

  const activePort = await getPort({ port: 3000 });
  logDebug(`Allocated active server port: ${activePort}`);

  if (dev) {
    logDebug("Running in Development Mode");
    const heartbeat = setInterval(() => {}, 60000);
    heartbeat.unref();

    createTeleprompterWindow(activePort);
  } else {
    logDebug("Running in Production Mode");
    try {
      logDebug(`Next app dir resolved to: ${nextAppDir}`);

      await nextApp.prepare();
      logDebug("Next.js prepared successfully.");

      const server = createServer(async (req, res) => {
        try {
          await handle(req, res);
        } catch (err) {
          logDebug(`🔥 Next.js Request Error: ${err?.stack || err}`);
          res.statusCode = 500;
          res.end(`Internal Server Error: ${err.message}`);
        }
      });

      server.listen(activePort, "127.0.0.1", () => {
        logDebug(
          `Production server listening on http://127.0.0.1:${activePort}`,
        );
        createTeleprompterWindow(activePort);
      });

      server.on("error", (e) => {
        logDebug(`🔥 Server level error: ${e.code}`);
      });
    } catch (nextErr) {
      logDebug(
        `🔥 FATAL Next.js preparation failed: ${nextErr?.stack || nextErr}`,
      );
    }
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  logDebug("All windows closed. Quitting application.");
  if (process.platform !== "darwin") {
    app.quit();
  }
});
