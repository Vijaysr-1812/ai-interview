import { streamText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

// Initialize Groq provider if key is available
const groqApiKey =
    process.env.GROQ_GENERATIVE_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    "";

const groq = groqApiKey ? createGroq({ apiKey: groqApiKey }) : null;

// Provider configuration
// Options: "auto" (default: Gemini primary -> Groq fallback), "groq" (Groq primary -> Gemini fallback), "google"
const PREFERRED_PROVIDER = process.env.PREFERRED_AI_PROVIDER || "auto";

// Primary & fallback model definitions
const GEMINI_CHAT_MODEL = "gemini-3.6-flash";
const GROQ_CHAT_MODEL = "openai/gpt-oss-20b"; // Lightning fast for spoken voice dialogues (~700ms TTFT)
const GROQ_REASONING_MODEL = "openai/gpt-oss-120b"; // Deep reasoning for complex questions and 5D feedback

interface StreamInterviewChatOptions {
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    systemPrompt: string;
}

/**
 * Stream interview chat with automatic multi-provider resilience.
 * Seamlessly switches between Google Gemini and Groq if either encounters an error or latency threshold.
 */
export async function streamInterviewChat({
    messages,
    systemPrompt,
}: StreamInterviewChatOptions) {
    const isGroqPrimary = PREFERRED_PROVIDER === "groq" && groq !== null;

    if (isGroqPrimary) {
        try {
            console.log(`[AI Engine] Streaming with primary provider: Groq (${GROQ_CHAT_MODEL})`);
            return streamText({
                model: groq!(GROQ_CHAT_MODEL),
                system: systemPrompt,
                messages,
            });
        } catch (groqError) {
            console.warn("[AI Engine] Groq stream failed. Falling back to Google Gemini:", groqError);
            return streamText({
                model: google(GEMINI_CHAT_MODEL),
                system: systemPrompt,
                messages,
            });
        }
    }

    // Default: Gemini primary with Groq fallback
    try {
        console.log(`[AI Engine] Streaming with primary provider: Google Gemini (${GEMINI_CHAT_MODEL})`);
        return streamText({
            model: google(GEMINI_CHAT_MODEL),
            system: systemPrompt,
            messages,
        });
    } catch (geminiError) {
        if (groq) {
            console.warn(`[AI Engine] Gemini stream failed. Falling back to Groq (${GROQ_CHAT_MODEL}):`, geminiError);
            return streamText({
                model: groq(GROQ_CHAT_MODEL),
                system: systemPrompt,
                messages,
            });
        }
        throw geminiError;
    }
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
    const isGroqPrimary = PREFERRED_PROVIDER === "groq" && groq !== null;

    if (isGroqPrimary) {
        try {
            console.log(`[AI Engine] Generating object with primary provider: Groq (${GROQ_REASONING_MODEL})`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: groq!(GROQ_REASONING_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        } catch (groqError) {
            console.warn("[AI Engine] Groq generation failed. Falling back to Google Gemini:", groqError);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: google(GEMINI_CHAT_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        }
    }

    // Default: Gemini primary -> Groq fallback
    try {
        console.log(`[AI Engine] Generating object with primary provider: Google Gemini (${GEMINI_CHAT_MODEL})`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (generateObject as any)({
            model: google(GEMINI_CHAT_MODEL),
            schema,
            prompt,
            system,
        }) as { object: T };
    } catch (geminiError) {
        if (groq) {
            console.warn(`[AI Engine] Gemini generation failed. Falling back to Groq (${GROQ_REASONING_MODEL}):`, geminiError);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: groq(GROQ_REASONING_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        }
        throw geminiError;
    }
}
