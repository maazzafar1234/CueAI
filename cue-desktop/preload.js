const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setAppMode: (mode) => ipcRenderer.send("set-app-mode", mode),
  onTriggerHotkeySttToggle: (callback) =>
    ipcRenderer.on("trigger-hotkey-stt-toggle", callback),
  onScreenAnswer: (callback) =>
    ipcRenderer.on("screen-answer-ready", (event, data) => callback(data)),
  onAIStart: (callback) => ipcRenderer.on("ai-start", callback),
  onAIStreamChunk: (callback) =>
    ipcRenderer.on("ai-stream-chunk", (event, chunk) => callback(chunk)),
  onAIEnd: (callback) => ipcRenderer.on("ai-end", callback),
  onStatusUpdate: (callback) =>
    ipcRenderer.on("status-update", (event, text) => callback(text)),
  onClearCue: (callback) => ipcRenderer.on("clear-cue", callback),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
});
