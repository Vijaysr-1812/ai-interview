"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp, signInWithGoogle } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ? z.string().min(3, "Name must be at least 3 characters") : z.string().optional(),
        email: z.string().email("Please enter a valid email address"),
        password: type === "sign-up"
            ? z
                .string()
                .min(8, "Password must be at least 8 characters")
                .regex(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
                )
            : z.string().min(1, "Password is required"),
    });
};

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const formSchema = authFormSchema(type);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const idToken = await user.getIdToken();
            const serverRes = await signInWithGoogle({
                uid: user.uid,
                email: user.email || "",
                name: user.displayName || "User",
                idToken,
            });

            if (!serverRes.success) {
                toast.error(serverRes.message);
                return;
            }

            toast.success("Signed in with Google successfully!");
            window.location.href = "/";
        } catch (err) {
            const error = err as { code?: string; message?: string };
            console.error("Google sign in error:", error);
            if (error.code === "auth/popup-closed-by-user") {
                toast.info("Google sign-in popup was closed.");
            } else if (error.code === "auth/unauthorized-domain") {
                toast.error("This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains.");
            } else {
                toast.error(error.message || "Failed to sign in with Google.");
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleSendPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetEmail = resetEmail.trim() || form.getValues("email").trim();
        if (!targetEmail) {
            toast.error("Please enter your email address to reset password.");
            return;
        }

        setIsResettingPassword(true);
        try {
            await sendPasswordResetEmail(auth, targetEmail);
            toast.success("Password reset email sent! Please check your inbox and spam folder.");
            setShowResetModal(false);
        } catch (err) {
            const error = err as { code?: string; message?: string };
            console.error("Password reset error:", error);
            if (error.code === "auth/user-not-found") {
                toast.error("No account exists with this email address.");
            } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many reset requests. Please wait a bit.");
            } else {
                toast.error(error.message || "Failed to send password reset email.");
            }
        } finally {
            setIsResettingPassword(false);
        }
    };

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);

        try {
            if (type === "sign-up") {
                const { name, email, password } = data;

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                // Send email verification
                try {
                    await sendEmailVerification(userCredential.user);
                } catch (e) {
                    console.warn("Could not send verification email:", e);
                }

                // Save user to Firestore (password is NOT sent to the server)
                const result = await signUp({
                    uid: userCredential.user.uid,
                    name: name!,
                    email,
                });

                if (!result.success) {
                    toast.error(result.message);
                    return;
                }

                toast.success("Account created! Please check your email to verify your account.");
                router.push("/verify-email");
            } else {
                const { email, password } = data;

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                // Check if email is verified before allowing sign-in
                if (!userCredential.user.emailVerified) {
                    // Resend verification email
                    try {
                        await sendEmailVerification(userCredential.user);
                    } catch (e) {
                        console.warn("Resend email error:", e);
                    }
                    toast.error(
                        "Your email is not verified. A verification email has been sent. Please check your inbox or spam."
                    );
                    router.push("/verify-email");
                    return;
                }

                const idToken = await userCredential.user.getIdToken();
                if (!idToken) {
                    toast.error("Sign in failed. Please try again.");
                    return;
                }

                const result = await signIn({
                    email,
                    idToken,
                });

                if (result && !result.success) {
                    toast.error(result.message || "Failed to log in.");
                    return;
                }

                toast.success("Signed in successfully! Redirecting...");
                // Use hard navigation to ensure session cookie is sent to server layout
                window.location.href = "/";
            }
        } catch (err) {
            const error = err as { code?: string; message?: string };
            console.error("Auth error:", error);

            // User-friendly Firebase error messages
            if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email. Please sign up.");
            } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Invalid email or password. Please check your credentials.");
            } else if (error.code === "auth/email-already-in-use") {
                toast.error("An account with this email already exists. Please sign in.");
            } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many attempts. Please wait a moment and try again.");
            } else {
                toast.error(error.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isSignIn = type === "sign-in";

    return (
        <div className="card-border lg:min-w-[566px] relative">
            <div className="flex flex-col gap-6 card py-12 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">Intuiprep</h2>
                </div>

                <h3>{isSignIn ? "Welcome Back to Intuiprep" : "Practice job interviews with AI"}</h3>

                {/* Google Sign In Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-medium text-sm text-light-100 cursor-pointer disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                    </svg>
                    {isGoogleLoading
                        ? "Connecting to Google..."
                        : isSignIn
                            ? "Continue with Google"
                            : "Sign up with Google"}
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">or with email</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-5 form"
                    >
                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Name"
                                placeholder="Your Name"
                                type="text"
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your email address"
                            type="email"
                        />

                        <div>
                            <FormField
                                control={form.control}
                                name="password"
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                            />
                            {/* Forgot Password Link on Sign In */}
                            <div className="flex justify-end mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetEmail(form.getValues("email") || "");
                                        setShowResetModal(true);
                                    }}
                                    className="text-xs text-primary-200 hover:text-white transition-colors cursor-pointer"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <Button className="btn w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                            {isLoading
                                ? "Please wait..."
                                : isSignIn
                                    ? "Sign In"
                                    : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground">
                    {isSignIn ? "No account yet?" : "Have an account already?"}
                    <Link
                        href={!isSignIn ? "/sign-in" : "/sign-up"}
                        className="font-bold text-user-primary ml-1 hover:underline"
                    >
                        {!isSignIn ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <h3 className="text-lg font-bold text-light-100 mb-2">Reset Your Password</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <form onSubmit={handleSendPasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-light-200 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-3 py-2.5 rounded-lg bg-dark-200 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-100 text-sm"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowResetModal(false)}
                                    disabled={isResettingPassword}
                                    className="border-white/10 hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isResettingPassword}
                                    className="btn"
                                >
                                    {isResettingPassword ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthForm;
