import Link from "next/link";
import { Sparkles, Brain, Mic, ShieldCheck, Target, ArrowRight, Award } from "lucide-react";

export const metadata = {
  title: "About Us | Intuiprep AI Interviewer",
  description:
    "Learn about Intuiprep, an intelligent AI-powered voice mock interview platform helping software engineers and tech professionals ace their dream jobs.",
};

export default function AboutPage() {
  const coreValues = [
    {
      icon: <Brain className="w-6 h-6 text-primary-100" />,
      title: "Real-Time Conversational AI",
      description:
        "Unlike static multiple-choice practice, Intuiprep simulates authentic voice conversations with realistic dynamic turn-taking and context-aware follow-up questions.",
    },
    {
      icon: <Target className="w-6 h-6 text-primary-100" />,
      title: "Granular 5-Dimension Analytics",
      description:
        "Receive precise score breakdowns across Technical Accuracy, Communication Clarity, Problem Solving Logic, Depth & Structure, and Professional Confidence.",
    },
    {
      icon: <Mic className="w-6 h-6 text-primary-100" />,
      title: "Zero-Cost Voice Technology",
      description:
        "Powered by modern browser-native speech recognition and speech synthesis, eliminating expensive per-minute audio vendor bills for maximum accessibility.",
    },
    {
      icon: <Award className="w-6 h-6 text-primary-100" />,
      title: "Actionable Growth Roadmaps",
      description:
        "Every session concludes with concrete recommendations, curated sample ideal answers, and a 3-stage plan (Immediate, Short Term, Long Term) to close preparation gaps.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary-100" />,
      title: "Safe, Private & Bias-Free",
      description:
        "Practice in a zero-judgment environment. Make mistakes, refine your answers, and build bulletproof confidence before stepping into the real interview room.",
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-4">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center gap-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-200/10 border border-primary-200/20 text-primary-100 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Empowering Job Seekers
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Master Tech Interviews with <span className="text-primary-100">Intelligent AI Voice Coaching</span>
        </h1>

        <p className="text-base sm:text-lg text-light-100/70 leading-relaxed">
          Intuiprep is built to bridge the gap between knowing technical concepts and articulating them clearly under interview pressure. We combine conversational voice AI with structured evaluation rubrics to make top-tier interview coaching accessible to everyone.
        </p>
      </section>

      {/* Mission & Problem Statement */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-border p-8 rounded-3xl flex flex-col justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-100 block mb-2">
              The Problem
            </span>
            <h2 className="text-2xl font-bold text-white mb-4">
              Great developers often fail interviews due to communication pressure
            </h2>
            <p className="text-light-100/70 text-sm leading-relaxed">
              Writing code in an editor is vastly different from verbally explaining system architecture, trade-offs, or debugging logic while a recruiter watches. Traditional prep is either solitary (reading documentation) or expensive (paying $150+/hour for human mock sessions).
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-light-100/60 italic">
            &ldquo;You don&apos;t rise to the occasion in an interview; you sink to the level of your training.&rdquo;
          </div>
        </div>

        <div className="card-border p-8 rounded-3xl flex flex-col justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-100 block mb-2">
              Our Solution
            </span>
            <h2 className="text-2xl font-bold text-white mb-4">
              A high-fidelity, zero-pressure voice training environment
            </h2>
            <p className="text-light-100/70 text-sm leading-relaxed">
              Intuiprep provides an interactive voice assistant tailored to your specific tech stack and target seniority level. You speak out loud, the AI listens and challenges you, and you walk away with actionable analytics that pinpoint exactly what to improve.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/interview"
              className="btn-primary text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2 font-semibold shadow-lg shadow-primary-200/20"
            >
              Take a Free Mock Session
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Key Pillars */}
      <section className="flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-white">Why Candidates Practice with Intuiprep</h2>
          <p className="text-light-100/60 text-sm">
            Everything you need to sharpen articulation, overcome anxiety, and earn your dream offer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreValues.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-dark-200/60 border border-white/5 hover:border-primary-200/30 transition-all flex flex-col gap-3 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-200/10 border border-primary-200/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-xs sm:text-sm text-light-100/60 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="card-cta flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-12 rounded-3xl">
        <div className="flex flex-col gap-3 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-light-100/70 text-sm">
            Start a voice interview tailored to your role, level, and tech stack in under 60 seconds.
          </p>
        </div>

        <Link
          href="/interview"
          className="btn-primary text-sm px-8 py-3 rounded-full font-bold shadow-xl shadow-primary-200/25 hover:scale-105 transition-transform shrink-0"
        >
          Start Practice Now
        </Link>
      </section>
    </div>
  );
}
