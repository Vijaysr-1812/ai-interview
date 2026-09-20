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
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ? z.string().min(3, "Name must be at least 3 characters") : z.string().optional(),
        email: z.string().email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
            ),
    });
};

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = authFormSchema(type);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

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
                await sendEmailVerification(userCredential.user);

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
                    await sendEmailVerification(userCredential.user);
                    toast.error(
                        "Your email is not verified. A new verification email has been sent. Please check your inbox."
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
                    toast.error(result.message);
                    return;
                }

                toast.success("Signed in successfully.");
                router.push("/");
            }
        } catch (err) {
            const error = err as { code?: string };
            console.error("Auth error:", error);

            // User-friendly Firebase error messages
            if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email. Please sign up.");
            } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error("Invalid email or password. Please try again.");
            } else if (error.code === "auth/email-already-in-use") {
                toast.error("An account with this email already exists. Please sign in.");
            } else if (error.code === "auth/too-many-requests") {
                toast.error("Too many attempts. Please wait a moment and try again.");
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isSignIn = type === "sign-in";

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">Intuiprep</h2>
                </div>

                <h3>Practice job interviews with AI</h3>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6 mt-4 form"
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

                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />

                        <Button className="btn" type="submit" disabled={isLoading}>
                            {isLoading
                                ? "Please wait..."
                                : isSignIn
                                    ? "Sign In"
                                    : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center">
                    {isSignIn ? "No account yet?" : "Have an account already?"}
                    <Link
                        href={!isSignIn ? "/sign-in" : "/sign-up"}
                        className="font-bold text-user-primary ml-1"
                    >
                        {!isSignIn ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;
