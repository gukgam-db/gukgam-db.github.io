// 주변 검색 — 관광공사 TourAPI(영문) 데이터. 서버 미연결 시 큐레이션 스팟으로 대체
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SPOTS } from '../data/spots'
import { NEARBY_TYPES, fetchNearby, isLive, type NearbyItem } from '../lib/api'
import { distanceKm, formatDistance, walkMinutes } from '../lib/geo'
import { useApp } from '../lib/state'
import SpotCard from '../components/SpotCard'

const TYPE_ICON: Record<string, string> = { '76': '📍', '78': '🏛️', '79': '🛍️', '82': '🍜', '85': '🎉', '75': '🚴', '80': '🏨' }

export default function NearbyPage() {
  const { me, locate, locating, congestion } = useApp()
  const [type, setType] = useState('')
  const [radius, setRadius] = useState(1000)
  const [items, setItems] = useState<NearbyItem[] | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    if (!me || !isLive) return
    let alive = true
    setState('loading')
    fetchNearby(me.lat, me.lng, type, radius)
      .then((r) => { if (alive) { setItems(r); setState('idle') } })
      .catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [me, type, radius])

  // 서버가 없을 때: 큐레이션 스팟을 거리순으로
  const fallback = useMemo(() => {
    if (!me) return []
    return SPOTS.map((s) => ({ s, d: distanceKm(me.lat, me.lng, s.lat, s.lng) }))
      .filter((x) => x.d <= 5)
      .sort((a, b) => a.d - b.d)
      .slice(0, 20)
  }, [me])

  return (
    <div className="page">
      <div className="section-title" style={{ marginTop: 4 }}>Around me</div>

      {!me && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>📍</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>Where are you?</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 10px' }}>Allow location to see what's within walking distance.</div>
          <button className="btn primary" onClick={locate} disabled={locating}>{locating ? 'Locating…' : 'Use my location'}</button>
        </div>
      )}

      {me && (
        <>
          <div className="chips" style={{ paddingTop: 0 }}>
            {NEARBY_TYPES.map((t) => (
              <button key={t.id} className={'chip' + (type === t.id ? ' on' : '')} onClick={() => setType(t.id)}>{t.icon} {t.label}</button>
            ))}
          </div>
          <div className="chips" style={{ paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', marginRight: 2 }}>Within</span>
            {[500, 1000, 2000, 5000].map((r) => (
              <button key={r} className={'chip' + (radius === r ? ' on' : '')} onClick={() => setRadius(r)}>{r < 1000 ? `${r} m` : `${r / 1000} km`}</button>
            ))}
          </div>

          {isLive ? (
            <>
              {state === 'loading' && <div className="empty">Searching nearby…</div>}
              {state === 'error' && <div className="empty">Couldn't reach the search server. Showing our own picks below.</div>}
              {state === 'idle' && items && items.length === 0 && <div className="empty">Nothing within {radius < 1000 ? `${radius} m` : `${radius / 1000} km`}. Widen the radius.</div>}
              {state === 'idle' && items && items.map((it) => <NearbyCard key={it.contentId} it={it} />)}
              {items && items.length > 0 && (
                <p className="disclaimer">Data: Korea Tourism Organization (TourAPI). Names and addresses in English where available.</p>
              )}
            </>
          ) : (
            <p className="disclaimer">Live nearby search needs the server connection. Showing our curated spots within 5 km instead.</p>
          )}

          {(!isLive || state === 'error') && (
            <>
              <div className="section-title">Our picks near you</div>
              {fallback.length === 0 && <div className="empty">No curated spots within 5 km. <Link to="/">See all regions</Link>.</div>}
              {fallback.map(({ s, d }) => <SpotCard key={s.id} spot={s} congestion={congestion[s.id]} distanceKm={d} />)}
            </>
          )}
        </>
      )}
    </div>
  )
}

function NearbyCard({ it }: { it: NearbyItem }) {
  const km = it.dist / 1000
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${it.lat},${it.lng}`
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(it.title)}`
  return (
    <div className="card nearby-card">
      {it.image ? <img src={it.image} alt="" loading="lazy" /> : <div className="nearby-noimg">{TYPE_ICON[it.contentTypeId] ?? '📍'}</div>}
      <div className="nearby-body">
        <div className="name">{TYPE_ICON[it.contentTypeId] ?? '📍'} {it.title}</div>
        <div className="meta">{it.addr}</div>
        <div className="meta"><b>{formatDistance(km)}</b>{km < 3 ? ` · ${walkMinutes(km)} min walk` : ''}{it.tel ? ` · ${it.tel}` : ''}</div>
        <div className="nearby-links">
          <a href={gmaps} target="_blank" rel="noreferrer">Google Maps</a>
          <a href={naver} target="_blank" rel="noreferrer">Naver Map</a>
        </div>
      </div>
    </div>
  )
}
