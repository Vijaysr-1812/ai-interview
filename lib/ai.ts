import { streamText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

// Primary & fallback model definitions
const GEMINI_CHAT_MODEL = "gemini-3.6-flash";
const GROQ_CHAT_MODEL = "openai/gpt-oss-20b"; // Lightning fast for spoken voice dialogues (~700ms TTFT)
const GROQ_REASONING_MODEL = "openai/gpt-oss-120b"; // Deep reasoning for complex questions and 5D feedback

function getGroqClient() {
    const key =
        process.env.GROQ_GENERATIVE_AI_API_KEY ||
        process.env.GROQ_API_KEY ||
        "";
    if (!key) return null;
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
 * Seamlessly switches between Google Gemini and Groq.
 */
export async function streamInterviewChat({
    messages,
    systemPrompt,
}: StreamInterviewChatOptions) {
    const groq = getGroqClient();
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const preferredProvider = process.env.PREFERRED_AI_PROVIDER || "auto";

    if (!hasGoogle && !groq) {
        throw new Error(
            "No AI API keys configured. Please set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY in your environment variables."
        );
    }

    const preferGroq = preferredProvider === "groq" || (groq !== null && !hasGoogle);

    if (preferGroq && groq) {
        console.log(`[AI Engine] Streaming with Groq (${GROQ_CHAT_MODEL})`);
        return streamText({
            model: groq(GROQ_CHAT_MODEL),
            system: systemPrompt,
            messages,
        });
    }

    // Default to Google Gemini (or Groq if Gemini is not available)
    if (hasGoogle) {
        console.log(`[AI Engine] Streaming with Google Gemini (${GEMINI_CHAT_MODEL})`);
        return streamText({
            model: google(GEMINI_CHAT_MODEL),
            system: systemPrompt,
            messages,
        });
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
    const preferredProvider = process.env.PREFERRED_AI_PROVIDER || "auto";
    const preferGroq = preferredProvider === "groq" || (groq !== null && !hasGoogle);

    if (preferGroq && groq) {
        try {
            console.log(`[AI Engine] Generating object with primary provider: Groq (${GROQ_REASONING_MODEL})`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (generateObject as any)({
                model: groq(GROQ_REASONING_MODEL),
                schema,
                prompt,
                system,
            }) as { object: T };
        } catch (groqError) {
            console.warn("[AI Engine] Groq generation failed. Falling back to Google Gemini:", groqError);
            if (hasGoogle) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return await (generateObject as any)({
                    model: google(GEMINI_CHAT_MODEL),
                    schema,
                    prompt,
                    system,
                }) as { object: T };
            }
            throw groqError;
        }
    }

    // Default: Gemini primary -> Groq fallback
    if (hasGoogle) {
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

    if (groq) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (generateObject as any)({
            model: groq(GROQ_REASONING_MODEL),
            schema,
            prompt,
            system,
        }) as { object: T };
    }

    throw new Error("No AI API keys configured for structured data generation.");
}
