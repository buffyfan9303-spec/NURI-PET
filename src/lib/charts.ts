export interface Pt {
  x: number
  y: number
}

/** Catmull-Rom-ish smoothing into a cubic Bézier path. */
export function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  const d = [`M ${pts[0].x} ${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(
        1,
      )} ${p2.y.toFixed(1)}`,
    )
  }
  return d.join(' ')
}

/** Returns a function mapping a data value to a y pixel within [pad, h-pad]. */
export function scaleY(vals: number[], h: number, pad: number): (v: number) => number {
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  return (v: number) => h - pad - ((v - min) / span) * (h - pad * 2)
}
