"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXPERIENCE_LEVELS = ["Junior", "Mid-Level", "Senior", "Lead"];
const INTERVIEW_TYPES = ["Technical", "Behavioral", "Mixed"];

const InterviewSetupForm = ({ userId }: { userId: string }) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        role: "",
        level: "Junior",
        type: "Technical",
        techstack: "",
        amount: 10,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "amount" ? parseInt(value) || 5 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.role.trim()) {
            toast.error("Please enter a job role.");
            return;
        }

        if (!formData.techstack.trim()) {
            toast.error("Please enter at least one technology.");
            return;
        }

        if (formData.amount < 3 || formData.amount > 20) {
            toast.error("Number of questions must be between 3 and 20.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/interview/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    userId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Failed to generate interview.");
                return;
            }

            toast.success("Interview created successfully!");
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Error creating interview:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card-border w-full max-w-2xl mx-auto">
            <div className="card p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Job Role */}
                    <div className="flex flex-col gap-2">
                        <label className="label" htmlFor="role">
                            Job Role
                        </label>
                        <Input
                            id="role"
                            name="role"
                            className="input"
                            placeholder="e.g., Frontend Developer, Data Scientist"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Experience Level */}
                    <div className="flex flex-col gap-2">
                        <label className="label" htmlFor="level">
                            Experience Level
                        </label>
                        <select
                            id="level"
                            name="level"
                            className="input bg-dark-200 border-dark-100 rounded-lg px-4 py-3 text-light-100"
                            value={formData.level}
                            onChange={handleChange}
                        >
                            {EXPERIENCE_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Interview Type */}
                    <div className="flex flex-col gap-2">
                        <label className="label" htmlFor="type">
                            Interview Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            className="input bg-dark-200 border-dark-100 rounded-lg px-4 py-3 text-light-100"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            {INTERVIEW_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-col gap-2">
                        <label className="label" htmlFor="techstack">
                            Tech Stack
                        </label>
                        <Input
                            id="techstack"
                            name="techstack"
                            className="input"
                            placeholder="e.g., React, Node.js, TypeScript (comma-separated)"
                            value={formData.techstack}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-xs text-light-100/50">
                            Separate technologies with commas
                        </p>
                    </div>

                    {/* Number of Questions */}
                    <div className="flex flex-col gap-2">
                        <label className="label" htmlFor="amount">
                            Number of Questions
                        </label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            className="input"
                            min={3}
                            max={20}
                            value={formData.amount}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-light-100/50">
                            Between 3 and 20 questions
                        </p>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="btn-primary w-full mt-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Generating Interview...
                            </span>
                        ) : (
                            "Generate Interview"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default InterviewSetupForm;
