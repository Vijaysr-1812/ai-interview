import { z } from "zod";
import { generateStructuredData } from "@/lib/ai";

import { db, auth } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Input validation schema
const generateInterviewSchema = z.object({
    role: z.string().min(1).max(100),
    level: z.enum(["Junior", "Mid-Level", "Senior", "Lead"]),
    type: z.enum(["Technical", "Behavioral", "Mixed"]),
    techstack: z.string().min(1).max(500),
    amount: z.number().int().min(3).max(20),
    userId: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        // Verify authentication via session cookie
        const cookieHeader = request.headers.get("cookie") || "";
        const sessionMatch = cookieHeader.match(/session=([^;]+)/);
        const sessionCookie = sessionMatch ? sessionMatch[1] : null;

        if (!sessionCookie) {
            return Response.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        let decodedClaims;
        try {
            decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        } catch {
            return Response.json(
                { success: false, error: "Invalid or expired session" },
                { status: 401 }
            );
        }

        // Rate limiting
        const rateLimitResult = rateLimit(
            `generate:${decodedClaims.uid}`,
            RATE_LIMITS.interviewGeneration
        );

        if (!rateLimitResult.success) {
            return Response.json(
                {
                    success: false,
                    error: "Rate limit exceeded. Please try again later.",
                    retryAfterMs: rateLimitResult.resetMs,
                },
                { status: 429 }
            );
        }

        // Parse and validate input
        const body = await request.json();
        const parsed = generateInterviewSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json(
                { success: false, error: "Invalid input", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { type, role, level, techstack, amount, userId } = parsed.data;

        // Verify the userId matches the authenticated user
        if (userId !== decodedClaims.uid) {
            return Response.json(
                { success: false, error: "User ID mismatch" },
                { status: 403 }
            );
        }

        // Generate questions using Gemini with Groq fallback
        const { object: questions } = await generateStructuredData({
            schema: z.object({
                questions: z.array(z.string()).min(1).max(20),
            }),
            prompt: `Generate interview questions for a job interview.
The job role is: ${role}.
The experience level is: ${level}.
The tech stack used is: ${techstack}.
The focus should lean towards: ${type} questions.
Generate exactly ${amount} questions.

Requirements:
- Questions should be appropriate for the ${level} experience level.
- Mix of conceptual and practical questions.
- Questions should be conversational (will be read aloud by a voice assistant).
- Do NOT use special characters like /, *, or markdown formatting.
- Each question should be self-contained and clear.`,
        });

        const interview = {
            role,
            type,
            level,
            techstack: techstack.split(",").map((t: string) => t.trim()),
            questions: questions.questions,
            userId,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("interviews").add(interview);

        return Response.json(
            { success: true, interviewId: docRef.id },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating interview:", error);
        return Response.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
