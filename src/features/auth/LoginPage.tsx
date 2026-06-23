import type * as React from 'react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, ShieldCheck } from 'lucide-react'
import { useSession, DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/stores/session'
import './auth.css'

interface LocState {
  from?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useSession((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as LocState | null)?.from ?? '/app'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = login(email, password)
    if (res.ok) {
      navigate(from, { replace: true })
    } else {
      setError(res.error ?? '로그인에 실패했습니다.')
    }
  }

  const quick = (em: string) => {
    setEmail(em)
    setPassword(DEMO_PASSWORD)
    setError('')
    const res = login(em, DEMO_PASSWORD)
    if (res.ok) navigate(from, { replace: true })
  }

  return (
    <div className="auth">
      <div className="auth-glow" aria-hidden />
      <form className="auth-card np-an" onSubmit={submit}>
        <div className="auth-brand">
          <div className="auth-mark">N</div>
          <div className="auth-brand-txt">
            <strong>NURI PET</strong>
            <span>운영자 OS</span>
          </div>
        </div>

        <h1 className="auth-title">로그인</h1>
        <p className="auth-sub">매장 운영을 시작하려면 로그인하세요.</p>

        <label className="auth-field">
          <span>이메일</span>
          <input
            className="np-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@dogwell.kr"
            autoComplete="username"
          />
        </label>
        <label className="auth-field">
          <span>비밀번호</span>
          <input
            className="np-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="np-btn np-btn-primary auth-submit">
          <LogIn size={16} /> 로그인
        </button>

        <div className="auth-demo">
          <div className="auth-demo-label">
            <ShieldCheck size={13} /> 데모 계정 (비밀번호 {DEMO_PASSWORD})
          </div>
          <div className="auth-demo-chips">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" className="np-chip auth-chip" onClick={() => quick(a.email)}>
                {a.name} · {a.role === 'owner' ? '대표' : '직원'}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
