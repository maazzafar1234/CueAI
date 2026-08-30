const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setAppMode: (mode) => ipcRenderer.send("set-app-mode", mode),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  hideWindow: () => ipcRenderer.send("window-hide"),
  closeWindow: () => ipcRenderer.send("window-close"),

  // Updated to support proper cleanup and prevent stacking duplicate listeners
  onTriggerHotkeySttToggle: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on("trigger-hotkey-stt-toggle", subscription);
    return () => {
      ipcRenderer.removeListener("trigger-hotkey-stt-toggle", subscription);
    };
  },

  onScreenAnswer: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("screen-answer-ready", subscription);
    return () =>
      ipcRenderer.removeListener("screen-answer-ready", subscription);
  },

  onAIStart: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on("ai-start", subscription);
    return () => ipcRenderer.removeListener("ai-start", subscription);
  },

  onAIStreamChunk: (callback) => {
    const subscription = (event, chunk) => callback(chunk);
    ipcRenderer.on("ai-stream-chunk", subscription);
    return () => ipcRenderer.removeListener("ai-stream-chunk", subscription);
  },

  onAIEnd: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on("ai-end", subscription);
    return () => ipcRenderer.removeListener("ai-end", subscription);
  },

  onStatusUpdate: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on("status-update", subscription);
    return () => ipcRenderer.removeListener("status-update", subscription);
  },

  onClearCue: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on("clear-cue", subscription);
    return () => ipcRenderer.removeListener("clear-cue", subscription);
  },
});
