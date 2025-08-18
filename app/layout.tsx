import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";

const monaSans = Mona_Sans({
    variable: "--font-mona-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Intuiprep",
    description: "An AI-powered platform for preparing for mock interviews",
};

const workflowId = process.env.NEXT_PUBLIC_WORKFLOW_ID;

if (!workflowId) {
    // This will log in the browser console if the env variable is missing
    console.warn("Workflow ID is missing. Check your .env file and variable name.");
} else {
    console.log("Workflow ID loaded:", workflowId);
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
        <body className={`${monaSans.className} antialiased pattern`}>
        {children}
        <Toaster />
        </body>
        </html>
    );
}