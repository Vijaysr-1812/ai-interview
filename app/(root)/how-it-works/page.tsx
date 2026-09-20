import Link from "next/link";
import { SlidersHorizontal, Mic, BarChart3, ArrowRight, CheckCircle2, Volume2 } from "lucide-react";

export const metadata = {
  title: "How It Works | Intuiprep AI Interviewer",
  description:
    "An overview of how Intuiprep works and how candidates can take up a realistic AI-powered mock interview in 3 simple steps.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      stepNumber: "01",
      icon: <SlidersHorizontal className="w-7 h-7 text-primary-100" />,
      title: "Set Up Your Target Role",
      description:
        "Select your desired position (e.g. Frontend Engineer, Backend Developer, Full Stack), your target seniority level (Junior, Mid, Senior, Lead), and your core tech stack.",
      highlights: [
        "Tailored to your specific technologies",
        "Configurable question counts (3 to 20)",
        "Choose between Technical, Behavioral, or Mixed focus",
      ],
    },
    {
      stepNumber: "02",
      icon: <Mic className="w-7 h-7 text-primary-100" />,
      title: "Engage in Real-Time Voice Dialogue",
      description:
        "Enter the interview room. The AI interviewer greets you and speaks each question aloud. You respond using your microphone naturally, just like in a live conversation.",
      highlights: [
        "Hands-free voice recognition with auto-turn taking",
        "Two-way horizontal live transcript stream",
        "Manual 'Done Speaking' option for instant pacing control",
      ],
    },
    {
      stepNumber: "03",
      icon: <BarChart3 className="w-7 h-7 text-primary-100" />,
      title: "Get Granular Feedback & Roadmaps",
      description:
        "Upon concluding, your entire conversation is scored across 5 core dimensions. You receive strengths with direct transcript quotes, identified gaps, and ideal answers.",
      highlights: [
        "Overall Performance Band & Hiring Recommendation",
        "Categorized metric breakdown (Accuracy, Clarity, Logic, etc.)",
        "Actionable 3-stage roadmap (Immediate, Short, Long Term)",
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-4">
      {/* Header */}
      <section className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-200/10 border border-primary-200/20 text-primary-100 text-xs font-semibold uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Simple 3-Step Process
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          How Intuiprep <span className="text-primary-100">Works</span>
        </h1>

        <p className="text-base sm:text-lg text-light-100/70 leading-relaxed">
          Taking a mock interview on Intuiprep is fast, intuitive, and realistic. Here is a quick overview of how the interview experience works and how you can take one up today.
        </p>
      </section>

      {/* 3 Step Cards */}
      <section className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="card-border p-8 rounded-3xl flex flex-col justify-between gap-6 hover:border-primary-200/40 transition-all relative overflow-hidden"
            >
              <div className="absolute top-4 right-6 font-black text-6xl text-white/[0.03] select-none pointer-events-none">
                {step.stepNumber}
              </div>

              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center">
                  {step.icon}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-100 block mb-1">
                    Step {step.stepNumber}
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                  <p className="text-light-100/70 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-2 relative z-10">
                {step.highlights.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 text-xs text-light-100/80">
                    <CheckCircle2 size={14} className="text-primary-100 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Candidate Preparation Best Practices Alert */}
      <section className="p-6 sm:p-8 rounded-3xl bg-dark-200/80 border border-yellow-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 text-yellow-400">
            <Volume2 size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Tips for Best Voice Accuracy
            </h3>
            <p className="text-xs sm:text-sm text-light-100/70 max-w-2xl leading-relaxed">
              For optimal speech recognition, use Google Chrome or Microsoft Edge, speak in a quiet room, and enunciate your words clearly. You can also press &ldquo;Done Speaking&rdquo; whenever you finish an answer.
            </p>
          </div>
        </div>

        <Link
          href="/interview"
          className="btn-primary text-xs sm:text-sm px-6 py-2.5 rounded-full whitespace-nowrap shrink-0 flex items-center gap-2 font-semibold shadow-lg shadow-primary-200/20 hover:scale-105 transition-transform"
        >
          Start Your Interview
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
