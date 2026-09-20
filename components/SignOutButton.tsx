"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";

const SignOutButton = () => {
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Signed out successfully.");
            router.push("/sign-in");
        } catch (error) {
            console.error("Error signing out:", error);
            toast.error("Failed to sign out. Please try again.");
        }
    };

    return (
        <Button
            className="btn-secondary text-sm px-4 py-2"
            onClick={handleSignOut}
        >
            Sign Out
        </Button>
    );
};

export default SignOutButton;
