/** Shared mock domain — mirrors CLAUDE.md §5 schema.
 *  This is the single source for all operator screens. Swappable for Supabase
 *  later: UI imports from here only, so the migration is a data-layer change.
 *
 *  Regulatory note (§2): health fields (vaccinations, weight) are for
 *  record / display only — no diagnosis, prescription, or treatment logic. */

export const DEMO_TODAY = '2026-06-24' // Wednesday — anchors seeded data

export const STORE = {
  name: '도그웰 살롱',
  type: '미용실',
  open: '10:00',
  close: '20:00',
  closedWeekdays: [0], // Sunday
} as const

/* ----- services ----- */
export type ServiceCategory = '미용' | '목욕' | '호텔' | '데이케어'
export interface Service {
  id: string
  category: ServiceCategory
  name: string
  price: number
  durationMin: number
}
export const SERVICES: Service[] = [
  { id: 'sv1', category: '미용', name: '전체미용', price: 55000, durationMin: 90 },
  { id: 'sv2', category: '미용', name: '부분미용', price: 30000, durationMin: 60 },
  { id: 'sv3', category: '목욕', name: '목욕+부분', price: 35000, durationMin: 60 },
  { id: 'sv4', category: '미용', name: '위생미용', price: 20000, durationMin: 40 },
  { id: 'sv5', category: '미용', name: '전체미용+스파', price: 75000, durationMin: 120 },
  { id: 'sv6', category: '목욕', name: '고양이 목욕', price: 40000, durationMin: 60 },
]

/* ----- staff ----- */
export interface StaffMember {
  id: string
  name: string
  role: 'owner' | 'staff'
  commissionRate: number // 0..1
  color: string // CSS var or hex
}
export const STAFF: StaffMember[] = [
  { id: 'st1', name: '김미용', role: 'owner', commissionRate: 0, color: 'var(--accent)' },
  { id: 'st2', name: '이그루', role: 'staff', commissionRate: 0.35, color: 'var(--good)' },
  { id: 'st3', name: '박트림', role: 'staff', commissionRate: 0.3, color: 'var(--warn)' },
]

/* ----- customers & pets ----- */
export interface Customer {
  id: string
  name: string
  phone: string
  notifyConsent: boolean
  noShowScore: number // 0..5, higher = riskier
  memo?: string
}
export type Species = '강아지' | '고양이'
export type Temperament = '온순' | '활발' | '예민' | '겁많음'
export interface Vaccination {
  name: string
  date: string
}
export interface Pet {
  id: string
  customerId: string
  name: string
  species: Species
  breed: string
  ageY: number
  weightKg: number
  vaccinations: Vaccination[]
  allergies: string[]
  groomingNote: string
  temperament: Temperament
}

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: '박지현', phone: '010-2841-7720', notifyConsent: true, noShowScore: 0 },
  { id: 'c2', name: '정우성', phone: '010-5530-1182', notifyConsent: true, noShowScore: 1 },
  { id: 'c3', name: '한소희', phone: '010-9921-4456', notifyConsent: true, noShowScore: 0, memo: '단골 · 항상 정시' },
  { id: 'c4', name: '김태리', phone: '010-3372-8890', notifyConsent: false, noShowScore: 0 },
  { id: 'c5', name: '이도현', phone: '010-7765-2201', notifyConsent: true, noShowScore: 2 },
  { id: 'c6', name: '손예진', phone: '010-1188-6643', notifyConsent: true, noShowScore: 0 },
  { id: 'c7', name: '조정석', phone: '010-4419-3357', notifyConsent: true, noShowScore: 3, memo: '노쇼 이력 · 보증금 권장' },
  { id: 'c8', name: '아이유', phone: '010-2025-7788', notifyConsent: true, noShowScore: 0 },
  { id: 'c9', name: '공유', phone: '010-6612-0094', notifyConsent: false, noShowScore: 1 },
  { id: 'c10', name: '전지현', phone: '010-8843-5519', notifyConsent: true, noShowScore: 0, memo: '대형견 2마리' },
]

export const PETS: Pet[] = [
  { id: 'p1', customerId: 'c1', name: '초코', species: '강아지', breed: '푸들', ageY: 4, weightKg: 6.2, vaccinations: [{ name: '종합백신', date: '2026-03-12' }, { name: '광견병', date: '2026-03-12' }], allergies: ['닭'], groomingNote: '얼굴 둥글게 · 발바닥 짧게', temperament: '온순' },
  { id: 'p2', customerId: 'c2', name: '보리', species: '강아지', breed: '말티즈', ageY: 2, weightKg: 3.1, vaccinations: [{ name: '종합백신', date: '2026-05-02' }], allergies: [], groomingNote: '눈물자국 케어', temperament: '활발' },
  { id: 'p3', customerId: 'c3', name: '뭉치', species: '강아지', breed: '비숑', ageY: 5, weightKg: 5.4, vaccinations: [{ name: '종합백신', date: '2026-01-20' }, { name: '광견병', date: '2026-01-20' }], allergies: [], groomingNote: '전체 둥글게(비숑컷)', temperament: '온순' },
  { id: 'p4', customerId: 'c4', name: '나비', species: '고양이', breed: '코리안숏헤어', ageY: 3, weightKg: 4.0, vaccinations: [{ name: '종합백신', date: '2026-02-15' }], allergies: [], groomingNote: '드라이 시 입질 주의', temperament: '예민' },
  { id: 'p5', customerId: 'c5', name: '두부', species: '강아지', breed: '시츄', ageY: 7, weightKg: 6.8, vaccinations: [{ name: '종합백신', date: '2025-12-01' }], allergies: ['소고기'], groomingNote: '귀 안쪽 세정', temperament: '온순' },
  { id: 'p6', customerId: 'c6', name: '콩이', species: '강아지', breed: '포메라니안', ageY: 1, weightKg: 2.4, vaccinations: [{ name: '종합백신', date: '2026-04-22' }], allergies: [], groomingNote: '곰돌이컷', temperament: '활발' },
  { id: 'p7', customerId: 'c7', name: '랑이', species: '강아지', breed: '웰시코기', ageY: 3, weightKg: 11.5, vaccinations: [{ name: '종합백신', date: '2026-03-30' }, { name: '광견병', date: '2026-03-30' }], allergies: [], groomingNote: '엉덩이 라인 정리', temperament: '활발' },
  { id: 'p8', customerId: 'c8', name: '먼지', species: '고양이', breed: '러시안블루', ageY: 4, weightKg: 4.5, vaccinations: [{ name: '종합백신', date: '2026-02-10' }], allergies: [], groomingNote: '빗질 위주, 단모', temperament: '겁많음' },
  { id: 'p9', customerId: 'c9', name: '바둑', species: '강아지', breed: '진돗개', ageY: 6, weightKg: 18.0, vaccinations: [{ name: '종합백신', date: '2026-01-05' }, { name: '광견병', date: '2026-01-05' }], allergies: [], groomingNote: '목욕+털갈이 관리', temperament: '온순' },
  { id: 'p10', customerId: 'c10', name: '백호', species: '강아지', breed: '사모예드', ageY: 2, weightKg: 22.0, vaccinations: [{ name: '종합백신', date: '2026-04-01' }], allergies: [], groomingNote: '언더코트 집중 · 시간 여유', temperament: '온순' },
  { id: 'p11', customerId: 'c10', name: '흑호', species: '강아지', breed: '사모예드', ageY: 2, weightKg: 21.5, vaccinations: [{ name: '종합백신', date: '2026-04-01' }], allergies: [], groomingNote: '백호와 동일', temperament: '활발' },
  { id: 'p12', customerId: 'c1', name: '라떼', species: '강아지', breed: '푸들', ageY: 1, weightKg: 4.0, vaccinations: [{ name: '종합백신', date: '2026-05-18' }], allergies: [], groomingNote: '첫 미용 · 천천히', temperament: '겁많음' },
]

/* ----- appointments ----- */
export type ApptStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'done'
  | 'no_show'
  | 'cancelled'

export const STATUS_META: Record<
  ApptStatus,
  { label: string; tone: 'good' | 'warn' | 'alert' | 'accent' | 'muted' }
> = {
  requested: { label: '요청', tone: 'muted' },
  confirmed: { label: '확정', tone: 'accent' },
  checked_in: { label: '입실', tone: 'good' },
  done: { label: '완료', tone: 'good' },
  no_show: { label: '노쇼', tone: 'alert' },
  cancelled: { label: '취소', tone: 'muted' },
}

export interface Appt {
  id: string
  date: string // YYYY-MM-DD
  start: string // HH:MM
  durationMin: number
  petId: string
  staffId: string
  serviceId: string
  status: ApptStatus
  deposit: number
  paid: boolean
}

// Week of 2026-06-22 (Mon) – 06-27 (Sat); 06-24 (Wed) is the demo "today".
export const APPTS: Appt[] = [
  // Mon 06-22
  { id: 'a01', date: '2026-06-22', start: '10:30', durationMin: 90, petId: 'p1', staffId: 'st1', serviceId: 'sv1', status: 'done', deposit: 0, paid: true },
  { id: 'a02', date: '2026-06-22', start: '14:00', durationMin: 60, petId: 'p6', staffId: 'st2', serviceId: 'sv2', status: 'done', deposit: 0, paid: true },
  // Tue 06-23
  { id: 'a03', date: '2026-06-23', start: '11:00', durationMin: 120, petId: 'p10', staffId: 'st1', serviceId: 'sv5', status: 'done', deposit: 20000, paid: true },
  { id: 'a04', date: '2026-06-23', start: '15:30', durationMin: 60, petId: 'p4', staffId: 'st3', serviceId: 'sv6', status: 'done', deposit: 0, paid: true },
  // Wed 06-24 (today)
  { id: 'a05', date: '2026-06-24', start: '10:00', durationMin: 90, petId: 'p1', staffId: 'st1', serviceId: 'sv1', status: 'done', deposit: 0, paid: true },
  { id: 'a06', date: '2026-06-24', start: '10:30', durationMin: 60, petId: 'p2', staffId: 'st2', serviceId: 'sv3', status: 'checked_in', deposit: 0, paid: false },
  { id: 'a07', date: '2026-06-24', start: '12:00', durationMin: 120, petId: 'p3', staffId: 'st1', serviceId: 'sv1', status: 'confirmed', deposit: 0, paid: false },
  { id: 'a08', date: '2026-06-24', start: '13:30', durationMin: 60, petId: 'p4', staffId: 'st3', serviceId: 'sv6', status: 'confirmed', deposit: 0, paid: false },
  { id: 'a09', date: '2026-06-24', start: '15:00', durationMin: 90, petId: 'p5', staffId: 'st2', serviceId: 'sv1', status: 'requested', deposit: 0, paid: false },
  { id: 'a10', date: '2026-06-24', start: '16:30', durationMin: 60, petId: 'p6', staffId: 'st3', serviceId: 'sv2', status: 'confirmed', deposit: 0, paid: false },
  { id: 'a11', date: '2026-06-24', start: '18:00', durationMin: 90, petId: 'p7', staffId: 'st1', serviceId: 'sv5', status: 'no_show', deposit: 0, paid: false },
  // Thu 06-25
  { id: 'a12', date: '2026-06-25', start: '11:00', durationMin: 90, petId: 'p11', staffId: 'st1', serviceId: 'sv1', status: 'confirmed', deposit: 20000, paid: false },
  { id: 'a13', date: '2026-06-25', start: '14:30', durationMin: 40, petId: 'p2', staffId: 'st2', serviceId: 'sv4', status: 'confirmed', deposit: 0, paid: false },
  // Fri 06-26
  { id: 'a14', date: '2026-06-26', start: '10:30', durationMin: 120, petId: 'p3', staffId: 'st1', serviceId: 'sv5', status: 'confirmed', deposit: 0, paid: false },
  { id: 'a15', date: '2026-06-26', start: '16:00', durationMin: 60, petId: 'p8', staffId: 'st3', serviceId: 'sv6', status: 'requested', deposit: 0, paid: false },
  // Sat 06-27
  { id: 'a16', date: '2026-06-27', start: '12:00', durationMin: 90, petId: 'p5', staffId: 'st2', serviceId: 'sv1', status: 'confirmed', deposit: 0, paid: false },
  { id: 'a17', date: '2026-06-27', start: '15:00', durationMin: 60, petId: 'p12', staffId: 'st1', serviceId: 'sv2', status: 'confirmed', deposit: 0, paid: false },
]

/* ----- payments ----- */
export type PayMethod = '카드' | '현금' | '계좌이체'
export interface Payment {
  id: string
  apptId: string
  amount: number
  method: PayMethod
  discount: number
  unpaid: boolean
  at: string // ISO-ish 'YYYY-MM-DD HH:MM'
}
export const PAYMENTS: Payment[] = [
  { id: 'pm1', apptId: 'a05', amount: 55000, method: '카드', discount: 0, unpaid: false, at: '2026-06-24 11:32' },
  { id: 'pm2', apptId: 'a01', amount: 49500, method: '카드', discount: 5500, unpaid: false, at: '2026-06-22 12:05' },
  { id: 'pm3', apptId: 'a02', amount: 30000, method: '현금', discount: 0, unpaid: false, at: '2026-06-22 15:10' },
  { id: 'pm4', apptId: 'a03', amount: 75000, method: '카드', discount: 0, unpaid: false, at: '2026-06-23 13:10' },
  { id: 'pm5', apptId: 'a04', amount: 40000, method: '계좌이체', discount: 0, unpaid: false, at: '2026-06-23 16:35' },
  { id: 'pm6', apptId: 'a06', amount: 35000, method: '카드', discount: 0, unpaid: true, at: '2026-06-24 10:35' },
]

/* ----- boarding / daycare (hotel업종 매장만) ----- */
export interface Cage {
  id: string
  label: string
  size: 'S' | 'M' | 'L'
}
export const CAGES: Cage[] = [
  { id: 'cg1', label: 'A-1', size: 'S' },
  { id: 'cg2', label: 'A-2', size: 'S' },
  { id: 'cg3', label: 'A-3', size: 'M' },
  { id: 'cg4', label: 'A-4', size: 'M' },
  { id: 'cg5', label: 'B-1', size: 'L' },
  { id: 'cg6', label: 'B-2', size: 'L' },
  { id: 'cg7', label: 'B-3', size: 'M' },
  { id: 'cg8', label: 'B-4', size: 'S' },
]
export interface Boarding {
  id: string
  petId: string
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  cageId: string
  daycare: boolean
  memo: string
}
export const BOARDINGS: Boarding[] = [
  { id: 'bd1', petId: 'p9', checkIn: '2026-06-23', checkOut: '2026-06-26', cageId: 'cg5', daycare: false, memo: '사료 지참 · 산책 1일 2회' },
  { id: 'bd2', petId: 'p10', checkIn: '2026-06-24', checkOut: '2026-06-25', cageId: 'cg6', daycare: false, memo: '백호 — 분리 필요' },
  { id: 'bd3', petId: 'p6', checkIn: '2026-06-24', checkOut: '2026-06-24', cageId: 'cg1', daycare: true, memo: '데이케어 · 17시 픽업' },
  { id: 'bd4', petId: 'p2', checkIn: '2026-06-24', checkOut: '2026-06-24', cageId: 'cg2', daycare: true, memo: '데이케어' },
]

/* ----- messages (알림톡 로그) ----- */
export type MsgTemplate = '예약확정' | '리마인드' | '픽업알림' | '노쇼경고'
export type MsgStatus = '발송' | '대기' | '실패'
export interface Message {
  id: string
  customerId: string
  template: MsgTemplate
  at: string
  status: MsgStatus
}
export const MESSAGES: Message[] = [
  { id: 'mg1', customerId: 'c3', template: '예약확정', at: '2026-06-23 18:02', status: '발송' },
  { id: 'mg2', customerId: 'c4', template: '리마인드', at: '2026-06-24 09:00', status: '발송' },
  { id: 'mg3', customerId: 'c1', template: '픽업알림', at: '2026-06-24 11:35', status: '발송' },
  { id: 'mg4', customerId: 'c7', template: '노쇼경고', at: '2026-06-24 18:40', status: '대기' },
  { id: 'mg5', customerId: 'c5', template: '리마인드', at: '2026-06-24 09:00', status: '발송' },
  { id: 'mg6', customerId: 'c9', template: '예약확정', at: '2026-06-22 20:11', status: '실패' },
]

/* ----- waitlist (노쇼/취소 자리 채우기) ----- */
export interface WaitEntry {
  id: string
  petId: string
  desired: string // 희망 시간대
  priority: number // 1=highest
}
export const WAITLIST: WaitEntry[] = [
  { id: 'w1', petId: 'p8', desired: '평일 오후', priority: 1 },
  { id: 'w2', petId: 'p12', desired: '주말 오전', priority: 2 },
  { id: 'w3', petId: 'p9', desired: '아무때나', priority: 3 },
]

/* ----- lookups ----- */
export const serviceById = (id: string): Service | undefined => SERVICES.find((s) => s.id === id)
export const staffById = (id: string): StaffMember | undefined => STAFF.find((s) => s.id === id)
export const petById = (id: string): Pet | undefined => PETS.find((p) => p.id === id)
export const customerById = (id: string): Customer | undefined =>
  CUSTOMERS.find((c) => c.id === id)
export const customerOfPet = (petId: string): Customer | undefined => {
  const pet = petById(petId)
  return pet ? customerById(pet.customerId) : undefined
}
export const petsOfCustomer = (customerId: string): Pet[] =>
  PETS.filter((p) => p.customerId === customerId)
export const apptsOnDate = (date: string): Appt[] =>
  APPTS.filter((a) => a.date === date).sort((x, y) => x.start.localeCompare(y.start))

export function endTime(start: string, mins: number): string {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
