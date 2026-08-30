export {};

export interface ScreenAnswerData {
  success: boolean;
  rawText: string;
  answer: string;
  error?: string;
}

export interface ElectronAPI {
  // Screen Answer Receiver (Alt + S)
  onScreenAnswer: (callback: (data: ScreenAnswerData) => void) => void;

  // Window Controls
  hideWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // AI & Audio Pipeline
  askAI: (questionText: string) => void;
  sendAudioChunk: (float32Array: Float32Array) => void;
  resumeListenLock: () => void;
  cancelStream: () => void;

  // Event Receivers for React UI (Includes both uppercase and camelCase variants)
  onAIStart: (callback: () => void) => void;
  onAiStart: (callback: () => void) => void;

  onAIStreamChunk: (callback: (chunk: string) => void) => void;
  onAiStreamChunk: (callback: (chunk: string) => void) => void;

  onAIEnd: (callback: () => void) => void;
  onAiEnd: (callback: () => void) => void;

  onStatusUpdate: (callback: (status: string) => void) => void;

  // STT Toggle Shortcut Listeners
  onHotkeySTTToggle: (callback: () => void) => void;
  onTriggerHotkeySttToggle: (callback: () => void) => void;

  onClearCue: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
