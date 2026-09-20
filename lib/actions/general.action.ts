"use server";

import { generateStructuredData } from "@/lib/ai";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        // Fetch interview context for role-aware evaluation
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        const interviewData = interviewDoc.exists ? interviewDoc.data() : null;
        const roleContext = interviewData
            ? `The candidate is interviewing for a ${interviewData.level || ""} ${interviewData.role || "general"} role with tech stack: ${(interviewData.techstack || []).join(", ")}.`
            : "General interview evaluation.";

        const { object } = await generateStructuredData({
            schema: feedbackSchema,
            prompt: `
        You are a senior AI interviewer analyzing a mock interview. Your task is to provide a comprehensive, detailed evaluation. Be thorough and constructive. Don't be lenient — if there are mistakes or areas for improvement, point them out clearly with actionable advice.
        
        ${roleContext}
        
        Transcript:
        ${formattedTranscript}

        Provide a comprehensive evaluation including:

        1. **Total Score** (0-100) and **Performance Band** (Excellent: 85-100, Good: 70-84, Average: 55-69, Below Average: 40-54, Needs Improvement: 0-39).

        2. **Category Scores** — Score each of these 5 categories from 0-100 with a detailed comment AND 2-3 sub-metrics per category:
           - **Communication Skills**: Sub-metrics: Clarity of Expression, Structured Responses, Active Listening
           - **Technical Knowledge**: Sub-metrics: Core Concepts, Practical Application, Depth of Understanding
           - **Problem Solving**: Sub-metrics: Analytical Thinking, Solution Quality, Edge Case Awareness
           - **Cultural & Role Fit**: Sub-metrics: Motivation, Team Collaboration, Role Alignment
           - **Confidence & Clarity**: Sub-metrics: Composure, Engagement, Conviction

        3. **Strengths** — List 2-4 specific strengths with concrete examples/quotes from the transcript.

        4. **Areas for Improvement** — List 2-4 areas with:
           - Actionable suggestion for each
           - Resource type: "practice" (needs hands-on practice), "study" (needs to learn/read), or "behavior" (soft skill to develop)
           - Priority: "high", "medium", or "low"

        5. **Detailed Suggestions**:
           - Immediate actions (things to fix right now, 2-3 items)
           - Short-term goals (1-2 week improvements, 2-3 items)
           - Long-term development areas (ongoing growth, 2-3 items)

        6. **Sample Ideal Answers** — Pick up to 3 questions where the candidate's answer could be significantly improved. For each, provide the question asked, what the candidate said, what an ideal answer would be, and the gap between them.

        7. **Final Assessment** — A 2-3 sentence overall summary.

        8. **Hiring Recommendation** — "Strong Hire", "Hire", "Maybe", or "No Hire" based on overall performance.
        `,
            system:
                "You are a senior professional interviewer providing detailed, actionable feedback on mock interview performance. Be constructive but honest.",
        });

        const feedback = {
            interviewId: interviewId,
            userId: userId,
            totalScore: object.totalScore,
            performanceBand: object.performanceBand,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            detailedSuggestions: object.detailedSuggestions,
            sampleIdealAnswers: object.sampleIdealAnswers,
            finalAssessment: object.finalAssessment,
            hiringRecommendation: object.hiringRecommendation,
            createdAt: new Date().toISOString(),
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db.collection("interviews").doc(id).get();

    if (!interview.exists) return null;

    return { id: interview.id, ...interview.data() } as Interview;
}

export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    try {
        const interviews = await db
            .collection("interviews")
            .orderBy("createdAt", "desc")
            .where("finalized", "==", true)
            .where("userId", "!=", userId)
            .limit(limit)
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error?.code === 9) {
            // Fallback for missing composite index: fetch finalized interviews and filter in memory
            const interviews = await db.collection("interviews").get();
            const docs = interviews.docs
                .map((doc) => ({ id: doc.id, ...doc.data() } as Interview))
                .filter((item) => item.finalized && item.userId !== userId)
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, limit);
            return docs;
        }
        throw err;
    }
}

export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
    try {
        const interviews = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error?.code === 9) {
            // Fallback for missing composite index: fetch by userId and sort in memory
            const interviews = await db
                .collection("interviews")
                .where("userId", "==", userId)
                .get();

            const docs = interviews.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Interview[];

            return docs.sort(
                (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
            );
        }
        throw err;
    }
}
