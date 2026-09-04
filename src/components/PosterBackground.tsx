/**
 * Original, hand-drawn psychedelic jam-band-poster-style backdrop:
 * layered gradients + SVG mountains / mandala sun / jellyfish / mushrooms /
 * swirls / stars. Not a reproduction of any specific real poster — just
 * channeling the vibe (tie-dye colors, nature + cosmic motifs, bold flat
 * linework, floating jellyfish) as a v1 look to tweak from.
 */
export default function PosterBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-cheese-radial" aria-hidden="true">
      {/* jellyfish bloom, upper left — balances the mandala sun */}
      <svg
        className="absolute -left-10 -top-10 h-64 w-64 opacity-70 sm:h-80 sm:w-80"
        viewBox="0 0 100 100"
      >
        <Jellyfish x={30} y={20} scale={1.1} bell="#ff5fa2" />
        <Jellyfish x={62} y={40} scale={0.7} bell="#0f9c9c" />
        <Jellyfish x={10} y={55} scale={0.55} bell="#ffb100" />
      </svg>

      {/* mandala sun, upper right */}
      <svg
        className="absolute -right-16 -top-16 h-72 w-72 opacity-70 sm:h-96 sm:w-96"
        viewBox="0 0 200 200"
      >
        <g fill="none" strokeWidth="2">
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={100 + 95 * Math.cos((i * Math.PI) / 8)}
              y2={100 + 95 * Math.sin((i * Math.PI) / 8)}
              stroke="#ffe066"
              strokeOpacity="0.35"
            />
          ))}
          <circle cx="100" cy="100" r="70" stroke="#ffb100" strokeOpacity="0.55" />
          <circle cx="100" cy="100" r="50" stroke="#ff5fa2" strokeOpacity="0.5" />
          <circle cx="100" cy="100" r="30" stroke="#0f9c9c" strokeOpacity="0.6" />
        </g>
        <circle cx="100" cy="100" r="14" fill="#ffe066" fillOpacity="0.85" />
      </svg>

      {/* scattered stars */}
      <svg
        className="absolute inset-0 h-full w-full opacity-60"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        {STAR_POSITIONS.map(({ x, y, s }, i) => (
          <path
            key={i}
            d={starPath(x, y, s)}
            fill={i % 2 === 0 ? "#ffe066" : "#ff5fa2"}
            fillOpacity="0.55"
          />
        ))}
      </svg>

      {/* swirls */}
      <svg
        className="absolute left-4 top-1/3 h-40 w-40 opacity-40 sm:h-56 sm:w-56"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 10 C 20 10, 20 45, 50 45 C 75 45, 75 20, 55 20 C 40 20, 40 35, 55 35"
          fill="none"
          stroke="#c2247a"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute right-8 top-1/2 h-32 w-32 opacity-40 sm:h-48 sm:w-48"
        viewBox="0 0 100 100"
      >
        <path
          d="M50 90 C 80 90, 80 55, 50 55 C 25 55, 25 80, 45 80 C 60 80, 60 65, 45 65"
          fill="none"
          stroke="#0f9c9c"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* mushrooms, bottom left */}
      <svg
        className="absolute -bottom-4 left-6 h-40 w-40 opacity-80 sm:h-56 sm:w-56"
        viewBox="0 0 100 100"
      >
        <Mushroom x={10} y={40} scale={0.9} cap="#ff5fa2" />
        <Mushroom x={45} y={55} scale={1.3} cap="#ffb100" />
        <Mushroom x={75} y={35} scale={0.7} cap="#0f9c9c" />
      </svg>

      {/* rolling mountains along the bottom */}
      <svg
        className="absolute bottom-0 left-0 h-40 w-full opacity-80 sm:h-56"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
      >
        <path d="M0 120 L0 70 L60 20 L130 70 L200 10 L270 70 L340 30 L400 70 L400 120 Z" fill="#3b1360" fillOpacity="0.9" />
        <path d="M0 120 L0 95 L90 55 L180 95 L260 45 L330 95 L400 60 L400 120 Z" fill="#6b2fb3" fillOpacity="0.85" />
      </svg>

      {/* soft vignette so foreground text stays legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-cheese-ink/40 via-transparent to-cheese-ink/80" />
    </div>
  );
}

function Mushroom({
  x,
  y,
  scale,
  cap,
}: {
  x: number;
  y: number;
  scale: number;
  cap: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="6" y="14" width="8" height="18" rx="3" fill="#ffe066" />
      <path d="M0 14 C 0 -2, 20 -2, 20 14 C 20 18, 0 18, 0 14 Z" fill={cap} />
      <circle cx="5" cy="9" r="1.6" fill="white" fillOpacity="0.8" />
      <circle cx="12" cy="6" r="1.2" fill="white" fillOpacity="0.8" />
      <circle cx="16" cy="10" r="1" fill="white" fillOpacity="0.8" />
    </g>
  );
}

function Jellyfish({
  x,
  y,
  scale,
  bell,
}: {
  x: number;
  y: number;
  scale: number;
  bell: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* dome + scalloped skirt */}
      <path
        d="M-10 0 C -10 -12, 10 -12, 10 0 C 10 2, 7 1, 5 3 C 3 1, 1 2, -1 0 C -3 2, -5 1, -7 3 C -9 1, -10 2, -10 0 Z"
        fill={bell}
        fillOpacity="0.75"
      />
      <path
        d="M-10 -1 C -6 -9, 6 -9, 10 -1"
        fill="none"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      {/* trailing tentacles */}
      <path d="M-6 2 C -8 8, -4 10, -6 16" fill="none" stroke={bell} strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M-2 3 C -3 10, 1 12, -1 20" fill="none" stroke={bell} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 3 C 3 9, -1 12, 2 18" fill="none" stroke={bell} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 2 C 8 9, 4 11, 7 17" fill="none" stroke={bell} strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="-4" cy="-6" r="1" fill="white" fillOpacity="0.8" />
      <circle cx="3" cy="-7" r="0.8" fill="white" fillOpacity="0.7" />
    </g>
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
