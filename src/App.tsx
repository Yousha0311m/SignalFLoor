import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import FloorPlans from '@/pages/FloorPlans'
import Scans from '@/pages/Scans'
import Heatmap from '@/pages/Heatmap'
import Reports from '@/pages/Reports'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/floor-plans" element={<FloorPlans />} />
        <Route path="/scans" element={<Scans />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </AppLayout>
  )
}