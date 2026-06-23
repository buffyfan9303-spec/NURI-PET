import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * App targets KST. In production the server normalizes to Asia/Seoul;
 * client-side we format with the Korean locale for display.
 */
export function today(): Date {
  return new Date()
}

export function fmtDate(d: Date, pattern = 'M월 d일'): string {
  return format(d, pattern, { locale: ko })
}

export function fmtTime(d: Date): string {
  return format(d, 'a h:mm', { locale: ko })
}

export function fmtWeekday(d: Date): string {
  return format(d, 'EEEE', { locale: ko })
}

export function fmtMoney(won: number): string {
  return `₩${won.toLocaleString('ko-KR')}`
}
