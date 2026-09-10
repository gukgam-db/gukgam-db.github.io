import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_ICON, REGIONS, SPOTS } from '../data/spots'
import { loadStamps } from '../lib/stamps'

export default function StampsPage() {
  const [stamps] = useState(() => loadStamps())
  const got = new Set(stamps.map((s) => s.spotId))
  const pct = Math.round((got.size / SPOTS.length) * 100)

  return (
    <div className="page">
      <div className="section-title" style={{ marginTop: 4 }}>My Korea stamps · {got.size} / {SPOTS.length}</div>
      <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      {got.size === 0 && (
        <div className="empty">
          No stamps yet. Open a spot and tap <b>“I was here”</b> when you visit.
          <br /><Link to="/">Find a quiet spot →</Link>
        </div>
      )}
      {REGIONS.filter((r) => r.id !== 'all').map((r) => {
        const list = SPOTS.filter((s) => s.region === r.id)
        const done = list.filter((s) => got.has(s.id)).length
        return (
          <div key={r.id}>
            <div className="section-title">{r.label} · {done}/{list.length}</div>
            <div className="stamp-grid">
              {list.map((s) => (
                <Link key={s.id} to={`/spot/${s.id}`} className={'stamp' + (got.has(s.id) ? ' on' : '')}>
                  <div className="icon">{CATEGORY_ICON[s.category]}</div>
                  <div>{s.name.split(' (')[0]}</div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
      <p className="disclaimer">Stamps are saved on this device only.</p>
    </div>
  )
}
