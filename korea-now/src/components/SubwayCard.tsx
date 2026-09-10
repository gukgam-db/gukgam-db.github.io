// 가장 가까운 지하철역의 실시간 도착 — 30초마다 갱신
import { useEffect, useState } from 'react'
import type { Spot } from '../types'
import { fetchArrivals, isLive, type Arrival, type ArrivalBoard } from '../lib/api'

// 노선 배지 색 (서울교통공사 공식 색상)
const LINE_COLOR: Record<string, string> = {
  '1': '#0052A4', '2': '#00A84D', '3': '#EF7C1C', '4': '#00A5DE', '5': '#996CAC', '6': '#CD7C2F', '7': '#747F00',
  '8': '#E6186C', '9': '#BDB092', '공항': '#0090D2', '경의중앙': '#77C4A3', '수인분당': '#F5A200', '신분당': '#D4003B',
  '경춘': '#0C8E72', '우이신설': '#B0CE18', 'GTX-A': '#9A6292',
}
const LINE_EN: Record<string, string> = { '공항': 'AREX', '경의중앙': 'Gyeongui-Jungang', '수인분당': 'Suin-Bundang', '신분당': 'Sinbundang', '경춘': 'Gyeongchun', '우이신설': 'Ui-Sinseol' }

function lineKeyFromApi(line: string): string {
  const m = line.match(/^Line (\d)$/)
  if (m) return m[1]
  if (line.startsWith('AREX')) return '공항'
  if (line.startsWith('Gyeongui')) return '경의중앙'
  if (line.startsWith('Suin')) return '수인분당'
  if (line.startsWith('Sinbundang')) return '신분당'
  if (line.startsWith('Gyeongchun')) return '경춘'
  if (line.startsWith('Ui-')) return '우이신설'
  return line
}

function LineBadge({ k }: { k: string }) {
  const color = LINE_COLOR[k] ?? '#6b7280'
  const label = /^\d$/.test(k) ? k : (LINE_EN[k] ?? k)
  return <span className="line-badge" style={{ background: color }}>{label}</span>
}

function eta(a: Arrival): string {
  if (a.status === '0' || a.status === '1') return 'Arriving'
  if (a.status === '2') return 'Departing'
  if (a.seconds > 0) return a.seconds < 60 ? 'Now' : `${Math.round(a.seconds / 60)} min`
  const m = a.msg.match(/(\d+)분/)
  if (m) return `${m[1]} min`
  const n = a.msg.match(/\[(\d+)\]번째/)
  if (n) return `${n[1]} stops away`
  return a.msg
}

function dirLabel(d: string): string {
  return d === '내선' ? 'Inner loop' : d === '외선' ? 'Outer loop' : d === '상행' ? 'Up' : d === '하행' ? 'Down' : d
}

export default function SubwayCard({ spot }: { spot: Spot }) {
  const st = spot.station
  const [board, setBoard] = useState<ArrivalBoard | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    if (!st || !isLive) return
    let alive = true
    const load = () => {
      setState('loading')
      fetchArrivals(st.name)
        .then((b) => { if (alive) { setBoard(b); setState('idle') } })
        .catch(() => { if (alive) setState('error') })
    }
    load()
    const t = setInterval(load, 30 * 1000)
    return () => { alive = false; clearInterval(t) }
  }, [st])

  if (!st) return null

  // 방향별로 가장 빠른 2대씩
  const groups = new Map<string, Arrival[]>()
  for (const a of board?.arrivals ?? []) {
    const k = `${a.line}|${a.direction}`
    const g = groups.get(k) ?? []
    if (g.length < 2) g.push(a)
    groups.set(k, g)
  }

  return (
    <div className="card">
      <div className="label" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
        Nearest subway · {st.walkMin} min walk
      </div>
      <div className="station-row">
        {st.lines.map((l) => <LineBadge key={l} k={l} />)}
        <b>{st.nameEn}</b>
        <span style={{ color: 'var(--muted)' }}>{st.name}역</span>
      </div>

      {!isLive && <div className="source-note">Live arrivals need the server connection.</div>}
      {isLive && state === 'error' && <div className="source-note">Arrivals unavailable right now.</div>}
      {isLive && board && board.arrivals.length === 0 && <div className="source-note">{board.note ?? 'No trains reported (last train may have left).'}</div>}

      {groups.size > 0 && (
        <div className="arrivals">
          {[...groups.entries()].map(([k, list]) => (
            <div key={k} className="arrival-row">
              <LineBadge k={lineKeyFromApi(list[0].line)} />
              <div className="arrival-body">
                <div className="dest">→ {list[0].dest} <span className="dir">{dirLabel(list[0].direction)}{list[0].express ? ' · Express' : ''}</span></div>
                <div className="etas">
                  {list.map((a, i) => <span key={i} className={'eta' + (i === 0 ? ' first' : '')}>{eta(a)}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {board && board.arrivals.length > 0 && (
        <div className="source-note">
          Live from Seoul Metro, {new Date(board.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' })} KST · refreshes every 30 s
        </div>
      )}
    </div>
  )
}
