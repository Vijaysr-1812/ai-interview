import { redirect } from "next/navigation";

import InterviewSetupForm from "@/components/InterviewSetupForm";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    return (
        <>
            <h3>Create a New Interview</h3>
            <p className="text-light-100/60 mb-6">
                Set up your mock interview by selecting a role, experience level, and tech stack.
            </p>

            <InterviewSetupForm userId={user.id} />
        </>
    );
};

export default Page;
