import { NavLink, Route, Routes, useParams } from 'react-router-dom'
import { AppProvider } from './lib/state'
import NowPage from './pages/NowPage'
import SpotPage from './pages/SpotPage'
import TodayPage from './pages/TodayPage'
import StampsPage from './pages/StampsPage'
import NearbyPage from './pages/NearbyPage'

// 스팟 사이를 이동할 때 상태(스탬프 등)가 섞이지 않도록 id별로 새로 마운트
function SpotRoute() {
  const { id = '' } = useParams()
  return <SpotPage key={id} />
}

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<NowPage />} />
          <Route path="/spot/:id" element={<SpotRoute />} />
          <Route path="/nearby" element={<NearbyPage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/stamps" element={<StampsPage />} />
        </Routes>
        <nav className="bottom-nav">
          <div className="inner">
            <NavLink to="/" end><span className="ic">🗺️</span>Now</NavLink>
            <NavLink to="/nearby"><span className="ic">📍</span>Nearby</NavLink>
            <NavLink to="/today"><span className="ic">🇰🇷</span>Today</NavLink>
            <NavLink to="/stamps"><span className="ic">🎫</span>Stamps</NavLink>
          </div>
        </nav>
      </div>
    </AppProvider>
  )
}
