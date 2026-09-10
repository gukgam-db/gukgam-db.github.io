import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORY_ICON, CATEGORY_LABEL, REGIONS, SPOT_BY_ID } from '../data/spots'
import { useApp } from '../lib/state'
import { distanceKm, formatDistance, formatKrw, walkMinutes } from '../lib/geo'
import { closedDaysLabel, openStatus } from '../lib/hours'
import { LEVEL_META, bestTime, levelFromRate, ymdSeoul } from '../lib/congestion'
import { nowInSeoul } from '../lib/hours'
import { addStamp, hasStamp, removeStamp } from '../lib/stamps'
import CongestionBadge from '../components/CongestionBadge'
import Timeline from '../components/Timeline'
import SubwayCard from '../components/SubwayCard'

export default function SpotPage() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const spot = SPOT_BY_ID[id]
  const { me, congestion } = useApp()
  const [stamped, setStamped] = useState(() => hasStamp(id))
  const [copied, setCopied] = useState(false)
  const [showKo, setShowKo] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!spot) {
    return (
      <div className="page">
        <div className="empty">Spot not found. <Link to="/">Back to map</Link></div>
      </div>
    )
  }

  const c = congestion[spot.id]
  const st = openStatus(spot)
  const best = c ? bestTime(spot, c) : null
  const dist = me ? distanceKm(me.lat, me.lng, spot.lat, spot.lng) : null
  const regionLabel = REGIONS.find((r) => r.id === spot.region)?.label ?? spot.region

  const copyKo = async () => {
    try {
      await navigator.clipboard.writeText(spot.nameKo)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 미지원 */
    }
  }

  const toggleStamp = () => {
    if (stamped) removeStamp(spot.id)
    else addStamp(spot.id)
    setStamped(!stamped)
  }

  const gmaps = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(spot.nameKo)}`
  const kakao = `https://map.kakao.com/link/map/${encodeURIComponent(spot.nameKo)},${spot.lat},${spot.lng}`

  return (
    <div className="page">
      {showKo && (
        <div className="show-ko" onClick={() => setShowKo(false)} role="dialog" aria-label="Show to driver">
          <div className="show-ko-label">Please take me here</div>
          <div className="show-ko-name">{spot.nameKo}</div>
          <div className="show-ko-sub">{spot.name}</div>
          <div className="show-ko-phrase">여기로 가 주세요</div>
          <div className="show-ko-hint">Tap anywhere to close</div>
        </div>
      )}
      <div className="detail-head">
        <button className="back" onClick={() => nav(-1)} aria-label="Back">←</button>
        <div>
          <h2>{CATEGORY_ICON[spot.category]} {spot.name}</h2>
          <div className="ko-row">
            <span>{spot.nameKo}</span>
            <button className="copy-btn" onClick={copyKo}>{copied ? 'Copied ✓' : 'Copy'}</button>
            <button className="copy-btn" onClick={() => setShowKo(true)}>🚕 Show to driver</button>
            <span>· {CATEGORY_LABEL[spot.category]} · {regionLabel}</span>
          </div>
        </div>
      </div>

      <div className="now-box">
        <div className="card">
          <div className="label">Right now</div>
          <div className="big"><CongestionBadge c={c} size="lg" /></div>
          <div className="small">
            {!c ? 'loading…' : c.max === 0 ? 'Almost nobody around' : `${c.min.toLocaleString()}–${c.max.toLocaleString()} people around`}
          </div>
        </div>
        <div className="card">
          <div className="label">Best time (next 12 h)</div>
          <div className="big" style={{ color: best?.slot ? LEVEL_META[best.slot.level].color : 'var(--primary)' }}>
            {best?.slot
              ? new Date(best.slot.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'Asia/Seoul' })
              : c?.level === 'relaxed' ? 'Now' : '—'}
          </div>
          <div className="small">{best?.reason ?? ''}</div>
        </div>
      </div>

      {c && (
        <div className="card">
          <div className="label" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Crowd forecast · next 12 hours (KST)
          </div>
          <Timeline spot={spot} c={c} />
        </div>
      )}

      {c?.daily && c.daily.length > 0 && (
        <div className="card">
          <div className="label" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Next 14 days · busiest day = 100
          </div>
          <div className="daily-strip">
            {c.daily.map((d) => {
              const lv = levelFromRate(d.rate)
              const dt = new Date(`${d.date.slice(0, 4)}-${d.date.slice(4, 6)}-${d.date.slice(6, 8)}T00:00:00+09:00`)
              const isToday = d.date === ymdSeoul(nowInSeoul())
              return (
                <div key={d.date} className={'day' + (isToday ? ' today' : '')} title={`${d.date} · ${d.rate}`}>
                  <div className="dow">{dt.toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'Asia/Seoul' })}</div>
                  <div className="dot" style={{ background: LEVEL_META[lv].color, height: `${8 + d.rate * 0.28}px` }} />
                  <div className="dd">{dt.getDate()}</div>
                </div>
              )
            })}
          </div>
          <div className="source-note">Korea Tourism Organization forecast from mobile-carrier data. Pick a low bar.</div>
        </div>
      )}

      <div className="card">
        <div className="info-grid">
          <div>
            <div className="k">Admission</div>
            <div className="v">{spot.fee.adult === 0 ? <span className="free-tag">Free</span> : formatKrw(spot.fee.adult)}</div>
            {spot.fee.note && <div className="n">{spot.fee.note}</div>}
          </div>
          <div>
            <div className="k">Status</div>
            <div className={'v ' + (st.state === 'open' || st.state === 'always' ? 'status-open' : 'status-closed')}>
              {st.state === 'open' && `Open · closes ${st.closesAt}`}
              {st.state === 'always' && 'Open area'}
              {st.state === 'closed-now' && `Closed now · opens ${st.opensAt}`}
              {st.state === 'closed-today' && st.reason}
            </div>
          </div>
          <div>
            <div className="k">Hours</div>
            <div className="v">{spot.hours ? `${spot.hours.open} – ${spot.hours.close}` : 'Always open'}</div>
            {spot.hoursNote && <div className="n">{spot.hoursNote}</div>}
          </div>
          <div>
            <div className="k">Closed</div>
            <div className="v">{closedDaysLabel(spot)}</div>
          </div>
          <div>
            <div className="k">Cards</div>
            <div className="v">{spot.cardOk ? '💳 Cards OK' : '💵 Bring cash'}</div>
          </div>
          <div>
            <div className="k">English</div>
            <div className="v">{spot.english === 'good' ? 'Signs & staff' : spot.english === 'some' ? 'Signs, some staff' : 'Little — use the phrases'}</div>
          </div>
          {dist !== null && (
            <div>
              <div className="k">From you</div>
              <div className="v">{formatDistance(dist)}{dist < 3 ? ` · ${walkMinutes(dist)} min walk` : ''}</div>
            </div>
          )}
          <div>
            <div className="k">Fee checked</div>
            <div className="v">{spot.feeCheckedAt}</div>
          </div>
        </div>
      </div>

      <SubwayCard spot={spot} />

      <div className="tip"><b>Local tip</b> — {spot.tip}</div>

      <div className="btn-row">
        <button className={'btn ' + (stamped ? 'done' : 'primary')} onClick={toggleStamp}>
          {stamped ? '✓ Stamped — tap to undo' : '🎫 I was here — stamp it'}
        </button>
      </div>
      <div className="btn-row">
        <a className="btn" href={gmaps} target="_blank" rel="noreferrer">Google Maps</a>
        <a className="btn" href={naver} target="_blank" rel="noreferrer">Naver Map</a>
        <a className="btn" href={kakao} target="_blank" rel="noreferrer">Kakao Map</a>
      </div>
      <p className="disclaimer">
        Google Maps shows transit well in Korea but not walking routes; Naver or Kakao Map gives walking directions.
      </p>
    </div>
  )
}
