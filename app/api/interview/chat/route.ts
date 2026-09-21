import { streamInterviewChat } from "@/lib/ai";
import { z } from "zod";

import { cookies } from "next/headers";
import { auth } from "@/firebase/admin";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { INTERVIEW_SYSTEM_PROMPT } from "@/constants";

// Input validation schema
const chatSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
        })
    ),
    context: z.object({
        role: z.string().optional(),
        level: z.string().optional(),
        techstack: z.array(z.string()).optional(),
        questions: z.array(z.string()).optional(),
    }).optional(),
});

export async function POST(request: Request) {
    try {
        // Verify authentication
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let decodedClaims;
        try {
            decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        } catch {
            return Response.json(
                { error: "Invalid or expired session" },
                { status: 401 }
            );
        }

        // Rate limiting
        const rateLimitResult = rateLimit(
            `chat:${decodedClaims.uid}`,
            RATE_LIMITS.chatMessages
        );

        if (!rateLimitResult.success) {
            return Response.json(
                { error: "Rate limit exceeded. Please slow down." },
                { status: 429 }
            );
        }

        // Parse and validate input
        const body = await request.json();
        const parsed = chatSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json(
                { error: "Invalid input", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { messages, context } = parsed.data;

        // Build system prompt with interview context
        let systemPrompt = INTERVIEW_SYSTEM_PROMPT;

        if (context?.questions && context.questions.length > 0) {
            const formattedQuestions = context.questions
                .map((q, i) => `${i + 1}. ${q}`)
                .join("\n");
            systemPrompt = systemPrompt.replace(
                "{{questions}}",
                formattedQuestions
            );
        }

        if (context?.role) {
            systemPrompt = systemPrompt.replace("{{role}}", context.role);
        }

        if (context?.level) {
            systemPrompt = systemPrompt.replace("{{level}}", context.level);
        }

        if (context?.techstack) {
            systemPrompt = systemPrompt.replace(
                "{{techstack}}",
                context.techstack.join(", ")
            );
        }

        // Stream the response with automatic Gemini + Groq resilience
        const result = await streamInterviewChat({
            systemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: unknown) {
        console.error("Error in interview chat:", error);
        const err = error as { message?: string };
        return Response.json(
            { error: err?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
