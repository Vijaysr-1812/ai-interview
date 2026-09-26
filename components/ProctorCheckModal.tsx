"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Camera,
  Mic,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
} from "lucide-react";

interface ProctorCheckModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
  role?: string;
}

export function ProctorCheckModal({
  isOpen,
  onConfirm,
  onCancel,
  userName = "Candidate",
  role = "Job Role",
}: ProctorCheckModalProps) {
  const [cameraState, setCameraState] = useState<"pending" | "requesting" | "allowed" | "denied">("pending");
  const [micState, setMicState] = useState<"pending" | "requesting" | "allowed" | "denied">("pending");
  const [micLevel, setMicLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-request or test hardware verification when modal opens
  useEffect(() => {
    if (!isOpen) {
      setCameraState("pending");
      setMicState("pending");
      setMicLevel(0);
      setErrorMessage(null);
      return;
    }

    let activeStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animId: number | null = null;

    async function verifyHardware() {
      setCameraState("requesting");
      setMicState("requesting");
      setErrorMessage(null);

      try {
        // Request both audio and video
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        activeStream = stream;
        setCameraState("allowed");
        setMicState("allowed");

        // Attach audio level metering
        try {
          audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
            animId = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (e) {
          console.warn("Audio meter setup skipped:", e);
        }
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        console.error("Device permission check error:", error);

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setCameraState("denied");
          setMicState("denied");
          setErrorMessage(
            "Camera or Microphone permission was blocked by your browser. Please click the lock or camera icon in your browser address bar to allow access, then click 'Retry Verification'."
          );
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setErrorMessage("No webcam or microphone was detected on this device. Please connect a working device.");
        } else {
          setErrorMessage("Failed to access camera and microphone: " + (error.message || "Unknown error"));
        }
      }
    }

    verifyHardware();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isVerified = cameraState === "allowed" && micState === "allowed";

  const handleRetry = async () => {
    setCameraState("requesting");
    setMicState("requesting");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraState("allowed");
      setMicState("allowed");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setCameraState("denied");
      setMicState("denied");
      setErrorMessage(error?.message || "Permission was denied. Please allow camera and mic permissions in browser settings.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#181a20] via-[#12141a] to-[#0a0b0e] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        {/* Top Header Badge */}
        <div className="p-6 sm:p-8 pb-4 border-b border-white/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <ShieldCheck size={26} className="animate-pulse" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                PROCTORED AI EXAM
              </span>
              <span className="flex items-center gap-1 text-[11px] text-light-100/50">
                <Lock size={11} /> Secure Environment
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Pre-Interview Security & Hardware Check
            </h3>
            <p className="text-xs sm:text-sm text-light-100/70">
              Welcome, <span className="text-primary-100 font-semibold">{userName}</span>. You are taking the{" "}
              <span className="text-white font-medium">{role}</span> proctored assessment.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[65vh]">
          {/* Important Exam Instructions Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-start gap-3.5 shadow-sm">
            <div className="size-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div className="flex flex-col gap-1 text-xs sm:text-sm leading-relaxed text-amber-200">
              <span className="font-bold text-amber-300 tracking-wide uppercase text-xs">
                Candidate Voice & Monitoring Rules
              </span>
              <p className="text-amber-200/90">
                This is an <strong>AI-based voice interview</strong>. Try to be <strong>loud and clear</strong> with your answers, and <strong>do not take long pauses</strong>. The AI interviewer processes your speech in real-time.
              </p>
            </div>
          </div>

          {/* Hardware Verification Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Camera Card */}
            <div className="p-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center border transition-colors ${
                    cameraState === "allowed"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : cameraState === "denied"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-white/5 text-light-100/60 border-white/10"
                  }`}
                >
                  <Camera size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Webcam Video
                    <Eye size={13} className="text-light-100/40" />
                  </span>
                  <span className="text-xs text-light-100/50">
                    {cameraState === "allowed"
                      ? "Ready & Monitored"
                      : cameraState === "denied"
                      ? "Access Denied"
                      : "Verifying camera..."}
                  </span>
                </div>
              </div>

              <div>
                {cameraState === "allowed" ? (
                  <CheckCircle2 size={20} className="text-emerald-400 animate-in zoom-in" />
                ) : cameraState === "denied" ? (
                  <XCircle size={20} className="text-red-400" />
                ) : (
                  <span className="size-4 border-2 border-primary-200 border-t-transparent rounded-full animate-spin inline-block" />
                )}
              </div>
            </div>

            {/* Microphone Card */}
            <div className="p-4 rounded-2xl bg-dark-200/50 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center border transition-colors ${
                    micState === "allowed"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : micState === "denied"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-white/5 text-light-100/60 border-white/10"
                  }`}
                >
                  <Mic size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Microphone
                    <Volume2 size={13} className="text-light-100/40" />
                  </span>
                  <span className="text-xs text-light-100/50">
                    {micState === "allowed"
                      ? "Detected & Active"
                      : micState === "denied"
                      ? "Access Denied"
                      : "Testing audio..."}
                  </span>
                </div>
              </div>

              <div>
                {micState === "allowed" ? (
                  <CheckCircle2 size={20} className="text-emerald-400 animate-in zoom-in" />
                ) : micState === "denied" ? (
                  <XCircle size={20} className="text-red-400" />
                ) : (
                  <span className="size-4 border-2 border-primary-200 border-t-transparent rounded-full animate-spin inline-block" />
                )}
              </div>
            </div>
          </div>

          {/* Audio Activity Meter when Mic is active */}
          {micState === "allowed" && (
            <div className="p-3.5 rounded-xl bg-dark-300/40 border border-white/5 flex items-center gap-3">
              <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-light-100/70 font-medium">Mic Level Test:</span>
              <div className="flex-1 h-2 rounded-full bg-black/50 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75"
                  style={{ width: `${Math.max(5, micLevel)}%` }}
                />
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold w-8 text-right">
                {micLevel}%
              </span>
            </div>
          )}

          {/* Error Message & Browser Permissions Instructions */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex flex-col gap-2">
              <p className="leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors"
              >
                Retry Verification
              </button>
            </div>
          )}

          {/* Examination Protocol Checklist */}
          <div className="space-y-2 pt-1 text-xs text-light-100/60">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span>Ensure you are in a quiet room with minimal ambient background sound.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span>Keep your camera centered and maintain natural eye contact with the screen.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan-400" />
              <span>Do not switch browser tabs or minimize the assessment window.</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 sm:p-8 pt-4 border-t border-white/5 flex items-center justify-between gap-4 bg-black/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-xs font-medium text-light-100/60 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isVerified}
            onClick={onConfirm}
            className="px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-dark-100 bg-gradient-to-r from-primary-200 via-primary-100 to-cyan-300 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200/20 flex items-center gap-2"
          >
            <ShieldCheck size={16} />
            Confirm & Enter Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProctorCheckModal;
