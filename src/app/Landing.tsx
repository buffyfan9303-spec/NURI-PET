import type * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Monitor, Smartphone } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import './landing.css'

export function Landing() {
  return (
    <div className="lp">
      <div className="lp-glow" aria-hidden />
      <header className="lp-top">
        <div className="lp-brand">
          <div className="lp-mark">N</div>
          <span className="lp-brandname">NURI PET</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="lp-main">
        <span className="np-chip lp-kicker">펫 서비스 통합 운영 · 벤치마크 MoeGo</span>
        <h1 className="lp-title">
          예약·고객·결제·알림톡을
          <br />
          하나로 묶는 펫 비즈니스 OS
        </h1>
        <p className="lp-sub">
          미용·호텔·데이케어 사업자를 위한 프런트데스크 운영 도구와, 보호자를 위한 컨디션 기록 앱.
          하나의 디자인 언어, 두 개의 경험.
        </p>

        <div className="lp-cards">
          <Link to="/app" className="lp-card np-an" style={{ '--d': '60ms' } as React.CSSProperties}>
            <div className="lp-card-ic">
              <Monitor size={22} />
            </div>
            <div className="lp-card-tag">PC · 프런트데스크</div>
            <h2 className="lp-card-title">운영자 OS</h2>
            <p className="lp-card-desc">
              예약 캘린더, 고객·펫 관리, POS 결제·장부, 직원·커미션, 알림톡 자동화. 키보드 1순위 데스크톱
              운영.
            </p>
            <span className="lp-card-go">
              들어가기 <ArrowRight size={16} />
            </span>
          </Link>

          <Link to="/pet" className="lp-card np-an" style={{ '--d': '140ms' } as React.CSSProperties}>
            <div className="lp-card-ic lp-card-ic--alt">
              <Smartphone size={22} />
            </div>
            <div className="lp-card-tag">모바일 · 보호자</div>
            <h2 className="lp-card-title">보호자 앱</h2>
            <p className="lp-card-desc">
              우리 아이 컨디션을 탭 한 번으로 기록하고 흐름을 한눈에. 식욕·음수·활력·체중 추이와 케어
              추천.
            </p>
            <span className="lp-card-go">
              열어보기 <ArrowRight size={16} />
            </span>
          </Link>
        </div>

        <p className="lp-legal">
          NURI PET는 운영·기록 도구입니다 · 진단·처방을 대신하지 않습니다 · KST · 한국어
        </p>
      </main>
    </div>
  )
}
