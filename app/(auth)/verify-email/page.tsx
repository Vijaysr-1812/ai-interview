"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";

import { Button } from "@/components/ui/button";

const VerifyEmailPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Start cooldown timer
    const startCooldown = useCallback(() => {
        setCooldown(60);
    }, []);

    // Cooldown countdown
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    // Listen for auth state and poll for email verification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email);

                if (user.emailVerified) {
                    toast.success("Email verified! You can now sign in.");
                    router.push("/sign-in");
                    return;
                }

                // Poll every 5 seconds to check if email has been verified
                const interval = setInterval(async () => {
                    await user.reload();
                    if (user.emailVerified) {
                        clearInterval(interval);
                        toast.success("Email verified! You can now sign in.");
                        router.push("/sign-in");
                    }
                }, 5000);

                return () => clearInterval(interval);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleResendEmail = async () => {
        if (cooldown > 0) return;

        setIsResending(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                toast.success("Verification email sent! Check your inbox.");
                startCooldown();
            } else {
                toast.error("No user session found. Please sign up again.");
                router.push("/sign-up");
            }
        } catch (err) {
            const error = err as { code?: string };
            console.error("Error resending verification email:", error);
            if (error.code === "auth/too-many-requests") {
                toast.error("Too many requests. Please wait a few minutes before trying again.");
            } else {
                toast.error("Failed to resend verification email. Please try again.");
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10 items-center text-center">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">Intuiprep</h2>
                </div>

                <div className="flex flex-col gap-3 items-center">
                    <div className="w-16 h-16 rounded-full bg-primary-200/10 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary-200"
                        >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>

                    <h3>Check your email</h3>

                    <p className="text-light-100/70">
                        We&apos;ve sent a verification link to
                        {email && (
                            <span className="font-semibold text-primary-200 block mt-1">
                                {email}
                            </span>
                        )}
                    </p>

                    <p className="text-sm text-light-100/50 mt-2">
                        Click the link in the email to verify your account.
                        This page will automatically redirect you once verified.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full mt-4">
                    <Button
                        className="btn-primary w-full"
                        onClick={handleResendEmail}
                        disabled={isResending || cooldown > 0}
                    >
                        {isResending
                            ? "Sending..."
                            : cooldown > 0
                                ? `Resend in ${cooldown}s`
                                : "Resend Verification Email"}
                    </Button>

                    <Button
                        className="btn-secondary w-full"
                        onClick={() => router.push("/sign-in")}
                    >
                        Back to Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
