import { scaleY, smoothPath, type Pt } from '@/lib/charts'

interface Props {
  data: number[]
  /** CSS color or var() string — applied via style so it themes correctly. */
  color: string
  w?: number
  h?: number
}

export function Sparkline({ data, color, w = 64, h = 24 }: Props) {
  const pad = 3
  const y = scaleY(data, h, pad)
  const step = (w - pad * 2) / (data.length - 1)
  const pts: Pt[] = data.map((v, i) => ({ x: pad + i * step, y: y(v) }))
  const path = smoothPath(pts)
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ display: 'block' }}>
      <path
        d={path}
        fill="none"
        style={{ stroke: color }}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.4" style={{ fill: color }} />
    </svg>
  )
}
