// 12시간 혼잡도 예측 막대
import type { Congestion, Spot } from '../types'
import { LEVEL_META, LEVEL_ORDER, bestTime, hourLabel, isOpenAt } from '../lib/congestion'

export default function Timeline({ spot, c }: { spot: Spot; c: Congestion }) {
  const best = bestTime(spot, c)
  return (
    <div>
      <div className="timeline">
        {c.forecast.map((f) => {
          const idx = LEVEL_ORDER.indexOf(f.level)
          const open = isOpenAt(spot, f.time)
          const h = open ? 25 + idx * 25 : 10
          const isBest = best.slot?.time === f.time
          return (
            <div
              key={f.time}
              className={'bar' + (isBest ? ' best' : '')}
              title={open
                ? `${hourLabel(f.time)} · ${LEVEL_META[f.level].label} · ${f.min.toLocaleString()}–${f.max.toLocaleString()} people`
                : `${hourLabel(f.time)} · closed`}
              style={{ height: `${h}%`, background: open ? LEVEL_META[f.level].color : '#d1d5db', opacity: open ? 0.85 : 1 }}
            />
          )
        })}
      </div>
      <div className="timeline-labels">
        {c.forecast.map((f, i) => (
          <span key={f.time}>{i % 3 === 0 ? hourLabel(f.time).replace(' ', '') : ''}</span>
        ))}
      </div>
      <div className="source-note">
        <span style={{ display: 'inline-block', width: 8, height: 8, background: '#d1d5db', borderRadius: 2, marginRight: 4 }} />closed hours · {best.reason}
        {' · '}
        {c.source === 'seoul-live'
          ? `Live from Seoul city data, ${new Date(c.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' })} KST`
          : c.source === 'kto-forecast'
            ? "Today's level from Korea Tourism Organization's 30-day forecast (mobile data); hourly shape estimated"
            : 'Estimated from typical daily patterns (no live sensor here)'}
      </div>
    </div>
  )
}
