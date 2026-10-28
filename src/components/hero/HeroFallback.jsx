import { stages } from '../../content/hero'

// Lightweight static composition that echoes the final 3D scene: stacked
// application layers with a neural structure rising from them. Pure SVG.
export function HeroFallbackArt() {
  const plates = [0, 1, 2, 3]
  const rings = [
    { cy: 250, rx: 150, n: 8 },
    { cy: 195, rx: 118, n: 9 },
    { cy: 145, rx: 82, n: 7 },
    { cy: 104, rx: 44, n: 4 },
  ]
  const nodes = rings.map((r, L) =>
    Array.from({ length: r.n }, (_, i) => {
      const a = (i / r.n) * Math.PI * 2 + L * 0.37
      return { x: 300 + Math.cos(a) * r.rx, y: r.cy + Math.sin(a) * r.rx * 0.22, L }
    }),
  )
  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-[6%] h-[52%] lg:inset-y-0 lg:right-[2%] lg:left-auto lg:h-full lg:w-[58%]">
      <svg viewBox="0 0 600 560" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hf-plate" x1="0" x2="1">
            <stop offset="0" stopColor="#3d8bff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="hf-glow">
            <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="200" rx="230" ry="170" fill="url(#hf-glow)" />
        {plates.map((k) => {
          const y = 300 + k * 52
          const s = 1 - k * 0.06
          const w = 210 * s
          const d = 70 * s
          return (
            <path
              key={k}
              d={`M${300 - w} ${y} L${300} ${y - d} L${300 + w} ${y} L${300} ${y + d} Z`}
              fill="#0b1030"
              fillOpacity="0.75"
              stroke="url(#hf-plate)"
              strokeOpacity={0.85 - k * 0.15}
              strokeWidth="1.2"
            />
          )
        })}
        {[-120, -40, 50, 130].map((x, i) => (
          <line key={i} x1={300 + x} y1={300 + (i % 2) * 12} x2={300 + x * 0.82} y2={456} stroke="#4cc9ff" strokeOpacity="0.35" />
        ))}
        {nodes.slice(0, -1).map((ring, L) =>
          ring.map((a, i) =>
            nodes[L + 1]
              .slice()
              .sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x))
              .slice(0, 2)
              .map((b, j) => (
                <line key={`${L}-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={L > 1 ? '#c084fc' : '#7dd3fc'} strokeOpacity="0.3" />
              )),
          ),
        )}
        {nodes.flat().map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={3 + n.L * 0.6} fill={n.L > 1 ? '#c084fc' : '#4cc9ff'} />
        ))}
      </svg>
    </div>
  )
}

// The whole journey as plain content, used when the scroll animation is off.
export function JourneyList() {
  return (
    <section id="journey" aria-labelledby="journey-heading" className="relative px-4 pt-10 pb-24 sm:px-8 lg:px-12">
      <h2 id="journey-heading" className="font-mono text-xs tracking-[0.22em] text-fg-muted uppercase">
        The journey
      </h2>
      <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((s) => (
          <li key={s.id} id={`stage-${s.id}`} className="scroll-mt-6 bg-ink-2 p-6 lg:p-8">
            <p className="font-mono text-xs tracking-[0.2em] text-electric uppercase">
              {s.index} — {s.label}
            </p>
            <h3 className="mt-3 text-lg font-medium tracking-[-0.01em] text-fg">
              {s.roles ? s.roles.join(' · ') : s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
            {s.project && (
              <p className="mt-3 border-l border-electric/50 pl-3 text-sm leading-relaxed text-fg-muted">
                <span className="font-semibold text-fg">{s.project.name}</span> — {s.project.summary}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
