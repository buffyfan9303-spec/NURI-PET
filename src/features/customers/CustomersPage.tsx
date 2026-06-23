import type * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Phone,
  BellRing,
  BellOff,
  PawPrint,
  Syringe,
  Scissors,
  CalendarClock,
  Dog,
  Cat,
  Check,
  X,
} from 'lucide-react'
import {
  useData,
  STATUS_META,
  petsOfCustomer,
  serviceById,
  staffById,
  endTime,
  type Customer,
  type Pet,
  type Species,
} from '@/stores/data'
import { fmtMoney } from '@/lib/date'
import '../feature.css'
import './customers.css'

function speciesIcon(species: Species) {
  return species === '고양이' ? Cat : Dog
}

function noShowBadge(score: number): { tone: string; label: string } | null {
  if (score >= 3) return { tone: 't-alert', label: `노쇼위험 ${score}` }
  if (score >= 1) return { tone: 't-warn', label: `주의 ${score}` }
  return null
}

export function CustomersPage() {
  // --- reactive store subscriptions (re-render on any mutation) ---
  const customers = useData((s) => s.customers)
  const pets = useData((s) => s.pets)
  const appts = useData((s) => s.appts)
  const addCustomer = useData((s) => s.addCustomer)
  const updateCustomer = useData((s) => s.updateCustomer)
  const addPet = useData((s) => s.addPet)

  const [query, setQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0].id)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)

  // --- inline form state ---
  const [custForm, setCustForm] = useState<{ name: string; phone: string; notifyConsent: boolean } | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; phone: string; notifyConsent: boolean } | null>(null)
  const [petForm, setPetForm] = useState<{
    name: string
    species: Species
    breed: string
    ageY: string
    weightKg: string
  } | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = useMemo<Customer[]>(() => {
    if (!q) return customers
    return customers.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      if (c.phone.replace(/-/g, '').includes(q.replace(/-/g, ''))) return true
      return pets.some((p) => p.customerId === c.id && p.name.toLowerCase().includes(q))
    })
  }, [q, customers, pets])

  const selected = customers.find((c) => c.id === selectedCustomerId)
  const ownerPets = selected ? petsOfCustomer(selected.id) : []
  const activePet: Pet | undefined =
    ownerPets.find((p) => p.id === selectedPetId) ?? ownerPets[0]

  const petAppts = useMemo(() => {
    if (!activePet) return []
    return appts
      .filter((a) => a.petId === activePet.id)
      .sort((x, y) => (y.date + y.start).localeCompare(x.date + x.start))
  }, [activePet, appts])

  function selectCustomer(id: string) {
    setSelectedCustomerId(id)
    setSelectedPetId(null)
    setEditForm(null)
    setPetForm(null)
  }

  // --- actions ---
  function submitNewCustomer() {
    if (!custForm) return
    const name = custForm.name.trim()
    const phone = custForm.phone.trim()
    if (!name || !phone) return
    const id = addCustomer({ name, phone, notifyConsent: custForm.notifyConsent })
    setCustForm(null)
    selectCustomer(id)
  }

  function submitEditCustomer() {
    if (!editForm || !selected) return
    const name = editForm.name.trim()
    const phone = editForm.phone.trim()
    if (!name || !phone) return
    updateCustomer(selected.id, { name, phone, notifyConsent: editForm.notifyConsent })
    setEditForm(null)
  }

  function submitNewPet() {
    if (!petForm || !selected) return
    const name = petForm.name.trim()
    if (!name) return
    addPet({
      customerId: selected.id,
      name,
      species: petForm.species,
      breed: petForm.breed.trim() || '믹스',
      ageY: Number(petForm.ageY) || 0,
      weightKg: Number(petForm.weightKg) || 0,
    })
    setPetForm(null)
  }

  return (
    <div>
      <div className="feat-head">
        <div className="feat-head-l">
          <div className="feat-title">고객 · 펫</div>
          <div className="feat-sub">
            보호자 {customers.length}명 · 반려동물 {pets.length}마리 · 예방접종/체중은 기록·관리용
            표시입니다
          </div>
        </div>
        <div className="feat-actions">
          <button
            type="button"
            className="np-btn np-btn-primary"
            onClick={() =>
              setCustForm((f) => (f ? null : { name: '', phone: '', notifyConsent: true }))
            }
          >
            <Plus size={16} /> 고객 추가
          </button>
        </div>
      </div>

      <div className="cust-layout">
        {/* ---------- Master: list ---------- */}
        <section className="np-card cust-master np-an" style={{ '--d': '0ms' } as React.CSSProperties}>
          <div className="cust-search">
            <Search size={15} className="cust-search-ic" />
            <input
              className="np-input cust-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 · 연락처 · 펫 이름으로 검색"
              aria-label="고객 검색"
            />
          </div>

          {custForm && (
            <form
              className="cust-form"
              onSubmit={(e) => {
                e.preventDefault()
                submitNewCustomer()
              }}
            >
              <div className="cust-form-title">새 고객</div>
              <input
                className="np-input"
                value={custForm.name}
                onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                placeholder="이름"
                aria-label="고객 이름"
                autoFocus
              />
              <input
                className="np-input"
                value={custForm.phone}
                onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                placeholder="연락처 (010-0000-0000)"
                aria-label="고객 연락처"
                inputMode="tel"
              />
              <label className="cust-form-check">
                <input
                  type="checkbox"
                  checked={custForm.notifyConsent}
                  onChange={(e) => setCustForm({ ...custForm, notifyConsent: e.target.checked })}
                />
                알림 수신 동의
              </label>
              <div className="cust-form-actions">
                <button type="button" className="np-btn cust-btn-sm" onClick={() => setCustForm(null)}>
                  <X size={14} /> 취소
                </button>
                <button type="submit" className="np-btn np-btn-primary cust-btn-sm">
                  <Check size={14} /> 추가
                </button>
              </div>
            </form>
          )}

          <div className="cust-list" role="listbox" aria-label="고객 목록">
            {filtered.length === 0 && (
              <div className="cust-empty">검색 결과가 없습니다.</div>
            )}
            {filtered.map((c) => {
              const cPets = petsOfCustomer(c.id)
              const badge = noShowBadge(c.noShowScore)
              const active = c.id === selectedCustomerId
              return (
                <button
                  type="button"
                  key={c.id}
                  className={`cust-row${active ? ' is-active' : ''}`}
                  onClick={() => selectCustomer(c.id)}
                  role="option"
                  aria-selected={active}
                >
                  <span className="cust-row-avatar" aria-hidden="true">
                    {c.name.slice(0, 1)}
                  </span>
                  <span className="cust-row-main">
                    <span className="cust-row-name">{c.name}</span>
                    <span className="cust-row-phone">{c.phone}</span>
                  </span>
                  <span className="cust-row-right">
                    {badge && <span className={`np-badge ${badge.tone}`}>{badge.label}</span>}
                    <span className="cust-row-pets">
                      <PawPrint size={12} />
                      {cPets.length}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------- Detail ---------- */}
        <section
          className="np-card cust-detail np-an"
          style={{ '--d': '80ms' } as React.CSSProperties}
        >
          {selected ? (
            <>
              {/* owner header */}
              {editForm ? (
                <form
                  className="cust-form cust-form-owner"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitEditCustomer()
                  }}
                >
                  <div className="cust-form-title">고객 정보 수정</div>
                  <div className="cust-form-row">
                    <input
                      className="np-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="이름"
                      aria-label="고객 이름 수정"
                      autoFocus
                    />
                    <input
                      className="np-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="연락처"
                      aria-label="고객 연락처 수정"
                      inputMode="tel"
                    />
                  </div>
                  <label className="cust-form-check">
                    <input
                      type="checkbox"
                      checked={editForm.notifyConsent}
                      onChange={(e) => setEditForm({ ...editForm, notifyConsent: e.target.checked })}
                    />
                    알림 수신 동의
                  </label>
                  <div className="cust-form-actions">
                    <button type="button" className="np-btn cust-btn-sm" onClick={() => setEditForm(null)}>
                      <X size={14} /> 취소
                    </button>
                    <button type="submit" className="np-btn np-btn-primary cust-btn-sm">
                      <Check size={14} /> 저장
                    </button>
                  </div>
                </form>
              ) : (
                <div className="cust-owner-head">
                  <div className="cust-owner-id">
                    <span className="cust-owner-avatar" aria-hidden="true">
                      {selected.name.slice(0, 1)}
                    </span>
                    <div>
                      <div className="cust-owner-name">{selected.name}</div>
                      <div className="cust-owner-meta">
                        <span className="cust-owner-phone">
                          <Phone size={13} /> {selected.phone}
                        </span>
                        {selected.notifyConsent ? (
                          <span className="np-badge t-good">
                            <BellRing size={11} /> 알림 동의
                          </span>
                        ) : (
                          <span className="np-badge t-muted">
                            <BellOff size={11} /> 알림 미동의
                          </span>
                        )}
                        {(() => {
                          const b = noShowBadge(selected.noShowScore)
                          return b ? <span className={`np-badge ${b.tone}`}>{b.label}</span> : null
                        })()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="np-btn"
                    onClick={() => {
                      setPetForm(null)
                      setEditForm({
                        name: selected.name,
                        phone: selected.phone,
                        notifyConsent: selected.notifyConsent,
                      })
                    }}
                  >
                    <Pencil size={15} /> 수정
                  </button>
                </div>
              )}

              {selected.memo && (
                <div className="cust-memo">
                  <span className="cust-memo-label">메모</span>
                  {selected.memo}
                </div>
              )}

              {/* pets */}
              <div className="cust-section-head">
                <span className="cust-section-title">반려동물 {ownerPets.length}</span>
                <button
                  type="button"
                  className="np-btn cust-btn-sm"
                  onClick={() =>
                    setPetForm((f) =>
                      f ? null : { name: '', species: '강아지', breed: '', ageY: '', weightKg: '' },
                    )
                  }
                >
                  <Plus size={14} /> 펫 추가
                </button>
              </div>

              {petForm && (
                <form
                  className="cust-form cust-form-pet"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitNewPet()
                  }}
                >
                  <div className="cust-form-row">
                    <input
                      className="np-input"
                      value={petForm.name}
                      onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                      placeholder="이름"
                      aria-label="펫 이름"
                      autoFocus
                    />
                    <select
                      className="np-input"
                      value={petForm.species}
                      onChange={(e) => setPetForm({ ...petForm, species: e.target.value as Species })}
                      aria-label="종"
                    >
                      <option value="강아지">강아지</option>
                      <option value="고양이">고양이</option>
                    </select>
                  </div>
                  <div className="cust-form-row">
                    <input
                      className="np-input"
                      value={petForm.breed}
                      onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      placeholder="품종"
                      aria-label="품종"
                    />
                    <input
                      className="np-input"
                      value={petForm.ageY}
                      onChange={(e) => setPetForm({ ...petForm, ageY: e.target.value })}
                      placeholder="나이(살)"
                      aria-label="나이"
                      inputMode="numeric"
                    />
                    <input
                      className="np-input"
                      value={petForm.weightKg}
                      onChange={(e) => setPetForm({ ...petForm, weightKg: e.target.value })}
                      placeholder="체중(kg)"
                      aria-label="체중"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="cust-form-actions">
                    <button type="button" className="np-btn cust-btn-sm" onClick={() => setPetForm(null)}>
                      <X size={14} /> 취소
                    </button>
                    <button type="submit" className="np-btn np-btn-primary cust-btn-sm">
                      <Check size={14} /> 추가
                    </button>
                  </div>
                </form>
              )}

              <div className="cust-pets">
                {ownerPets.map((p) => {
                  const Ic = speciesIcon(p.species)
                  const active = activePet?.id === p.id
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className={`cust-pet-card${active ? ' is-active' : ''}`}
                      onClick={() => setSelectedPetId(p.id)}
                      aria-pressed={active}
                    >
                      <span className="cust-pet-ic" aria-hidden="true">
                        <Ic size={17} />
                      </span>
                      <span className="cust-pet-info">
                        <span className="cust-pet-name">{p.name}</span>
                        <span className="cust-pet-sub">
                          {p.breed} · {p.ageY}살 · {p.weightKg}kg
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* selected pet detail */}
              {activePet && (
                <div className="cust-petdetail">
                  <div className="cust-petdetail-head">
                    <div className="cust-petdetail-title">
                      {activePet.name}
                      <span className="cust-petdetail-breed">
                        {activePet.species} · {activePet.breed}
                      </span>
                    </div>
                    <span className="np-badge t-accent">{activePet.temperament}</span>
                  </div>

                  <div className="cust-facts">
                    <div className="cust-fact">
                      <span className="cust-fact-k">나이</span>
                      <span className="cust-fact-v">{activePet.ageY}살</span>
                    </div>
                    <div className="cust-fact">
                      <span className="cust-fact-k">체중</span>
                      <span className="cust-fact-v">{activePet.weightKg}kg</span>
                    </div>
                    <div className="cust-fact">
                      <span className="cust-fact-k">알러지</span>
                      <span className="cust-fact-v">
                        {activePet.allergies.length > 0 ? (
                          <span className="cust-allergy-tags">
                            {activePet.allergies.map((a) => (
                              <span key={a} className="np-badge t-warn">
                                {a}
                              </span>
                            ))}
                          </span>
                        ) : (
                          '없음'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="cust-blocks">
                    {/* vaccinations */}
                    <div className="cust-block">
                      <div className="cust-block-head">
                        <Syringe size={14} />
                        예방접종 기록
                      </div>
                      {activePet.vaccinations.length > 0 ? (
                        <ul className="cust-vacc">
                          {activePet.vaccinations.map((v, i) => (
                            <li key={`${v.name}-${i}`}>
                              <span className="cust-vacc-name">{v.name}</span>
                              <span className="cust-vacc-date">{v.date}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="cust-muted">기록 없음</div>
                      )}
                    </div>

                    {/* grooming note */}
                    <div className="cust-block">
                      <div className="cust-block-head">
                        <Scissors size={14} />
                        미용 노트
                      </div>
                      <div className="cust-note">
                        {activePet.groomingNote || <span className="cust-muted">기록 없음</span>}
                      </div>
                    </div>
                  </div>

                  {/* appointment history */}
                  <div className="cust-block cust-block-full">
                    <div className="cust-block-head">
                      <CalendarClock size={14} />
                      예약 이력 {petAppts.length}건
                    </div>
                    {petAppts.length > 0 ? (
                      <div className="cust-hist">
                        {petAppts.map((a) => {
                          const sv = serviceById(a.serviceId)
                          const stf = staffById(a.staffId)
                          const st = STATUS_META[a.status]
                          return (
                            <div className="cust-hist-row" key={a.id}>
                              <div className="cust-hist-date">
                                {a.date.slice(5).replace('-', '/')}
                                <small>
                                  {a.start}~{endTime(a.start, a.durationMin)}
                                </small>
                              </div>
                              <div className="cust-hist-main">
                                <span className="cust-hist-service">{sv?.name ?? '서비스'}</span>
                                <span className="cust-hist-staff">{stf?.name}</span>
                              </div>
                              <div className="cust-hist-right">
                                <span className={`np-badge t-${st.tone}`}>{st.label}</span>
                                {sv && <span className="cust-hist-price">{fmtMoney(sv.price)}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="cust-muted">예약 이력이 없습니다.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="cust-muted cust-detail-empty">고객을 선택하세요.</div>
          )}
        </section>
      </div>
    </div>
  )
}
