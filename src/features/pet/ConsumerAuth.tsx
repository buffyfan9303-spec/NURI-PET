import type * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PawPrint, LogIn } from 'lucide-react'
import { useConsumer } from '@/stores/consumer'
import './pet.css'

export function ConsumerAuth() {
  const navigate = useNavigate()
  const login = useConsumer((s) => s.login)
  const signUp = useConsumer((s) => s.signUp)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const res = mode === 'login' ? await login(email, pw) : await signUp(email, pw, name || '보호자', phone)
    setBusy(false)
    if (res.ok) navigate('/pet')
    else setErr(res.error ?? '실패했습니다.')
  }

  const demo = async () => {
    setErr('')
    setBusy(true)
    const res = await login('guardian@nuri.pet', 'nuri2026')
    setBusy(false)
    if (res.ok) navigate('/pet')
    else setErr(res.error ?? '실패했습니다.')
  }

  return (
    <div className="pet-app">
      <div className="pet-screen">
        <div className="pet-auth">
          <div className="pet-auth-logo">
            <PawPrint size={26} />
          </div>
          <h1 className="pet-auth-title">NURI PET</h1>
          <p className="pet-auth-sub">우리 아이 건강을 기록하고, 동네 펫 서비스를 예약하세요.</p>

          <div className="pet-auth-tabs">
            <button type="button" className={mode === 'login' ? 'on' : undefined} onClick={() => setMode('login')}>
              로그인
            </button>
            <button type="button" className={mode === 'signup' ? 'on' : undefined} onClick={() => setMode('signup')}>
              회원가입
            </button>
          </div>

          <form className="pet-auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <input className="pet-auth-input" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input
              className="pet-auth-input"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              className="pet-auth-input"
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
            />
            {mode === 'signup' && (
              <input
                className="pet-auth-input"
                placeholder="연락처 (선택)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
              />
            )}
            {err && <div className="pet-auth-err">{err}</div>}
            <button type="submit" className="pet-save" disabled={busy}>
              {busy ? '처리 중…' : mode === 'login' ? '로그인' : '가입하고 시작'}
            </button>
          </form>

          <button type="button" className="pet-auth-demo" onClick={demo} disabled={busy}>
            <LogIn size={15} /> 데모 보호자로 둘러보기
          </button>
          <p className="pet-legal">건강 기록은 참고용이에요 · 진단·처방을 대신하지 않아요</p>
        </div>
      </div>
    </div>
  )
}
