import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

// Page imports — we'll build these one by one
import Landing from './pages/Landing'
import Journey from './pages/Journey'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-base text-text-primary font-body">

      {/* Navbar stays fixed across all pages */}
      <Navbar />

      {/* Route definitions */}
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/journey"   element={<Journey />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

    </div>
  )
}