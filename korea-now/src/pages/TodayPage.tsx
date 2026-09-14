import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FxRate } from '../types'
import { MANNER_TIPS, PHRASES, pickForToday } from '../data/phrases'
import { SPOTS } from '../data/spots'
import { fetchFx } from '../lib/api'
import { nowInSeoul, openStatus } from '../lib/hours'
import { useApp } from '../lib/state'
import SpotCard from '../components/SpotCard'

export default function TodayPage() {
  const phrase = pickForToday(PHRASES)
  const manner = pickForToday(MANNER_TIPS, 3)
  const [fx, setFx] = useState<FxRate | null>(null)
  const [krw, setKrw] = useState('10000')
  const { congestion, region } = useApp()

  useEffect(() => {
    fetchFx().then(setFx)
  }, [])

  const now = nowInSeoul()
  const isLastWed = now.getDay() === 3 && now.getDate() + 7 > new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  // 오늘 무료로 갈 수 있고 지금 열린 곳 (선택 지역 우선)
  const freeOpen = useMemo(
    () =>
      SPOTS.filter((s) => s.fee.adult === 0 && ['open', 'always'].includes(openStatus(s).state) && (region === 'all' || s.region === region))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5),
    [region],
  )

  const n = Number(krw.replace(/[^\d]/g, '')) || 0
  const fmt = (v: number, digits = 2) => v.toLocaleString('en-US', { maximumFractionDigits: digits })

  return (
    <div className="page">
      <div className="section-title" style={{ marginTop: 4 }}>
        Today in Korea · {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>

      <div className="card phrase">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Korean phrase of the day</div>
        <div className="ko">{phrase.ko}</div>
        <div className="roman">{phrase.roman}</div>
        <div className="en">“{phrase.en}”</div>
        <div className="when">{phrase.when}</div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Local manners</div>
        <div style={{ fontWeight: 700, marginTop: 4 }}>{manner.title}</div>
        <div style={{ fontSize: 13.5, marginTop: 2 }}>{manner.body}</div>
      </div>

      {isLastWed && (
        <div className="tip"><b>Culture Day</b> — Last Wednesday of the month: Seoul palaces and many museums are free today.</div>
      )}

      <div className="card">
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
          Won converter {fx && fx.source === 'demo' ? '· demo rates' : fx ? `· ${fx.date}` : ''}
        </div>
        <div className="fx-row">
          <span style={{ fontWeight: 700 }}>₩</span>
          <input inputMode="numeric" value={krw} onChange={(e) => setKrw(e.target.value)} aria-label="Korean won amount" />
        </div>
        {fx && (
          <div className="fx-grid">
            <div>USD <b>${fmt(n / fx.usdKrw)}</b></div>
            <div>JPY <b>¥{fmt((n / fx.jpyKrw) * 100, 0)}</b></div>
            <div>CNY <b>¥{fmt(n / fx.cnyKrw)}</b></div>
            <div>EUR <b>€{fmt(n / fx.eurKrw)}</b></div>
          </div>
        )}
        <div className="source-note">
          {fx?.source === 'koreaexim' ? 'Korea Eximbank daily rate (bank buying/selling midpoint).' : 'Approximate rates — connect the server for daily official rates.'}
        </div>
      </div>

      <div className="section-title">Free & open right now</div>
      {freeOpen.length === 0 && <div className="empty">Nothing free is open at this hour — <Link to="/">see all spots</Link>.</div>}
      {freeOpen.map((s) => (
        <SpotCard key={s.id} spot={s} congestion={congestion[s.id]} />
      ))}
    </div>
  )
}
