import React from 'react'
import {Button} from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {dummyInterviews} from "@/constants";
import {Inter} from "next/dist/compiled/@next/font/dist/google";
import InterviewCard from "@/components/InterviewCard";

const Page = () => {
    return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview ready with AI-Powered pratice and feedback</h2>
                    <p className="text-lg">
                        Get ready for your next job interview with AI-powered practice and feedback.
                    </p>
                    <Button asChild className="btn-primary max-sm:w-full">
                        <Link href="/interview">Start your Interview</Link>
                    </Button>
                </div>
                <Image src="/robot.png" alt="robot" width={500} height={500} className="max-sm:hidden" />
            </section>
            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>
                <div className="interviews-section">
                    {dummyInterviews.map((interview) => (<InterviewCard {...interview} key={interview.id} />))}
                </div>
            </section>
            <section className="flex flex-col gap-6 mt-8">
                <h2>Take an Interviews</h2>
                <div className="interviews-section">
                    {dummyInterviews.map((interview) => (<InterviewCard {...interview} key={interview.id} />))}
                </div>
            </section>
        </>
    )
}
export default Page
