import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import Navbar from "@/components/Navbar";

const Layout = async ({ children }: { children: ReactNode }) => {
    const user = await getCurrentUser();

    return (
        <div className="min-h-screen flex flex-col bg-dark-100 text-light-100">
            <Navbar user={user} />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
