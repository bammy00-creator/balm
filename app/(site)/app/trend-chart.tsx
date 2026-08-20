type TrendPoint = { day: string; avg_score: number; count: number };

// Pure server-rendered SVG - no chart library, no client JS. Fine for the
// dashboard's data volumes and keeps this route free of a new dependency.
export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-sm text-zinc-400">
        No responses yet in this period.
      </div>
    );
  }

  const width = 600;
  const height = 140;
  const padX = 8;
  const padY = 12;

  const xFor = (i: number) =>
    points.length === 1
      ? width / 2
      : padX + (i / (points.length - 1)) * (width - padX * 2);
  const yFor = (score: number) => height - padY - (score / 100) * (height - padY * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.avg_score).toFixed(1)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Composite score trend">
      <line x1={padX} y1={yFor(0)} x2={width - padX} y2={yFor(0)} stroke="#e4e4e7" strokeWidth={1} />
      <path d={path} fill="none" stroke="#18181b" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={p.day} cx={xFor(i)} cy={yFor(p.avg_score)} r={2.5} fill="#18181b" />
      ))}
      <text x={padX} y={height - 1} fontSize={10} fill="#71717a">
        {new Date(first.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </text>
      <text x={width - padX} y={height - 1} fontSize={10} fill="#71717a" textAnchor="end">
        {new Date(last.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </text>
    </svg>
  );
}
