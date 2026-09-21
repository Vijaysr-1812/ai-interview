import { streamText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

// Primary & fallback model definitions
const GEMINI_CHAT_MODEL = "gemini-3.6-flash";
const GROQ_CHAT_MODEL = "openai/gpt-oss-20b"; // Lightning fast for spoken voice dialogues (~700ms TTFT)
const GROQ_FAST_STRUCTURED_MODEL = "openai/gpt-oss-20b"; // Ultra-fast JSON generation (~2s) to stay within function timeouts
const GROQ_DEEP_REASONING_MODEL = "openai/gpt-oss-120b"; // Secondary deep reasoning model

function getPreferredProvider(): string {
    const raw = process.env.PREFERRED_AI_PROVIDER || "groq";
    return raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function getGroqClient() {
    const key =
        process.env.GROQ_GENERATIVE_AI_API_KEY ||
        process.env.GROQ_API_KEY ||
        "";
    if (!key || !key.trim()) return null;
    return createGroq({ apiKey: key.trim().replace(/^["']|["']$/g, "") });
}

interface StreamInterviewChatOptions {
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    systemPrompt: string;
}

/**
 * Stream interview chat with automatic multi-provider resilience.
 * Prioritizes Groq for sub-second voice chat, eliminating Gemini 503/429 errors.
 */
export async function streamInterviewChat({
    messages,
    systemPrompt,
}: StreamInterviewChatOptions) {
    const groq = getGroqClient();
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const preferredProvider = getPreferredProvider();

    if (!hasGoogle && !groq) {
        throw new Error(
            "No AI API keys configured. Please set GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in your environment variables."
        );
    }

    // Always use Groq if available unless explicitly overridden to "google"
    const useGroq = !!groq && preferredProvider !== "google";

    if (useGroq && groq) {
        try {
            console.log(`[AI Engine] Streaming interview with Groq (${GROQ_CHAT_MODEL})`);
            return streamText({
                model: groq(GROQ_CHAT_MODEL),
                system: systemPrompt,
                messages,
            });
        } catch (groqError) {
            console.warn("[AI Engine] Groq streaming error:", groqError);
            if (hasGoogle && preferredProvider === "google") {
                return streamText({
                    model: google(GEMINI_CHAT_MODEL),
                    system: systemPrompt,
                    messages,
                });
            }
            throw groqError;
        }
    }

    // Default to Google Gemini ONLY if Groq is not configured or user explicitly requested "google"
    if (hasGoogle) {
        try {
            console.log(`[AI Engine] Streaming interview with Google Gemini (${GEMINI_CHAT_MODEL})`);
            return streamText({
                model: google(GEMINI_CHAT_MODEL),
                system: systemPrompt,
                messages,
            });
        } catch (geminiError) {
            console.warn("[AI Engine] Gemini streaming error. Falling back to Groq:", geminiError);
            if (groq) {
                return streamText({
                    model: groq(GROQ_CHAT_MODEL),
                    system: systemPrompt,
                    messages,
                });
            }
            throw geminiError;
        }
    }

    return streamText({
        model: groq!(GROQ_CHAT_MODEL),
        system: systemPrompt,
        messages,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateStructuredData<T = any>({
    schema,
    prompt,
    system,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: z.ZodType<T, any, any>;
    prompt: string;
    system?: string;
}) {
    const groq = getGroqClient();
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const preferredProvider = getPreferredProvider();
    const useGroq = !!groq && preferredProvider !== "google";

    if (useGroq && groq) {
        try {
            console.log(`[AI Engine] Generating structured object with Groq (${GROQ_FAST_STRUCTURED_MODEL})`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: groq(GROQ_FAST_STRUCTURED_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        } catch (groqFastError) {
            console.warn("[AI Engine] Groq primary generation failed, attempting deep model fallback:", groqFastError);
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return await (generateObject as any)({
                    model: groq(GROQ_DEEP_REASONING_MODEL),
                    schema,
                    prompt,
                    system,
                }) as { object: T };
            } catch (groqDeepError) {
                console.warn("[AI Engine] Groq deep model also failed:", groqDeepError);
                if (hasGoogle && preferredProvider === "google") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return await (generateObject as any)({
                        model: google(GEMINI_CHAT_MODEL),
                        schema,
                        prompt,
                        system,
                    }) as { object: T };
                }
                throw groqFastError;
            }
        }
    }

    // Google Gemini primary only if Groq is not configured or user explicitly requested "google"
    if (hasGoogle) {
        try {
            console.log(`[AI Engine] Generating structured object with Google Gemini (${GEMINI_CHAT_MODEL})`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: google(GEMINI_CHAT_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        } catch (geminiError) {
            if (groq) {
                console.warn(`[AI Engine] Gemini generation failed. Falling back to Groq (${GROQ_FAST_STRUCTURED_MODEL}):`, geminiError);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return await (generateObject as any)({
                    model: groq(GROQ_FAST_STRUCTURED_MODEL),
                    schema,
                    prompt,
                    system,
                }) as { object: T };
            }
            throw geminiError;
        }
    }

    if (groq) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (generateObject as any)({
            model: groq(GROQ_FAST_STRUCTURED_MODEL),
            schema,
            prompt,
            system,
        }) as { object: T };
    }

    throw new Error("No AI API keys configured for structured data generation.");
}
