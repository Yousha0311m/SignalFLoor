import { Link } from 'react-router-dom'
import StatCard from '@/components/dashboard/StatCard'
import Sparkline from '@/components/dashboard/Sparkline'
import SignalByRoom from '@/components/dashboard/SignalByRoom'
import RecentScans from '@/components/dashboard/RecentScans'
import FloorMap from '@/components/floorplan/FloorMap'
import Legend from '@/components/floorplan/Legend'
import { useFloor } from '@/hooks/useFloor'
import { useScan } from '@/hooks/useScan'
import { roomAverages, coveragePct } from '@/lib/analytics'
import { useMemo } from 'react'
import { computeHeatGrid } from '@/lib/heatmap'
import { findDeadZones } from '@/lib/recommend'

export default function Dashboard() {
  const { rooms } = useFloor()
  const { points } = useScan()

    const heat = useMemo(() => computeHeatGrid(rooms, points), [rooms, points])

  const has = points.length > 0
  const roomStats = roomAverages(rooms, points)
  const avg = has ? Math.round(points.reduce((s, p) => s + p.rssi, 0) / points.length) : 0
  const deadZones = findDeadZones(rooms, points).length

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Avg RSSI" value={has ? avg : '--'} unit={has ? 'dBm' : undefined} />
        <StatCard label="Coverage" value={has ? coveragePct(points) : '--'} unit={has ? '%' : undefined} />
        <StatCard label="Scan points" value={points.length} />
        <StatCard label="Dead zones" value={has ? deadZones : '--'} />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider text-muted">Floor plan</p>
            <Legend />
          </div>
          {rooms.length === 0 ? (
            <div className="h-[360px] grid place-items-center text-sm text-muted">
              <p>
                No floor plan yet.{' '}
                <Link to="/floor-plans" className="text-accent hover:underline">
                  Draw one
                </Link>
              </p>
            </div>
          ) : (
            <FloorMap rooms={rooms} points={points} heat={heat} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {has ? (
            <>
              <Sparkline points={points} />
              <SignalByRoom data={roomStats} />
              <RecentScans points={points} />
            </>
          ) : (
            <div className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">
              <p>No scan data yet.</p>
              <Link to="/scans" className="inline-block mt-2 text-accent hover:underline">
                Start scanning
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}