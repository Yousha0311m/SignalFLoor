import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FloorMap from '@/components/floorplan/FloorMap'
import { useFloor } from '@/hooks/useFloor'
import { useScan } from '@/hooks/useScan'
import { computeHeatGrid, valueAt } from '@/lib/heatmap'
import { inRoom } from '@/lib/analytics'
import { mockRouter } from '@/lib/scanner'
import { levelText, signalLevel } from '@/lib/signal'

export default function Heatmap() {
  const { rooms } = useFloor()
  const { points } = useScan()
  const [showPoints, setShowPoints] = useState(true)
  const [probe, setProbe] = useState<{ x: number; y: number } | null>(null)

  const heat = useMemo(() => computeHeatGrid(rooms, points), [rooms, points])
  const probeValue = heat && probe ? valueAt(heat, probe.x, probe.y) : null

  if (rooms.length === 0 || points.length === 0) {
    const noRooms = rooms.length === 0
    return (
      <div className="rounded-lg border border-line bg-panel h-[480px] grid place-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold">{noRooms ? 'No floor plan yet' : 'No scan data yet'}</p>
          <p className="text-sm text-muted mt-1">
            {noRooms ? 'Draw your rooms first.' : 'Scan a few spots and the heatmap appears here.'}
          </p>
          <Link
            to={noRooms ? '/floor-plans' : '/scans'}
            className="inline-block mt-4 h-9 leading-9 px-3 rounded-md bg-accent text-bg text-sm font-medium"
          >
            {noRooms ? 'Go to Floor Plans' : 'Go to Scans'}
          </Link>
        </div>
      </div>
    )
  }

  const rssis = points.map(p => p.rssi)
  const best = Math.max(...rssis)
  const worst = Math.min(...rssis)

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center gap-4 mb-4">
          {/* color ramp legend */}
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-mono">-85</span>
            <div
              className="h-2 w-40 rounded-full"
              style={{ background: 'linear-gradient(to right, var(--weak), var(--fair), var(--strong))' }}
            />
            <span className="font-mono">-50 dBm</span>
          </div>
          <button
            onClick={() => setShowPoints(s => !s)}
            className="ml-auto h-8 px-3 rounded-md border border-line text-xs text-muted hover:text-ink"
          >
            {showPoints ? 'Hide points' : 'Show points'}
          </button>
        </div>

        <FloorMap
          rooms={rooms}
          points={points}
          heat={heat}
          showPoints={showPoints}
          pending={probe}
          router={mockRouter(rooms)}
          onTap={(x, y) => {
            if (rooms.some(r => inRoom({ x, y }, r))) setProbe({ x, y })
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Estimated at point</p>
          {probe && probeValue !== null ? (
            <>
              <p className={`text-3xl font-semibold ${levelText[signalLevel(probeValue)]}`}>
                {Math.round(probeValue)}
                <span className="text-sm text-muted font-normal ml-1">dBm</span>
              </p>
              <p className="font-mono text-xs text-muted mt-2">({probe.x}, {probe.y})</p>
              <p className="text-xs text-muted mt-2">Interpolated, not measured.</p>
            </>
          ) : (
            <p className="text-sm text-muted">Tap inside a room to read the estimated signal there.</p>
          )}
        </div>

        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Measured</p>
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            <dt className="text-muted">Points</dt>
            <dd className="font-mono">{points.length}</dd>
            <dt className="text-muted">Strongest</dt>
            <dd className={`font-mono ${levelText[signalLevel(best)]}`}>{best} dBm</dd>
            <dt className="text-muted">Weakest</dt>
            <dd className={`font-mono ${levelText[signalLevel(worst)]}`}>{worst} dBm</dd>
          </dl>
        </div>

        {points.length < 8 && (
          <div className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">
            Only {points.length} points. With few points, IDW draws a blob around each one.
            Scan across every room for a believable map.
          </div>
        )}
      </div>
    </div>
  )
}