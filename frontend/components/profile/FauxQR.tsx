// A deterministic, decorative QR-style code for the prototype.
// (Renders a stable pattern from the URL — not a scannable QR.)

const N = 25;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isFinder(r: number, c: number): boolean {
  const inBox = (br: number, bc: number) =>
    r >= br && r < br + 7 && c >= bc && c < bc + 7;
  return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
}

export function FauxQR({ value, size = 140 }: { value: string; size?: number }) {
  const seed = hash(value);
  const cell = size / N;
  const dots: { x: number; y: number }[] = [];

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c)) continue;
      const v = Math.imul(seed ^ (r * 31 + c * 17), 2654435761);
      if (((v >>> 13) & 1) === 1) dots.push({ x: c * cell, y: r * cell });
    }
  }

  const finder = (br: number, bc: number) => (
    <g key={`${br}-${bc}`}>
      <rect x={bc * cell} y={br * cell} width={cell * 7} height={cell * 7} rx={cell} fill="currentColor" />
      <rect x={(bc + 1) * cell} y={(br + 1) * cell} width={cell * 5} height={cell * 5} rx={cell * 0.6} fill="white" />
      <rect x={(bc + 2) * cell} y={(br + 2) * cell} width={cell * 3} height={cell * 3} rx={cell * 0.4} fill="currentColor" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-foreground"
      role="img"
      aria-label="QR code to the public profile"
    >
      <rect width={size} height={size} fill="white" rx={10} />
      {dots.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width={cell} height={cell} rx={cell * 0.3} fill="currentColor" />
      ))}
      {finder(0, 0)}
      {finder(0, N - 7)}
      {finder(N - 7, 0)}
    </svg>
  );
}
