// 앱 공용 상태: 내 위치, 선택 지역, 혼잡도 캐시
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Congestion, Region } from '../types'
import { SPOTS } from '../data/spots'
import { fetchCongestion, isLive } from './api'

interface Geo { lat: number; lng: number }

interface AppState {
  me: Geo | null
  locating: boolean
  locate: () => void
  region: Region | 'all'
  setRegion: (r: Region | 'all') => void
  congestion: Record<string, Congestion>
  refreshedAt: number
  live: boolean
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Geo | null>(null)
  const [locating, setLocating] = useState(false)
  const [region, setRegion] = useState<Region | 'all'>('seoul')
  const [congestion, setCongestion] = useState<Record<string, Congestion>>({})
  const [refreshedAt, setRefreshedAt] = useState(0)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    )
  }, [])

  // 처음 열 때 한 번 위치 요청 + 혼잡도 로드, 이후 5분마다 갱신
  useEffect(() => {
    locate()
    let alive = true
    const load = async () => {
      const c = await fetchCongestion(SPOTS)
      if (alive) {
        setCongestion(c)
        setRefreshedAt(Date.now())
      }
    }
    load()
    const t = setInterval(load, 5 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [locate])

  const value = useMemo<AppState>(
    () => ({ me, locating, locate, region, setRegion, congestion, refreshedAt, live: isLive }),
    [me, locating, locate, region, congestion, refreshedAt],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}
