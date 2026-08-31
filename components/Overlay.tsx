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

export default function Overlay() {
  const [screenData, setScreenData] = useState<AnswerData | null>(null);
  const [voiceData, setVoiceData] = useState<AnswerData | null>(null);

  const [status, setStatus] = useState<string>("Ready");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [manualQuestion, setManualQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
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

  // Keep refs synchronized instantly on every render
  activeTabRef.current = activeTab;
  isListeningRef.current = isListening;

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.electronAPI &&
      (window.electronAPI as any).setAppMode
    ) {
      (window.electronAPI as any).setAppMode(activeTab);
    }
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

  // 🎙️ Reliable System Audio Capture (Interviewer Voice Loopback)
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startSystemAudioListen = async () => {
      try {
        setStatus("Listening for interviewer...");

        stream = await (navigator.mediaDevices as any).getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "desktop",
            },
          },
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              maxWidth: 1,
              maxHeight: 1,
            },
          },
        });

        const audioTrack = stream?.getAudioTracks()[0];
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
          if (stream) {
            // FIX: Added optional chaining to prevent 'stream is possibly null' error
            stream?.getTracks().forEach((track) => track.stop());
          }

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

            const response = await fetch(
              "http://localhost:3000/api/voice-solve",
              {
                method: "POST",
                body: formData,
              },
            );

            const result = await response.json();
            if (result.error) {
              setVoiceData({
                success: false,
                rawText: "Interviewer Voice",
                answer: result.error,
              });
            } else {
              setVoiceData(result);
            }
          } catch (err: any) {
            setVoiceData({
              success: false,
              rawText: "Interviewer Voice",
              answer: err.message,
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

  // 🔌 Bulletproof Dual Listener (Native DOM Keydown + Electron IPC)
  useEffect(() => {
    // Handle F9 natively in browser window to bypass dead IPC routing states
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
    };

    window.addEventListener("keydown", handleKeyDown);

    if (typeof window === "undefined" || !window.electronAPI) {
      return () => window.removeEventListener("keydown", handleKeyDown);
    }

    const cleanupToggle = window.electronAPI.onTriggerHotkeySttToggle?.(() => {
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

    const cleanupAnswer = window.electronAPI.onScreenAnswer(
      (result: AnswerData) => {
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
      },
    );

    const cleanupStatus = window.electronAPI.onStatusUpdate(
      (newStatus: string) => {
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
      },
    );

    const cleanupClear = window.electronAPI.onClearCue(() => {
      setScreenData(null);
      setVoiceData(null);
      setLoading(false);
      setStatus("Ready");
      setModeMismatchWarning(null);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // FIX: Safely invoke cleanup functions using optional call typing safeguards
      if (typeof cleanupToggle === "function") {
        (cleanupToggle as unknown as () => void)?.();
      }
      if (typeof cleanupAnswer === "function") {
        (cleanupAnswer as unknown as () => void)?.();
      }
      if (typeof cleanupStatus === "function") {
        (cleanupStatus as unknown as () => void)?.();
      }
      if (typeof cleanupClear === "function") {
        (cleanupClear as unknown as () => void)?.();
      }
    };
  }, []);

  const handleAskManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim()) return;

    setLoading(true);
    setStatus("Thinking...");

    try {
      const response = await fetch("http://localhost:3000/api/solve-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capturedText: manualQuestion }),
      });

      const result = await response.json();
      if (result.error) {
        setVoiceData({
          success: false,
          rawText: manualQuestion,
          answer: result.error,
        });
      } else {
        setVoiceData(result);
      }
    } catch (err: any) {
      setVoiceData({
        success: false,
        rawText: manualQuestion,
        answer: err.message,
      });
    } finally {
      setLoading(false);
      setStatus("Answer Ready");
      setManualQuestion("");
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
              onClick={() => window.electronAPI?.minimizeWindow?.()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => window.electronAPI?.maximizeWindow?.()}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => window.electronAPI?.closeWindow?.()}
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
                <span>{copied ? "Copied!" : "Copy Answer"}</span>
              </button>
            </div>
            <div className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg border border-slate-800 select-text cursor-text [&_pre]:bg-slate-950 [&_pre]:p-2.5 [&_pre]:rounded-md [&_pre]:my-2 [&_pre]:border [&_pre]:border-slate-800 [&_code]:text-emerald-400">
              {currentData.answer}
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
              Ctrl + Shift + H
            </kbd>{" "}
            Hide
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
