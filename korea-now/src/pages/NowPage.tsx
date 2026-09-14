import { useMemo, useState } from 'react'
import type { Category, Spot } from '../types'
import { CATEGORY_ICON, CATEGORY_LABEL, REGIONS, SPOTS } from '../data/spots'
import { useApp } from '../lib/state'
import { distanceKm } from '../lib/geo'
import { openStatus } from '../lib/hours'
import { LEVEL_ORDER } from '../lib/congestion'
import MapView from '../components/MapView'
import SpotCard from '../components/SpotCard'

type Sort = 'distance' | 'quiet' | 'popular'

export default function NowPage() {
  const { me, locate, locating, region, setRegion, congestion, live, refreshedAt } = useApp()
  const [freeOnly, setFreeOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [cat, setCat] = useState<Category | null>(null)
  const [sort, setSort] = useState<Sort>('distance')

  const regionMeta = REGIONS.find((r) => r.id === region) ?? REGIONS[0]

  // 지도 중심: 선택한 지역 중심. 내 위치가 그 지역 안(12 km 이내)일 때만 내 위치로.
  // (인천공항처럼 서울에서 50 km 떨어진 곳에서 '서울'을 누르면 서울이 보여야 한다)
  const center = useMemo(() => {
    if (me && region !== 'all' && distanceKm(me.lat, me.lng, regionMeta.lat, regionMeta.lng) < 12) {
      return { lat: me.lat, lng: me.lng, zoom: 13 }
    }
    return { lat: regionMeta.lat, lng: regionMeta.lng, zoom: regionMeta.zoom }
  }, [me, region, regionMeta])

  const list = useMemo(() => {
    let arr: Spot[] = region === 'all' ? SPOTS : SPOTS.filter((s) => s.region === region)
    if (freeOnly) arr = arr.filter((s) => s.fee.adult === 0)
    if (openOnly) arr = arr.filter((s) => ['open', 'always'].includes(openStatus(s).state))
    if (cat) arr = arr.filter((s) => s.category === cat)
    const dist = (s: Spot) => (me ? distanceKm(me.lat, me.lng, s.lat, s.lng) : Infinity)
    const quiet = (s: Spot) => (congestion[s.id] ? LEVEL_ORDER.indexOf(congestion[s.id].level) : 9)
    const sorted = [...arr]
    if (sort === 'distance' && me) sorted.sort((a, b) => dist(a) - dist(b))
    else if (sort === 'quiet') sorted.sort((a, b) => quiet(a) - quiet(b) || b.popularity - a.popularity)
    else sorted.sort((a, b) => b.popularity - a.popularity)
    return sorted
  }, [region, freeOnly, openOnly, cat, sort, me, congestion])

  const cats = Object.keys(CATEGORY_LABEL) as Category[]

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div>
            <h1>Korea <span>Now</span></h1>
            <div className="sub">Go when it's quiet · fees · hours · closed days</div>
          </div>
          <span className={'pill ' + (live ? 'live' : 'demo')} title={live ? 'Seoul spots use live city sensors' : 'Demo mode: typical-pattern estimates'}>
            {live ? '● LIVE' : '◐ DEMO'}
          </span>
        </div>
        <div className="chips">
          {REGIONS.map((r) => (
            <button key={r.id} className={'chip' + (region === r.id ? ' on' : '')} onClick={() => setRegion(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <MapView spots={list} congestion={congestion} me={me} center={center} onLocate={locate} locating={locating} />

      <div className="page">
        <div className="chips" style={{ paddingTop: 0 }}>
          <button className={'chip free' + (freeOnly ? ' on' : '')} onClick={() => setFreeOnly(!freeOnly)}>🆓 Free only</button>
          <button className={'chip' + (openOnly ? ' on' : '')} onClick={() => setOpenOnly(!openOnly)}>🕒 Open now</button>
          {cats.map((c) => (
            <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(cat === c ? null : c)}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="chips" style={{ paddingTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', marginRight: 2 }}>Sort</span>
          <button className={'chip' + (sort === 'distance' ? ' on' : '')} onClick={() => { setSort('distance'); if (!me) locate() }}>Nearest</button>
          <button className={'chip' + (sort === 'quiet' ? ' on' : '')} onClick={() => setSort('quiet')}>Quietest</button>
          <button className={'chip' + (sort === 'popular' ? ' on' : '')} onClick={() => setSort('popular')}>Popular</button>
        </div>

        <div className="section-title">
          {list.length} spots{sort === 'distance' && !me ? ' · tap 📍 for distances' : ''}
        </div>
        {list.length === 0 && <div className="empty">Nothing matches. Try removing a filter.</div>}
        {list.map((s) => (
          <SpotCard
            key={s.id}
            spot={s}
            congestion={congestion[s.id]}
            distanceKm={me ? distanceKm(me.lat, me.lng, s.lat, s.lng) : undefined}
          />
        ))}
        <p className="disclaimer">
          Fees and hours are checked periodically but can change — confirm at the gate for big-ticket items.
          {refreshedAt ? ` Crowd data refreshed ${new Date(refreshedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.` : ''}
        </p>
      </div>
    </>
  )
}
