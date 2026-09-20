interface Feedback {
    id: string;
    interviewId: string;
    totalScore: number;
    performanceBand: "Excellent" | "Good" | "Average" | "Below Average" | "Needs Improvement";
    categoryScores: Array<{
        name: string;
        score: number;
        comment: string;
        subMetrics: Array<{
            name: string;
            score: number;
        }>;
    }>;
    strengths: Array<{
        point: string;
        example: string;
    }>;
    areasForImprovement: Array<{
        point: string;
        suggestion: string;
        resourceType: "practice" | "study" | "behavior";
        priority: "high" | "medium" | "low";
    }>;
    detailedSuggestions: {
        immediateActions: string[];
        shortTermGoals: string[];
        longTermDevelopment: string[];
    };
    sampleIdealAnswers: Array<{
        question: string;
        candidateAnswer: string;
        idealAnswer: string;
        gap: string;
    }>;
    finalAssessment: string;
    hiringRecommendation: "Strong Hire" | "Hire" | "Maybe" | "No Hire";
    createdAt: string;
}

interface Interview {
    id: string;
    role: string;
    level: string;
    questions: string[];
    techstack: string[];
    createdAt: string;
    userId: string;
    type: string;
    finalized: boolean;
}

interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
    feedbackId?: string;
}

interface User {
    name: string;
    email: string;
    id: string;
    emailVerified?: boolean;
}

interface InterviewCardProps {
    interviewId?: string;
    userId?: string;
    role: string;
    type: string;
    techstack: string[];
    createdAt?: string;
}

interface AgentProps {
    userName: string;
    userId?: string;
    interviewId?: string;
    feedbackId?: string;
    questions?: string[];
    role?: string;
    level?: string;
    techstack?: string[];
}

interface RouteParams {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
    interviewId: string;
    userId: string;
}

interface GetLatestInterviewsParams {
    userId: string;
    limit?: number;
}

interface SignInParams {
    email: string;
    idToken: string;
}

interface SignUpParams {
    uid: string;
    name: string;
    email: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
    interviewId: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
    amount: number;
}

interface TechIconProps {
    techStack: string[];
}
