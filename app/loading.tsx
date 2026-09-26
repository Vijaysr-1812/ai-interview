export default function RootLoading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-6 px-4">
      {/* Sleek animated glass pulse container */}
      <div className="relative flex items-center justify-center">
        {/* Ambient glow pulses */}
        <div className="absolute size-28 rounded-full bg-primary-200/20 blur-2xl animate-pulse" />
        <div className="absolute size-20 rounded-full bg-cyan-400/15 blur-xl animate-ping" />

        {/* Outer orbital rings */}
        <div className="size-20 rounded-full border-2 border-primary-200/20 border-t-primary-200 border-r-primary-200/80 animate-spin" />
        <div
          className="absolute size-14 rounded-full border border-cyan-400/30 border-b-cyan-400 border-l-transparent animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />

        {/* Center core pulse */}
        <div className="absolute size-6 rounded-full bg-gradient-to-tr from-primary-200 to-cyan-300 shadow-[0_0_16px_rgba(0,255,198,0.8)] animate-pulse" />
      </div>

      {/* Modern status text & loading skeleton pill */}
      <div className="flex flex-col items-center gap-2 text-center max-w-sm">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-200/80 border border-white/10 shadow-inner">
          <span className="size-2 rounded-full bg-primary-200 animate-pulse" />
          <span className="text-xs font-semibold text-primary-100 tracking-wider uppercase">
            Intuiprep AI Engine
          </span>
        </div>
        <p className="text-sm font-medium text-light-100/70 animate-pulse">
          Loading workspace & resources...
        </p>
      </div>

      {/* Shimmer skeleton bar */}
      <div className="w-48 h-1 rounded-full bg-dark-200 overflow-hidden relative border border-white/5">
        <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary-200 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}
