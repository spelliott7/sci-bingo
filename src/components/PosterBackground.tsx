/**
 * Original cosmic gig-poster-style backdrop: deep nebula gradient, an ornate
 * gold corner frame, a ringed planet, a streaking comet, and scattered
 * stars. Inspired by the general language of space-themed jam-band tour
 * posters (ornate Nouveau framing, bold cosmic scenes, comet trails) — not a
 * reproduction of any specific real poster's artwork or composition.
 */
export default function PosterBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-cheese-cosmic" aria-hidden="true">
      {/* soft nebula glows */}
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-cheese-magenta/25 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cheese-teal/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cheese-gold/10 blur-3xl" />

      {/* thin nebula swirl linework */}
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 400" preserveAspectRatio="none">
        <path d="M-20 120 C 80 60, 160 180, 260 100 S 420 40, 460 120" fill="none" stroke="#ffe066" strokeWidth="1" />
        <path d="M-20 260 C 90 320, 150 200, 260 280 S 420 340, 460 260" fill="none" stroke="#ff5fa2" strokeWidth="1" />
        <path d="M40 -20 C 10 60, 90 90, 60 180" fill="none" stroke="#0f9c9c" strokeWidth="1" />
      </svg>

      {/* scattered stars */}
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 400 400" preserveAspectRatio="none">
        {STAR_POSITIONS.map(({ x, y, s }, i) => (
          <path key={i} d={starPath(x, y, s)} fill={i % 2 === 0 ? "#ffe066" : "#ff5fa2"} fillOpacity="0.7" />
        ))}
      </svg>

      {/* ringed planet, lower right */}
      <svg className="absolute -bottom-10 -right-10 h-56 w-56 opacity-90 sm:h-72 sm:w-72" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="planetShade" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#c2247a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#3b1360" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#160a26" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <g transform="translate(100 100) rotate(-18)">
          <ellipse cx="0" cy="0" rx="92" ry="20" fill="none" stroke="#ffe066" strokeOpacity="0.6" strokeWidth="3" />
          <circle cx="0" cy="0" r="46" fill="url(#planetShade)" />
          <ellipse cx="0" cy="0" rx="92" ry="20" fill="none" stroke="#ffb100" strokeOpacity="0.85" strokeWidth="2" strokeDasharray="2 5" />
        </g>
      </svg>

      {/* comet streaking across the upper field */}
      <svg className="absolute left-0 top-8 h-40 w-full opacity-90 sm:top-12" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cometTail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5fa2" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffe066" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path d="M20 10 L230 55" stroke="url(#cometTail)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="235" cy="56" r="5" fill="#ffe066" />
        <circle cx="235" cy="56" r="9" fill="#ffe066" fillOpacity="0.35" />
      </svg>

      {/* ornate gold corner frame */}
      <CornerFlourish className="absolute left-3 top-3" />
      <CornerFlourish className="absolute right-3 top-3 -scale-x-100" />
      <CornerFlourish className="absolute bottom-3 left-3 -scale-y-100" />
      <CornerFlourish className="absolute bottom-3 right-3 -scale-x-100 -scale-y-100" />

      {/* soft vignette so foreground text stays legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-cheese-ink/50 via-transparent to-cheese-ink/85" />
    </div>
  );
}

function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-20 w-20 opacity-70 sm:h-28 sm:w-28 ${className}`} viewBox="0 0 100 100" fill="none">
      <path d="M4 60 L4 12 C4 7 7 4 12 4 L60 4" stroke="#ffb100" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 40 C 24 40, 24 24, 40 24" stroke="#ffe066" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 4 C 18 20, 32 16, 32 30 C 32 40, 20 38, 22 48" stroke="#ff5fa2" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" fill="#ffe066" fillOpacity="0.8" />
    </svg>
  );
}

const STAR_POSITIONS = [
  { x: 8, y: 12, s: 5 },
  { x: 22, y: 30, s: 3 },
  { x: 60, y: 8, s: 4 },
  { x: 78, y: 22, s: 6 },
  { x: 90, y: 45, s: 3 },
  { x: 35, y: 60, s: 4 },
  { x: 15, y: 78, s: 3 },
  { x: 68, y: 68, s: 5 },
  { x: 50, y: 85, s: 3 },
  { x: 88, y: 80, s: 4 },
];

function starPath(cxPct: number, cyPct: number, size: number) {
  const cx = cxPct * 4; // rough spread across a 0-400-ish viewbox-less coordinate space
  const cy = cyPct * 4;
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? size : size / 2.5;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${points.join(" L")}Z`;
}
