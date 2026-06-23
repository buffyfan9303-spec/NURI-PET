/** Mock data for the owner-facing NURI PET condition dashboard.
 *  Regulatory note (CLAUDE.md §2): this is a *record / summary* tool.
 *  No diagnosis, prescription, or treatment language anywhere. */

export type Status = 'good' | 'warn' | 'alert'

export const PET_PROFILE = {
  name: '도도',
  breed: '비숑',
  age: 11,
  weightKg: 5.2,
  careTag: '시니어 케어',
} as const

/** Last 14 days of overall condition (signature strip). */
export const STRIP: Status[] = [
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'good',
  'warn',
  'warn',
  'warn',
]

/** 7-point sparklines for the metric grid. */
export const SPARKS: Record<string, number[]> = {
  appetite: [6, 6, 7, 6, 6, 7, 6],
  water: [5, 5, 6, 6, 7, 8, 9],
  energy: [6, 7, 6, 6, 7, 6, 6],
  weight: [52, 52, 52, 51, 52, 52, 52],
}

/** 30-day series for the trend view. */
export const SERIES: Record<string, number[]> = {
  water: [
    44, 45, 44, 46, 47, 46, 48, 47, 49, 48, 50, 49, 51, 52, 51, 53, 54, 53, 55, 56, 55, 57, 58, 57,
    59, 60, 62, 61, 63, 64,
  ],
  appetite: [
    70, 72, 71, 70, 73, 72, 70, 71, 72, 70, 69, 71, 72, 70, 71, 72, 70, 73, 71, 70, 72, 71, 70, 72,
    71, 70, 71, 72, 70, 71,
  ],
  energy: [
    62, 66, 61, 64, 67, 63, 65, 62, 66, 64, 60, 65, 67, 62, 64, 66, 61, 65, 63, 62, 67, 64, 61, 66,
    63, 62, 65, 64, 61, 63,
  ],
  weight: [
    52, 52, 52, 51, 52, 52, 52, 52, 51, 52, 52, 52, 51, 52, 52, 52, 52, 51, 52, 52, 52, 51, 52, 52,
    52, 52, 51, 52, 52, 52,
  ],
}

export interface DimMeta {
  label: string
  unit: string
  /** CSS variable color string — applied via inline style so it themes. */
  color: string
  rising: boolean
}

export const DIM: Record<string, DimMeta> = {
  water: { label: '음수량', unit: '% (평소 대비)', color: 'var(--warn)', rising: true },
  appetite: { label: '식욕', unit: '지수', color: 'var(--good)', rising: false },
  energy: { label: '활력', unit: '지수', color: 'var(--good)', rising: false },
  weight: { label: '체중', unit: '× 0.1kg', color: 'var(--tx2)', rising: false },
}

export const QUICK: Record<string, string[]> = {
  식욕: ['좋음', '보통', '적음'],
  음수: ['많음', '보통', '적음'],
  활력: ['활발', '보통', '처짐'],
}
