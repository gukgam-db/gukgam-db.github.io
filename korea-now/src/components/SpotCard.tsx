import { Link } from 'react-router-dom'
import type { Congestion, Spot } from '../types'
import { CATEGORY_ICON, CATEGORY_LABEL } from '../data/spots'
import { formatDistance, formatKrw, walkMinutes } from '../lib/geo'
import { openStatus } from '../lib/hours'
import CongestionBadge from './CongestionBadge'

interface Props {
  spot: Spot
  congestion?: Congestion
  distanceKm?: number
}

export default function SpotCard({ spot, congestion, distanceKm }: Props) {
  const st = openStatus(spot)
  return (
    <Link to={`/spot/${spot.id}`} className="card spot-card">
      <div>
        <div className="name">
          {CATEGORY_ICON[spot.category]} {spot.name}
          <span className="ko">{spot.nameKo}</span>
        </div>
        <div className="meta">
          <span>{CATEGORY_LABEL[spot.category]}</span>
          <span>{spot.fee.adult === 0 ? <b className="free-tag">Free</b> : <b>{formatKrw(spot.fee.adult)}</b>}</span>
          {st.state === 'open' && <span className="status-open">Open · closes {st.closesAt}</span>}
          {st.state === 'always' && <span className="status-open">Open area</span>}
          {st.state === 'closed-now' && <span className="status-closed">Closed now · opens {st.opensAt}</span>}
          {st.state === 'closed-today' && <span className="status-closed">{st.reason}</span>}
        </div>
      </div>
      <div className="right">
        <CongestionBadge c={congestion} />
        {distanceKm !== undefined && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {formatDistance(distanceKm)}{distanceKm < 3 ? ` · ${walkMinutes(distanceKm)} min walk` : ''}
          </span>
        )}
      </div>
    </Link>
  )
}
