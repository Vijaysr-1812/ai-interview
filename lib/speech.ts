/**
 * Browser-native speech utilities using Web Speech API.
 * Zero-cost alternative to Vapi AI / Deepgram / ElevenLabs.
 *
 * - STT: SpeechRecognition API (Chrome, Edge, Safari)
 * - TTS: SpeechSynthesis API (all modern browsers)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Feature Detection ───────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );
}

export function isSpeechSynthesisSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis;
}

// ─── Speech Recognition (STT) ────────────────────────────────────

interface ListenCallbacks {
    onResult: (transcript: string, isFinal: boolean) => void;
    onEnd: () => void;
    onError: (error: string) => void;
}

let recognition: any = null;
let isListening = false;
let shouldRestart = false;
let activeCallbacks: ListenCallbacks | null = null;

let networkRetryCount = 0;
const MAX_NETWORK_RETRIES = 1;

export function startListening(callbacks: ListenCallbacks): boolean {
    if (!isSpeechRecognitionSupported()) {
        callbacks.onError(
            "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
        );
        return false;
    }

    // Stop any existing session cleanly
    stopListening();

    const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    shouldRestart = true;
    isListening = true;
    networkRetryCount = 0;
    activeCallbacks = callbacks;

    recognition.onresult = (event: any) => {
        if (!isListening || !activeCallbacks) return;

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        }

        if (finalTranscript) {
            activeCallbacks.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript) {
            activeCallbacks.onResult(interimTranscript.trim(), false);
        }
    };

    recognition.onerror = (event: any) => {
        if (!isListening || !activeCallbacks) return;

        // "no-speech" is common and not really an error — just silence
        if (event.error === "no-speech") {
            return;
        }
        // "aborted" happens when we intentionally stop
        if (event.error === "aborted") {
            return;
        }

        console.warn("Speech recognition error:", event.error);

        // Network error handling with single backoff retry to prevent infinite crash loops
        if (event.error === "network") {
            if (networkRetryCount < MAX_NETWORK_RETRIES && shouldRestart) {
                networkRetryCount++;
                console.log("[Speech] Retrying speech recognition after network blip...");
                setTimeout(() => {
                    if (shouldRestart) {
                        try {
                            recognition?.start();
                        } catch {
                            // Ignored
                        }
                    }
                }, 1200);
                return;
            }

            // Exhausted retries — halt cleanly and inform user
            shouldRestart = false;
            isListening = false;
            activeCallbacks.onError(
                "Speech recognition network error: unable to reach speech services (often caused by ad-blockers, Brave Shields, or network restrictions). You can type your answer below."
            );
            return;
        }

        // Permission errors
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            shouldRestart = false;
            isListening = false;
            activeCallbacks.onError(
                "Microphone or speech service permission was denied. Please allow microphone access or type your answer below."
            );
            return;
        }

        // Other non-fatal errors
        activeCallbacks.onError(`Speech recognition notice: ${event.error}`);
    };

    recognition.onend = () => {
        if (!shouldRestart || !isListening) {
            const cb = activeCallbacks;
            isListening = false;
            activeCallbacks = null;
            cb?.onEnd();
            return;
        }

        // Auto-restart if we didn't intentionally stop
        try {
            recognition?.start();
            isListening = true;
        } catch {
            isListening = false;
            const cb = activeCallbacks;
            activeCallbacks = null;
            cb?.onEnd();
        }
    };

    try {
        recognition.start();
        return true;
    } catch (error) {
        console.error("Failed to start speech recognition:", error);
        isListening = false;
        activeCallbacks = null;
        callbacks.onError("Failed to start speech recognition. Please check microphone permissions or type your answer.");
        return false;
    }
}

export function stopListening(): void {
    shouldRestart = false;
    isListening = false;
    activeCallbacks = null;

    if (recognition) {
        try {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.stop();
        } catch {
            // Already stopped
        }
        recognition = null;
    }
}

export function getIsListening(): boolean {
    return isListening;
}

// ─── Speech Synthesis (TTS) ──────────────────────────────────────

/**
 * Get the best available English voice for TTS.
 * Prefers Google / Microsoft voices for quality.
 */
function getBestVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Priority order for natural-sounding voices
    const preferredNames = [
        "Google US English",
        "Google UK English Female",
        "Microsoft Zira",
        "Microsoft David",
        "Samantha", // macOS
        "Karen",    // macOS
        "Daniel",   // macOS
    ];

    for (const name of preferredNames) {
        const voice = voices.find((v) => v.name.includes(name));
        if (voice) return voice;
    }

    // Fallback: first English voice
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    return englishVoice || voices[0];
}

let currentUtterance: SpeechSynthesisUtterance | null = null;
let resumeInterval: NodeJS.Timeout | null = null;
let safetyTimeout: NodeJS.Timeout | null = null;

function clearSpeechTimers() {
    if (resumeInterval) {
        clearInterval(resumeInterval);
        resumeInterval = null;
    }
    if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
    }
}

export function speak(text: string, onEnd?: () => void): void {
    if (!isSpeechSynthesisSupported()) {
        console.error("Speech synthesis not supported");
        onEnd?.();
        return;
    }

    // Cancel any ongoing speech and reset timers
    cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    const voice = getBestVoice();
    if (voice) {
        utterance.voice = voice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        clearSpeechTimers();
        currentUtterance = null;
        onEnd?.();
    };

    utterance.onend = () => {
        finish();
    };

    utterance.onerror = (event) => {
        // "interrupted" or "canceled" are expected when stopping
        if (event.error !== "interrupted" && event.error !== "canceled") {
            console.error("Speech synthesis error:", event.error);
        }
        finish();
    };

    // Chrome 15-second pause bug workaround: periodically trigger resume
    resumeInterval = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
        }
    }, 10000);

    // Safety fallback timeout: estimate duration based on word count (avg 130 wpm = ~2.2 words/sec) + 8s buffer
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedMs = Math.max(7000, (wordCount / 2) * 1000 + 8000);
    safetyTimeout = setTimeout(() => {
        if (!finished) {
            console.warn("Speech synthesis exceeded safety timeout, forcing finish.");
            finish();
        }
    }, estimatedMs);

    // Chrome unfreeze: cancel and resume before speaking
    try {
        window.speechSynthesis.resume();
    } catch {
        // Ignore
    }

    // Chrome bug: voices may not be loaded yet
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", () => {
            const updatedVoice = getBestVoice();
            if (updatedVoice) {
                utterance.voice = updatedVoice;
            }
            window.speechSynthesis.speak(utterance);
        }, { once: true });
    } else {
        window.speechSynthesis.speak(utterance);
    }
}

export function cancelSpeech(): void {
    clearSpeechTimers();
    if (isSpeechSynthesisSupported()) {
        try {
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();
        } catch {
            // Ignore
        }
    }
    currentUtterance = null;
}

export function isSpeaking(): boolean {
    if (!isSpeechSynthesisSupported()) return false;
    return window.speechSynthesis.speaking || currentUtterance !== null;
}
