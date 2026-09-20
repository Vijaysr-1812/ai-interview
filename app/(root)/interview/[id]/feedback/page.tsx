import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const ScoreGauge = ({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) => {
    const radius = size === "lg" ? 70 : 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const svgSize = size === "lg" ? 180 : 90;
    const strokeWidth = size === "lg" ? 10 : 6;

    const getScoreColor = (s: number) => {
        if (s >= 85) return "text-green-400 stroke-green-400";
        if (s >= 70) return "text-blue-400 stroke-blue-400";
        if (s >= 55) return "text-yellow-400 stroke-yellow-400";
        if (s >= 40) return "text-orange-400 stroke-orange-400";
        return "text-red-400 stroke-red-400";
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={svgSize} height={svgSize} className="-rotate-90">
                <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-dark-300"
                />
                <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
                />
            </svg>
            <span className={`absolute ${size === "lg" ? "text-3xl" : "text-sm"} font-bold ${getScoreColor(score)}`}>
                {score}
            </span>
        </div>
    );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors = {
        high: "bg-red-500/15 text-red-400 border-red-500/30",
        medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        low: "bg-green-500/15 text-green-400 border-green-500/30",
    };
    const icons = { high: "🔴", medium: "🟡", low: "🟢" };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors[priority as keyof typeof colors] || colors.medium}`}>
            {icons[priority as keyof typeof icons]} {priority}
        </span>
    );
};

const RecommendationBadge = ({ recommendation }: { recommendation: string }) => {
    const colors: Record<string, string> = {
        "Strong Hire": "bg-green-500/15 text-green-400 border-green-500/30",
        "Hire": "bg-blue-500/15 text-blue-400 border-blue-500/30",
        "Maybe": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        "No Hire": "bg-red-500/15 text-red-400 border-red-500/30",
    };

    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${colors[recommendation] || colors["Maybe"]}`}>
            {recommendation}
        </span>
    );
};

const Feedback = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const interview = await getInterviewById(id);
    if (!interview) redirect("/");

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user.id,
    });

    if (!feedback) redirect(`/interview/${id}`);

    return (
        <section className="section-feedback">
            {/* ── Header ────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-3xl font-semibold">
                    <span className="capitalize">{interview.role}</span> Interview Feedback
                </h1>

                <div className="flex flex-wrap gap-4 items-center justify-center">
                    {feedback.performanceBand && (
                        <span className="px-3 py-1 rounded-full bg-primary-200/10 text-primary-200 text-sm font-medium">
                            {feedback.performanceBand}
                        </span>
                    )}
                    {feedback.hiringRecommendation && (
                        <RecommendationBadge recommendation={feedback.hiringRecommendation} />
                    )}
                </div>
            </div>

            {/* ── Score Overview ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
                <ScoreGauge score={feedback.totalScore} />

                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Image src="/star.svg" width={18} height={18} alt="star" />
                        <span>Overall Score: <strong className="text-primary-200">{feedback.totalScore}</strong>/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Image src="/calendar.svg" width={18} height={18} alt="calendar" />
                        <span>
                            {feedback.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            <hr className="border-dark-300 my-6" />

            {/* ── Final Assessment ──────────────────────────── */}
            <div className="bg-dark-200/50 rounded-xl p-5">
                <p className="text-light-100/90 leading-relaxed">{feedback.finalAssessment}</p>
            </div>

            {/* ── Category Breakdown ────────────────────────── */}
            <div className="flex flex-col gap-4 mt-8">
                <h2 className="text-xl font-semibold">Category Breakdown</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.categoryScores?.map((category, index) => (
                        <div key={index} className="card-border">
                            <div className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">{category.name}</h4>
                                    <ScoreGauge score={category.score} size="sm" />
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-dark-300 rounded-full h-2 mb-3">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-700 ${
                                            category.score >= 70
                                                ? "bg-green-400"
                                                : category.score >= 50
                                                    ? "bg-yellow-400"
                                                    : "bg-red-400"
                                        }`}
                                        style={{ width: `${category.score}%` }}
                                    />
                                </div>

                                <p className="text-sm text-light-100/70 mb-3">{category.comment}</p>

                                {/* Sub-metrics */}
                                {category.subMetrics && category.subMetrics.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dark-300">
                                        {category.subMetrics.map((sub, sIdx) => (
                                            <div key={sIdx} className="flex items-center justify-between text-xs">
                                                <span className="text-light-100/60">{sub.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-dark-300 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${
                                                                sub.score >= 70
                                                                    ? "bg-green-400/80"
                                                                    : sub.score >= 50
                                                                        ? "bg-yellow-400/80"
                                                                        : "bg-red-400/80"
                                                            }`}
                                                            style={{ width: `${sub.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-light-100/50 w-8 text-right">{sub.score}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Strengths ─────────────────────────────────── */}
            {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="flex flex-col gap-3 mt-8">
                    <h2 className="text-xl font-semibold">💪 Strengths</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feedback.strengths.map((strength, index) => (
                            <div key={index} className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                                <p className="font-medium text-green-300">{strength.point}</p>
                                {strength.example && (
                                    <p className="text-sm text-light-100/60 mt-2 italic">
                                        &ldquo;{strength.example}&rdquo;
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Areas for Improvement ─────────────────────── */}
            {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                <div className="flex flex-col gap-3 mt-8">
                    <h2 className="text-xl font-semibold">📈 Areas for Improvement</h2>
                    <div className="flex flex-col gap-3">
                        {feedback.areasForImprovement.map((area, index) => (
                            <div key={index} className="bg-dark-200/50 border border-dark-100 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <p className="font-medium">{area.point}</p>
                                    <PriorityBadge priority={area.priority} />
                                </div>
                                <p className="text-sm text-light-100/70">{area.suggestion}</p>
                                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-dark-300 text-light-100/50">
                                    {area.resourceType === "practice" && "🛠️ Hands-on Practice"}
                                    {area.resourceType === "study" && "📚 Study / Research"}
                                    {area.resourceType === "behavior" && "🧠 Soft Skill Development"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── AI Improvement Roadmap ────────────────────── */}
            {feedback.detailedSuggestions && (
                <div className="flex flex-col gap-3 mt-8">
                    <h2 className="text-xl font-semibold">🗺️ Improvement Roadmap</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Immediate Actions */}
                        <div className="card-border">
                            <div className="card p-5">
                                <h4 className="font-semibold text-red-400 mb-3">⚡ Do Right Now</h4>
                                <ul className="flex flex-col gap-2">
                                    {feedback.detailedSuggestions.immediateActions?.map((action, i) => (
                                        <li key={i} className="text-sm text-light-100/80 flex gap-2">
                                            <span className="text-red-400/60 mt-0.5">•</span>
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Short-term Goals */}
                        <div className="card-border">
                            <div className="card p-5">
                                <h4 className="font-semibold text-yellow-400 mb-3">📅 This Week</h4>
                                <ul className="flex flex-col gap-2">
                                    {feedback.detailedSuggestions.shortTermGoals?.map((goal, i) => (
                                        <li key={i} className="text-sm text-light-100/80 flex gap-2">
                                            <span className="text-yellow-400/60 mt-0.5">•</span>
                                            {goal}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Long-term Development */}
                        <div className="card-border">
                            <div className="card p-5">
                                <h4 className="font-semibold text-green-400 mb-3">🌱 Ongoing Growth</h4>
                                <ul className="flex flex-col gap-2">
                                    {feedback.detailedSuggestions.longTermDevelopment?.map((item, i) => (
                                        <li key={i} className="text-sm text-light-100/80 flex gap-2">
                                            <span className="text-green-400/60 mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sample Ideal Answers ──────────────────────── */}
            {feedback.sampleIdealAnswers && feedback.sampleIdealAnswers.length > 0 && (
                <div className="flex flex-col gap-3 mt-8">
                    <h2 className="text-xl font-semibold">📝 How to Improve Your Answers</h2>
                    <div className="flex flex-col gap-4">
                        {feedback.sampleIdealAnswers.map((sample, index) => (
                            <div key={index} className="card-border">
                                <div className="card p-5">
                                    <p className="font-semibold text-primary-200 mb-3">
                                        Q: {sample.question}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-red-400 mb-1 uppercase">Your Answer</p>
                                            <p className="text-sm text-light-100/70">{sample.candidateAnswer}</p>
                                        </div>
                                        <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-green-400 mb-1 uppercase">Ideal Answer</p>
                                            <p className="text-sm text-light-100/70">{sample.idealAnswer}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 bg-dark-300/50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-yellow-400 mb-1 uppercase">Gap Analysis</p>
                                        <p className="text-sm text-light-100/60">{sample.gap}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Action Buttons ────────────────────────────── */}
            <div className="buttons mt-8">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to Dashboard
                        </p>
                    </Link>
                </Button>

                <Button className="btn-primary flex-1">
                    <Link
                        href={`/interview/${id}`}
                        className="flex w-full justify-center"
                    >
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Feedback;
