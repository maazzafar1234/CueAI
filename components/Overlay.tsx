"use client";

import { useEffect, useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Keyboard,
  Copy,
  Check,
  Minus,
  Square,
  X,
  Camera,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

interface AnswerData {
  success: boolean;
  rawText: string;
  answer: string;
  error?: string;
}

// Safe wrapper for electronAPI to prevent SSR/undefined crashes
const safeElectron = {
  setAppMode: (mode: string) => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.setAppMode
    ) {
      (window as any).electronAPI.setAppMode(mode);
    }
  },
  minimizeWindow: () => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.minimizeWindow
    ) {
      (window as any).electronAPI.minimizeWindow();
    }
  },
  maximizeWindow: () => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.maximizeWindow
    ) {
      (window as any).electronAPI.maximizeWindow();
    }
  },
  closeWindow: () => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.closeWindow
    ) {
      (window as any).electronAPI.closeWindow();
    }
  },
  onTriggerHotkeySttToggle: (cb: () => void) => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onTriggerHotkeySttToggle
    ) {
      return (window as any).electronAPI.onTriggerHotkeySttToggle(cb);
    }
  },
  onScreenAnswer: (cb: (data: AnswerData) => void) => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onScreenAnswer
    ) {
      return (window as any).electronAPI.onScreenAnswer(cb);
    }
  },
  onStatusUpdate: (cb: (status: string) => void) => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onStatusUpdate
    ) {
      return (window as any).electronAPI.onStatusUpdate(cb);
    }
  },
  onClearCue: (cb: () => void) => {
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onClearCue
    ) {
      return (window as any).electronAPI.onClearCue(cb);
    }
  },
};

export default function Overlay() {
  const [screenData, setScreenData] = useState<AnswerData | null>(null);
  const [voiceData, setVoiceData] = useState<AnswerData | null>(null);

  const [status, setStatus] = useState<string>("Ready");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [manualQuestion, setManualQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [codeCopiedIndex, setCodeCopiedIndex] = useState<number | null>(null);
  const [modeMismatchWarning, setModeMismatchWarning] = useState<string | null>(
    null,
  );

  const [activeTab, setActiveTab] = useState<"screen" | "voice-manual">(
    "screen",
  );

  const activeTabRef = useRef(activeTab);
  const isListeningRef = useRef(isListening);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  activeTabRef.current = activeTab;
  isListeningRef.current = isListening;

  const getApiBaseUrl = () => {
    if (typeof window !== "undefined") {
      const host = window.location.host.replace("localhost", "127.0.0.1");
      return `${window.location.protocol}//${host}`;
    }
    return "http://127.0.0.1:3000";
  };

  // Helper function to safely parse API responses and prevent JSON syntax crashes
  const safeParseResponse = async (response: Response) => {
    const text = await response.text();
    if (!text || text.trim() === "") {
      return { success: false, error: "Empty server response received." };
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      return {
        success: false,
        error: `Invalid server response: ${text.slice(0, 100)}`,
      };
    }
  };

  useEffect(() => {
    safeElectron.setAppMode(activeTab);
  }, [activeTab]);

  const handleTabSwitch = (tab: "screen" | "voice-manual") => {
    setActiveTab(tab);
    setModeMismatchWarning(null);
    setScreenData(null);
    setVoiceData(null);

    if (tab === "voice-manual") {
      setStatus("Voice Mode Ready");
    } else {
      setStatus("Ready");
      setIsListening(false);
    }
  };

  const currentData = activeTab === "screen" ? screenData : voiceData;

  // Safe System Audio Capture Hook
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startSystemAudioListen = async () => {
      try {
        setStatus("Listening for interviewer...");

        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("MediaDevices API not supported.");
        }

        activeStream = await navigator.mediaDevices.getUserMedia({
          audio: { mandatory: { chromeMediaSource: "desktop" } } as any,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              maxWidth: 1,
              maxHeight: 1,
            },
          } as any,
        });

        const audioTrack = activeStream?.getAudioTracks()[0];
        if (!audioTrack) {
          throw new Error("No system audio track found.");
        }
        const audioStream = new MediaStream([audioTrack]);

        const mediaRecorder = new MediaRecorder(audioStream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          activeStream?.getTracks().forEach((track) => track.stop());

          if (audioChunksRef.current.length === 0) {
            setIsListening(false);
            setStatus("Voice Paused");
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          audioChunksRef.current = [];

          setLoading(true);
          setStatus("Processing Interviewer Question...");

          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            const response = await fetch(`${getApiBaseUrl()}/api/voice-solve`, {
              method: "POST",
              body: formData,
            });

            const result = await safeParseResponse(response);
            const formattedData = {
              success: result.success ?? true,
              rawText: "Interviewer Voice",
              answer: result.answer || result.error || "No response generated.",
            };

            setVoiceData(formattedData);
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            setVoiceData({
              success: false,
              rawText: "Interviewer Voice",
              answer: errorMessage,
            });
          } finally {
            setLoading(false);
            setStatus("Voice Paused");
            setIsListening(false);
          }
        };

        mediaRecorder.start();

        setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
          }
        }, 6000);
      } catch (err) {
        console.error("System audio capture failed:", err);
        setStatus("Audio Permission Error");
        setIsListening(false);
      }
    };

    if (isListening) {
      startSystemAudioListen();
    } else {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    }

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isListening]);

  // Safe Event Listeners Binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (activeTabRef.current === "screen") {
          setModeMismatchWarning(
            "⚠️ You are in Screen OCR mode. Switch to Voice & Manual Ask mode to use this feature.",
          );
          setStatus("Mode Mismatch");
          return;
        }
        setModeMismatchWarning(null);
        setIsListening((prev) => !prev);
      }

      if (e.ctrlKey && e.shiftKey && (e.key === "X" || e.key === "x")) {
        e.preventDefault();
        setScreenData(null);
        setVoiceData(null);
        setLoading(false);
        setStatus("Ready");
        setModeMismatchWarning(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const cleanupToggle = safeElectron.onTriggerHotkeySttToggle(() => {
      if (activeTabRef.current === "screen") {
        setModeMismatchWarning(
          "⚠️ You are in Screen OCR mode. Switch to Voice & Manual Ask mode to use this feature.",
        );
        setStatus("Mode Mismatch");
        return;
      }
      setModeMismatchWarning(null);
      setIsListening((prev) => !prev);
    });

    const cleanupAnswer = safeElectron.onScreenAnswer((result: AnswerData) => {
      if (activeTabRef.current !== "screen") return;

      if (!result.success && result.rawText === "Action Blocked") {
        setModeMismatchWarning(result.answer);
        setStatus("Mode Mismatch");
        setLoading(false);
        return;
      }

      setModeMismatchWarning(null);
      setScreenData(result);
      setLoading(false);
      setStatus("Answer Ready");
    });

    const cleanupStatus = safeElectron.onStatusUpdate((newStatus: string) => {
      if (newStatus === "Mode Mismatch") {
        setModeMismatchWarning(
          activeTabRef.current === "voice-manual"
            ? "⚠️ You are in Voice & Manual Ask mode. Switch to Screen OCR mode to use this feature."
            : "⚠️ You are in Screen OCR mode. Switch to Voice & Manual Ask mode to use this feature.",
        );
        setStatus("Mode Mismatch");
        setLoading(false);
        return;
      }
      if (
        activeTabRef.current !== "screen" &&
        (newStatus.includes("Capturing") || newStatus.includes("OCR"))
      ) {
        return;
      }
      if (newStatus.includes("Capturing") || newStatus.includes("Thinking")) {
        setLoading(true);
        setStatus(newStatus);
      } else if (!newStatus.includes("Voice")) {
        setLoading(false);
        setStatus(newStatus);
      }
    });

    const cleanupClear = safeElectron.onClearCue(() => {
      setScreenData(null);
      setVoiceData(null);
      setLoading(false);
      setStatus("Ready");
      setModeMismatchWarning(null);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (typeof cleanupToggle === "function") cleanupToggle();
      if (typeof cleanupAnswer === "function") cleanupAnswer();
      if (typeof cleanupStatus === "function") cleanupStatus();
      if (typeof cleanupClear === "function") cleanupClear();
    };
  }, []);

  const handleAskManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim()) return;

    const currentQuery = manualQuestion;
    setManualQuestion("");
    setLoading(true);
    setStatus("Thinking...");

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/solve-screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capturedText: currentQuery }),
      });

      const result = await safeParseResponse(response);
      const formattedData = {
        success: result.success ?? true,
        rawText: currentQuery,
        answer: result.answer || result.error || "No response generated.",
      };

      if (activeTab === "screen") {
        setScreenData(formattedData);
      } else {
        setVoiceData(formattedData);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorData = {
        success: false,
        rawText: currentQuery,
        answer: `Connection Error: ${errorMessage}`,
      };

      if (activeTab === "screen") {
        setScreenData(errorData);
      } else {
        setVoiceData(errorData);
      }
    } finally {
      setLoading(false);
      setStatus("Answer Ready");
    }
  };

  const handleCopyText = () => {
    if (!currentData?.answer) return;
    navigator.clipboard.writeText(currentData.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-slate-950/95 text-white p-3 rounded-xl border border-slate-800 shadow-2xl flex flex-col justify-between">
      {/* HEADER BAR & WINDOW CONTROLS */}
      <div
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        className="flex items-center justify-between border-b border-slate-800/80 pb-2 cursor-move"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            CUEAI TELEPROMPTER
          </span>
        </div>

        <div
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="flex items-center gap-2"
        >
          <div className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-semibold">
            {loading ? "Thinking..." : status}
          </div>

          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => safeElectron.minimizeWindow()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => safeElectron.maximizeWindow()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => safeElectron.closeWindow()}
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className="my-2"
      >
        <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleTabSwitch("screen")}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === "screen"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Screen OCR (Alt + S)
          </button>
          <button
            onClick={() => handleTabSwitch("voice-manual")}
            className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === "voice-manual"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5 mx-auto">
              <MessageSquare className="w-3.5 h-3.5" />
              Voice & Manual Ask
            </span>
          </button>
        </div>
      </div>

      {/* MODE MISMATCH WARNING BANNER */}
      {modeMismatchWarning && (
        <div
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 px-3 py-2 rounded-lg mb-1 text-xs font-mono"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{modeMismatchWarning}</span>
        </div>
      )}

      {/* STATUS BANNER */}
      {activeTab === "voice-manual" && (
        <div
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg mb-1"
        >
          <span className="text-xs font-mono text-slate-300">
            Voice Mode:{" "}
            <strong
              className={isListening ? "text-emerald-400" : "text-amber-400"}
            >
              {isListening ? "LISTENING (Active)" : "PAUSED"}
            </strong>
          </span>
          <button
            onClick={() => setIsListening((prev) => !prev)}
            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition cursor-pointer ${
              isListening
                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            }`}
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
            <span>{isListening ? "Stop Listening" : "Start Voice"}</span>
          </button>
        </div>
      )}

      {/* ANSWER OUTPUT AREA */}
      <div
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className="flex-1 my-1 overflow-y-auto space-y-2 pr-1 text-left relative select-text"
      >
        {loading && (
          <div className="flex items-center gap-2 text-sm text-cyan-400 animate-pulse pt-4">
            <Sparkles className="w-4 h-4" />
            <span>Processing query...</span>
          </div>
        )}

        {!loading && currentData && (
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              {currentData.rawText && (
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 truncate max-w-[280px]">
                  <span className="text-emerald-400 font-bold">Query:</span>{" "}
                  {currentData.rawText}
                </div>
              )}
              <button
                onClick={handleCopyText}
                className="ml-auto px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1 transition border border-slate-700 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied All!" : "Copy All"}</span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 select-text cursor-text space-y-3">
              {currentData.answer
                .split(/```[\s\S]*?```/)
                .map((textPart, index) => {
                  const matchCodeBlock =
                    currentData.answer.match(/```([\s\S]*?)```/g);
                  const currentCodeBlock = matchCodeBlock
                    ? matchCodeBlock[index]
                    : null;
                  const rawCodeContent = currentCodeBlock
                    ? currentCodeBlock
                        .replace(/```[a-zA-Z]*\n?/g, "")
                        .replace(/```$/, "")
                    : null;

                  return (
                    <div key={index} className="space-y-2">
                      {textPart.trim() && (
                        <div className="whitespace-pre-wrap">{textPart}</div>
                      )}

                      {rawCodeContent && (
                        <div className="relative bg-slate-950 border border-slate-800 rounded-md p-3 my-2 group">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[10px] text-slate-400 font-mono">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider">
                              Solution Code
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(rawCodeContent);
                                setCodeCopiedIndex(index);
                                setTimeout(
                                  () => setCodeCopiedIndex(null),
                                  2000,
                                );
                              }}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              {codeCopiedIndex === index ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>
                                {codeCopiedIndex === index
                                  ? "Copied Code!"
                                  : "Copy Code"}
                              </span>
                            </button>
                          </div>
                          <pre className="overflow-x-auto text-emerald-400 whitespace-pre text-[11px] font-mono">
                            {rawCodeContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!loading && !currentData && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 pt-4">
            <Sparkles className="w-6 h-6 mb-1 text-slate-600" />
            {activeTab === "screen" ? (
              <p className="text-xs">
                Press <kbd className="text-emerald-400">Alt + S</kbd> to capture
                screen and solve questions.
              </p>
            ) : (
              <p className="text-xs">
                Press <kbd className="text-cyan-400">F9</kbd> or click Start
                Voice to listen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <div className="mb-2 p-1.5 bg-slate-900/90 border border-slate-800/80 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Keyboard className="w-3 h-3" />
            <span>Hotkeys:</span>
          </div>
          <div>
            <kbd className="bg-slate-800 text-emerald-400 px-1 rounded">
              Alt + S
            </kbd>{" "}
            OCR
          </div>
          <div>
            <kbd className="bg-slate-800 text-emerald-400 px-1 rounded">F9</kbd>{" "}
            Voice
          </div>
          <div>
            <kbd className="bg-slate-800 text-cyan-400 px-1 rounded">
              Ctrl + Shift + X
            </kbd>{" "}
            Clear
          </div>
        </div>

        <form onSubmit={handleAskManual} className="flex gap-2">
          <input
            type="text"
            value={manualQuestion}
            onChange={(e) => setManualQuestion(e.target.value)}
            placeholder="Type your interview question here..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono select-text"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
          >
            <Send className="w-3 h-3" /> Ask
          </button>
        </form>
      </div>
    </div>
  );
}
