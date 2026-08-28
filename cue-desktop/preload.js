const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  hideWindow: () => ipcRenderer.send("window-hide"),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),

  askAI: (questionText) => ipcRenderer.send("ask-ai", questionText),
  sendAudioChunk: (float32Array) =>
    ipcRenderer.send("process-audio-chunk", Array.from(float32Array)),
  resumeListenLock: () => ipcRenderer.send("resume-listen-lock"),

  onAIStart: (callback) => ipcRenderer.on("ai-start", () => callback()),
  onAIStreamChunk: (callback) =>
    ipcRenderer.on("ai-stream-chunk", (event, chunk) => callback(chunk)),
  onAIEnd: (callback) => ipcRenderer.on("ai-end", () => callback()),
  onStatusUpdate: (callback) =>
    ipcRenderer.on("status-update", (event, status) => callback(status)),

  onHotkeySTTToggle: (callback) =>
    ipcRenderer.on("trigger-hotkey-stt-toggle", () => callback()),

  // Add inside preload.js
  onClearCue: (callback) => ipcRenderer.on("clear-cue", () => callback()),
  cancelStream: () => ipcRenderer.send("cancel-ai-stream"),
});
