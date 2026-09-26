import Link from "next/link";
import { Sparkles, BrainCircuit, ShieldCheck, Zap } from "lucide-react";

import { LazyRobotHero } from "@/components/ui/lazy-robot-hero";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
    getInterviewsByUserId,
    getLatestInterviews,
} from "@/lib/actions/general.action";

export default async function Home() {
    const user = await getCurrentUser();

    // Fetch interview data if authenticated
    let userInterviews: Interview[] = [];
    let allInterviews: Interview[] = [];

    if (user?.id) {
        const [userRes, allRes] = await Promise.all([
            getInterviewsByUserId(user.id),
            getLatestInterviews({ userId: user.id }),
        ]);
        userInterviews = (userRes || []) as Interview[];
        allInterviews = (allRes || []) as Interview[];
    }

    const hasPastInterviews = userInterviews.length > 0;
    const hasUpcomingInterviews = allInterviews.length > 0;

    return (
        <div className="flex flex-col gap-12 w-full">
            {/* 3D Interactive Robot Hero Section (Progressive Lazy Load) */}
            <LazyRobotHero
                backgroundText="INTUIPREP"
                ctaText={user ? "Start Interview" : "Get Started Free"}
                contactText={user ? "View Interviews" : "Sign In"}
                contactHref={user ? "/interview" : "/sign-in"}
                showEmotionPills={true}
                initialEmotion="friendly"
            />

            {/* If Authenticated: Render Candidate Interview Dashboard */}
            {user ? (
                <>
                    {/* User's Created / Taken Interviews */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                Your Interviews
                                {hasPastInterviews && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-200/20 text-primary-100 font-semibold">
                                        {userInterviews.length}
                                    </span>
                                )}
                            </h2>

                            <Link
                                href="/interview"
                                className="btn-primary text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md shadow-primary-200/20"
                            >
                                <Sparkles size={14} />
                                Create New Interview
                            </Link>
                        </div>

                        <div className="interviews-section">
                            {hasPastInterviews ? (
                                userInterviews.map((interview) => (
                                    <InterviewCard
                                        key={interview.id}
                                        userId={user.id}
                                        interviewId={interview.id}
                                        role={interview.role}
                                        type={interview.type}
                                        techstack={interview.techstack}
                                        createdAt={interview.createdAt}
                                    />
                                ))
                            ) : (
                                <div className="p-8 rounded-3xl bg-dark-200/50 border border-white/5 text-center flex flex-col items-center gap-3 w-full">
                                    <p className="text-light-100/60 text-sm">
                                        You haven&apos;t created or taken any interviews yet.
                                    </p>
                                    <Link
                                        href="/interview"
                                        className="btn-primary text-xs px-5 py-2.5 rounded-full font-semibold"
                                    >
                                        Start Your First Mock Interview
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Community / Available Practice Interviews */}
                    <section className="flex flex-col gap-6">
                        <h2 className="text-2xl font-bold text-white">Explore Available Interviews</h2>

                        <div className="interviews-section">
                            {hasUpcomingInterviews ? (
                                allInterviews.map((interview) => (
                                    <InterviewCard
                                        key={interview.id}
                                        userId={user.id}
                                        interviewId={interview.id}
                                        role={interview.role}
                                        type={interview.type}
                                        techstack={interview.techstack}
                                        createdAt={interview.createdAt}
                                    />
                                ))
                            ) : (
                                <p className="text-light-100/60 text-sm">There are no other interviews available right now.</p>
                            )}
                        </div>
                    </section>
                </>
            ) : (
                /* If Visitor: Feature Highlights and Call to Action */
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="p-8 rounded-3xl bg-dark-200/70 border border-white/5 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-primary-100">
                            <BrainCircuit size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Targeted Role Practice</h3>
                        <p className="text-light-100/70 text-sm leading-relaxed">
                            Generate tailored technical and behavioral questions across Frontend, Backend, Full Stack, DevOps, and custom tech stacks.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-dark-200/70 border border-white/5 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-primary-100">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Zero-Cost Voice AI</h3>
                        <p className="text-light-100/70 text-sm leading-relaxed">
                            Hands-free voice recognition and natural speech synthesis powered directly in your browser without paid per-minute audio fees.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-dark-200/70 border border-white/5 flex flex-col gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center text-primary-100">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Granular Scoring</h3>
                        <p className="text-light-100/70 text-sm leading-relaxed">
                            Detailed score cards across 5 key dimensions with customized roadmaps, sample ideal answers, and strengths review.
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
}
