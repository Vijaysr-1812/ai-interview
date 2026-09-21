"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { INTERVIEW_GREETING } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import {
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
} from "@/lib/speech";

enum InterviewState {
    IDLE = "IDLE",
    GREETING = "GREETING",
    LISTENING = "LISTENING",
    PROCESSING = "PROCESSING",
    SPEAKING = "SPEAKING",
    FINISHED = "FINISHED",
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const Agent = ({
    userName,
    userId,
    interviewId,
    feedbackId,
    questions,
    role,
    level,
    techstack,
}: AgentProps) => {
    const router = useRouter();
    const [state, setState] = useState<InterviewState>(InterviewState.IDLE);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [typedMessage, setTypedMessage] = useState("");
    const [speechNotice, setSpeechNotice] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTranscriptRef = useRef<string>("");
    const isProcessingRef = useRef<boolean>(false);
    const messagesRef = useRef<ChatMessage[]>([]);

    // Keep messagesRef in sync with messages
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [messages, currentTranscript]);

    // Check browser support
    useEffect(() => {
        if (!isSpeechRecognitionSupported() || !isSpeechSynthesisSupported()) {
            setIsSupported(false);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();
            cancelSpeech();
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, []);

    // Handle interview completion
    useEffect(() => {
        if (state !== InterviewState.FINISHED) return;
        if (messages.length === 0) return;

        const handleFinish = async () => {
            if (!interviewId || !userId) {
                router.push("/");
                return;
            }

            try {
                const transcript = messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const result = await createFeedback({
                    interviewId,
                    userId,
                    transcript,
                    feedbackId,
                });

                if (result.success && result.feedbackId) {
                    router.push(`/interview/${interviewId}/feedback`);
                } else {
                    const errMsg = (result as { error?: string }).error || "Failed to generate feedback.";
                    toast.error(errMsg);
                    router.push("/");
                }
            } catch (error: unknown) {
                const err = error as { message?: string };
                console.error("Error generating feedback:", error);
                toast.error(err?.message || "Something went wrong generating feedback.");
                router.push("/");
            }
        };

        handleFinish();
    }, [state, messages, interviewId, userId, feedbackId, router]);

    // Send user message to Gemini and get AI response
    const getAIResponse = useCallback(
        async (updatedMessages: ChatMessage[]) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            setState(InterviewState.PROCESSING);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 45000);

            try {
                const response = await fetch("/api/interview/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        messages: updatedMessages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        context: {
                            role: role || "Software Engineer",
                            level: level || "Mid-Level",
                            techstack: techstack || [],
                            questions,
                        },
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${response.status}: Failed to get AI response`);
                }

                // Read the streamed response
                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");

                const decoder = new TextDecoder();
                let fullResponse = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Handle both Vercel AI SDK Data Stream ("0:...") and raw text streams
                    if (chunk.includes("\n0:") || chunk.startsWith("0:")) {
                        const lines = chunk.split("\n");
                        for (const line of lines) {
                            if (line.startsWith("0:")) {
                                try {
                                    const text = JSON.parse(line.slice(2));
                                    fullResponse += text;
                                } catch {
                                    // Skip unparseable lines
                                }
                            }
                        }
                    } else {
                        fullResponse += chunk;
                    }
                }

                // Timeout is only cleared after full stream read succeeds
                clearTimeout(timeoutId);

                if (!fullResponse.trim()) {
                    throw new Error("Received empty response from AI model.");
                }

                const aiMessage: ChatMessage = {
                    role: "assistant",
                    content: fullResponse.trim(),
                };

                const nextMessages = [...updatedMessages, aiMessage];
                messagesRef.current = nextMessages;
                setMessages(nextMessages);

                // Check if the interview is concluding
                const isEnding =
                    fullResponse.toLowerCase().includes("concludes our interview") ||
                    fullResponse.toLowerCase().includes("thank you for your time") ||
                    fullResponse.toLowerCase().includes("end of the interview");

                // Speak the response
                setState(InterviewState.SPEAKING);
                isProcessingRef.current = false;

                speak(fullResponse.trim(), () => {
                    if (isEnding) {
                        setState(InterviewState.FINISHED);
                    } else {
                        // Start listening for user's next response
                        startUserListening();
                    }
                });
            } catch (error: unknown) {
                clearTimeout(timeoutId);
                isProcessingRef.current = false;
                const err = error as { message?: string; name?: string };
                console.error("Error getting AI response:", error);
                if (err?.name === "AbortError") {
                    toast.error("AI response timed out. Please speak your response again.");
                } else {
                    toast.error(err?.message || "Failed to get AI response. Please try again.");
                }
                setState(InterviewState.LISTENING);
                startUserListening();
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [questions, role, level, techstack]
    );

    // Submit user message and trigger AI response safely
    const submitUserMessage = useCallback(
        (explicitText?: string) => {
            if (isProcessingRef.current) return;

            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }

            const messageText = (explicitText || lastTranscriptRef.current).trim();
            if (!messageText) return;

            stopListening();
            setCurrentTranscript("");
            lastTranscriptRef.current = "";
            setTypedMessage("");
            setSpeechNotice(null);

            const userMessage: ChatMessage = {
                role: "user",
                content: messageText,
            };

            const updated = [...messagesRef.current, userMessage];
            messagesRef.current = updated;
            setMessages(updated);

            getAIResponse(updated);
        },
        [getAIResponse]
    );

    // Start listening for user speech
    const startUserListening = useCallback(() => {
        if (isProcessingRef.current) return;

        setState(InterviewState.LISTENING);
        setCurrentTranscript("");
        lastTranscriptRef.current = "";

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        startListening({
            onResult: (transcript, isFinal) => {
                if (isProcessingRef.current) return;
                setSpeechNotice(null);

                if (isFinal) {
                    lastTranscriptRef.current += " " + transcript;
                    const combined = lastTranscriptRef.current.trim();
                    setCurrentTranscript(combined);

                    // Reset silence timer on each final result
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }

                    // After 2.5 seconds of silence, automatically send the message
                    silenceTimerRef.current = setTimeout(() => {
                        submitUserMessage();
                    }, 2500);
                } else {
                    setCurrentTranscript(
                        (lastTranscriptRef.current + " " + transcript).trim()
                    );
                }
            },
            onEnd: () => {
                // Speech recognition ended
            },
            onError: (error) => {
                console.warn("Speech recognition notice:", error);
                setSpeechNotice(error);
            },
        });
    }, [submitUserMessage]);

    // Start the interview
    const handleStart = () => {
        if (!isSupported) {
            toast.error(
                "Your browser does not support speech recognition. Please use Chrome, Edge, or Safari."
            );
            return;
        }

        setState(InterviewState.GREETING);

        // Construct the first message with the first question
        const firstQuestion = questions?.[0] || "";
        const greeting = `${INTERVIEW_GREETING} ${firstQuestion}`;

        const greetingMessage: ChatMessage = {
            role: "assistant",
            content: greeting,
        };
        messagesRef.current = [greetingMessage];
        setMessages([greetingMessage]);

        // Speak the greeting
        setState(InterviewState.SPEAKING);
        speak(greeting, () => {
            startUserListening();
        });
    };

    // End the interview manually
    const handleEnd = () => {
        stopListening();
        cancelSpeech();

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        isProcessingRef.current = false;
        setState(InterviewState.FINISHED);
    };

    // Get status text
    const getStatusText = () => {
        switch (state) {
            case InterviewState.IDLE:
                return "Click to start the interview";
            case InterviewState.GREETING:
            case InterviewState.SPEAKING:
                return "AI Interviewer is speaking...";
            case InterviewState.LISTENING:
                return "Listening to your response...";
            case InterviewState.PROCESSING:
                return "Thinking...";
            case InterviewState.FINISHED:
                return "Generating feedback...";
            default:
                return "";
        }
    };

    return (
        <>
            {/* Pre-Exam Voice Guidelines Notice */}
            <div className="w-full mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3.5 shadow-lg shadow-yellow-500/5">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 mt-0.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                </div>
                <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-yellow-300 tracking-wide uppercase flex items-center gap-2">
                        Pre-Interview Voice Notice
                    </h4>
                    <p className="text-xs sm:text-sm text-yellow-200/90 leading-relaxed">
                        This is an AI-based voice interview. Please <strong>speak loud and clear</strong> when answering each question. Ensure your microphone permissions are granted and ambient noise is minimized for the most accurate transcription and scoring.
                    </p>
                </div>
            </div>

            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="AI Interviewer"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {(state === InterviewState.SPEAKING ||
                            state === InterviewState.GREETING) && (
                            <span className="animate-speak" />
                        )}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.png"
                            alt="User"
                            width={539}
                            height={539}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="flex justify-center mt-4">
                <div
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm",
                        state === InterviewState.LISTENING &&
                            "bg-green-500/10 text-green-400 border border-green-500/20",
                        state === InterviewState.SPEAKING &&
                            "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                        state === InterviewState.PROCESSING &&
                            "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                        state === InterviewState.FINISHED &&
                            "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                        state === InterviewState.IDLE && "bg-dark-200 text-light-100/70 border border-white/5"
                    )}
                >
                    {state === InterviewState.LISTENING && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                    {state === InterviewState.PROCESSING && (
                        <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {state === InterviewState.SPEAKING && (
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    )}
                    {getStatusText()}
                </div>
            </div>

            {/* WhatsApp-Style Horizontal Conversation Stream */}
            {messages.length > 0 && (
                <div className="w-full mt-6 rounded-3xl bg-dark-200/50 border border-white/10 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs text-light-100/60 font-medium">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Live Dialogue Transcript
                        </span>
                        <span>Two-Way Conversation</span>
                    </div>

                    <div
                        ref={transcriptRef}
                        className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-2 scroll-smooth"
                    >
                        {messages.map((msg, index) => {
                            const isAi = msg.role === "assistant";
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-start gap-3 w-full",
                                        isAi ? "justify-start" : "justify-end flex-row-reverse"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold overflow-hidden shadow-md",
                                            isAi
                                                ? "bg-dark-300 border-blue-400/30 text-blue-300"
                                                : "bg-primary-200/20 border-primary-200/40 text-primary-100"
                                        )}
                                    >
                                        {isAi ? (
                                            <Image
                                                src="/ai-avatar.png"
                                                alt="AI Interviewer"
                                                width={36}
                                                height={36}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span>{userName ? userName.charAt(0).toUpperCase() : "U"}</span>
                                        )}
                                    </div>

                                    {/* Speech Bubble */}
                                    <div
                                        className={cn(
                                            "max-w-[82%] sm:max-w-[70%] p-4 rounded-2xl shadow-lg text-sm leading-relaxed transition-all",
                                            isAi
                                                ? "bg-dark-300/90 border border-white/10 text-light-100 rounded-tl-sm"
                                                : "bg-primary-200/15 border border-primary-200/30 text-primary-100 rounded-tr-sm"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/5">
                                            <span
                                                className={cn(
                                                    "text-[11px] font-bold uppercase tracking-wider",
                                                    isAi ? "text-blue-300" : "text-primary-100"
                                                )}
                                            >
                                                {isAi ? "AI Interviewer" : "You (Candidate)"}
                                            </span>
                                            <span className="text-[10px] text-light-100/40">
                                                {isAi ? "Question / Response" : "Answer"}
                                            </span>
                                        </div>

                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Interim Real-time Transcript While User is Speaking */}
                        {currentTranscript && state === InterviewState.LISTENING && (
                            <div className="flex items-start gap-3 w-full justify-end flex-row-reverse animate-fade-in">
                                <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-300 text-xs font-bold shrink-0">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                                </div>

                                <div className="max-w-[82%] sm:max-w-[70%] p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-200 rounded-tr-sm shadow-md">
                                    <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-green-500/20">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                            Listening to you...
                                        </span>
                                        <span className="text-[10px] text-green-300/60">Live</span>
                                    </div>
                                    <p className="italic text-sm">{currentTranscript}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Speech Notice Banner */}
            {speechNotice && state === InterviewState.LISTENING && (
                <div className="w-full max-w-3xl mx-auto mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-3 animate-fade-in">
                    <span className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{speechNotice}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setSpeechNotice(null)}
                        className="text-amber-400 hover:text-amber-300 font-bold px-2 py-0.5"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Hybrid Input: Microphone or Direct Text Input */}
            {state === InterviewState.LISTENING && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!typedMessage.trim()) return;
                        submitUserMessage(typedMessage.trim());
                    }}
                    className="w-full max-w-3xl mx-auto flex items-center gap-2 mt-4 px-2"
                >
                    <input
                        type="text"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        placeholder="Speak into your mic, or type your answer here and press Enter..."
                        className="flex-1 px-4 py-3 rounded-xl bg-dark-300/80 border border-white/10 text-light-100 placeholder:text-light-100/40 text-sm focus:outline-none focus:border-primary-200/50 shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!typedMessage.trim()}
                        className="px-5 py-3 rounded-xl bg-primary-200 text-white font-semibold text-sm transition-all hover:bg-primary-200/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
                    >
                        Submit
                    </button>
                </form>
            )}

            {/* Controls */}
            <div className="w-full flex justify-center items-center gap-4 mt-6">
                {state === InterviewState.IDLE ? (
                    <button className="relative btn-call" onClick={handleStart}>
                        <span className="relative">Start Interview</span>
                    </button>
                ) : state === InterviewState.FINISHED ? (
                    <div className="flex items-center gap-2 text-light-100/60">
                        <span className="w-4 h-4 border-2 border-light-100/60 border-t-transparent rounded-full animate-spin" />
                        Generating your feedback...
                    </div>
                ) : (
                    <>
                        {state === InterviewState.LISTENING && (
                            <button
                                className="px-5 py-2.5 rounded-full bg-primary-200/20 hover:bg-primary-200/30 text-primary-100 font-medium text-sm transition-all border border-primary-200/30 flex items-center gap-2"
                                onClick={() => submitUserMessage()}
                                title="Click when you are finished speaking"
                            >
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                Done Speaking
                            </button>
                        )}
                        <button className="btn-disconnect" onClick={handleEnd}>
                            End Interview
                        </button>
                    </>
                )}
            </div>

            {/* Browser support warning */}
            {!isSupported && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <p className="text-red-400 text-sm">
                        Your browser does not support the Web Speech API.
                        Please use <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>,
                        or <strong>Safari</strong> for the best experience.
                    </p>
                </div>
            )}
        </>
    );
};

export default Agent;
