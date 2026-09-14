import type { Congestion } from '../types'
import { LEVEL_META } from '../lib/congestion'

export default function CongestionBadge({ c, size = 'sm' }: { c?: Congestion; size?: 'sm' | 'lg' }) {
  if (!c) return <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>…</span>
  const m = LEVEL_META[c.level]
  return (
    <span className="badge" style={{ background: m.bg, color: m.color, fontSize: size === 'lg' ? 14 : 12 }}>
      {m.emoji} {m.label}
    </span>
  )
}
