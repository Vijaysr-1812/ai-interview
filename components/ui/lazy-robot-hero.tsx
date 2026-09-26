"use client";

import dynamic from "next/dynamic";
import { RobotHeroProps } from "./robot-hero";

// Sleek lightweight placeholder that renders immediately with zero WebGL overhead
function RobotHeroSkeleton({
  backgroundText = "INTUIPREP",
  ctaText = "Start Interview",
}: {
  backgroundText?: string;
  ctaText?: string;
}) {
  return (
    <section className="relative w-full h-[85vh] min-h-[640px] max-h-[920px] overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-gradient-to-b from-[#151821] via-[#0d0f14] to-[#08090c] flex items-center justify-center">
      {/* Background Big Typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <h1
          className="font-sans font-black select-none whitespace-nowrap"
          style={{
            color: "#ffffff",
            opacity: 0.04,
            letterSpacing: "-0.05em",
            fontSize: "clamp(4rem, 16vw, 15rem)",
            lineHeight: 1,
            transform: "translate(0px, 20px)",
          }}
        >
          {backgroundText}
        </h1>
      </div>

      {/* Center ambient glow & quick loader pill */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="size-36 rounded-full bg-primary-200/10 blur-3xl animate-pulse" />
          <div className="size-20 rounded-full border border-primary-200/20 border-t-primary-200 animate-spin" />
          <div className="absolute size-3 rounded-full bg-primary-200 animate-ping" />
        </div>

        <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary-200 animate-pulse" />
          <span className="text-xs text-light-100 font-medium">
            Initializing 3D Interactive Stage...
          </span>
        </div>
      </div>
    </section>
  );
}

// Dynamically import the heavy Three.js / React Three Fiber canvas only when needed on the client
const DynamicRobotHero = dynamic(
  () => import("./robot-hero").then((mod) => mod.RobotHero),
  {
    ssr: false,
    loading: () => <RobotHeroSkeleton />,
  }
);

export function LazyRobotHero(props: RobotHeroProps) {
  return <DynamicRobotHero {...props} />;
}

export default LazyRobotHero;
