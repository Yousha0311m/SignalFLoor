import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crosshair, MapPin } from 'lucide-react'
import FloorMap from '@/components/floorplan/FloorMap'
import Legend from '@/components/floorplan/Legend'
import { useFloor } from '@/hooks/useFloor'
import { useScan } from '@/hooks/useScan'
import { simulateScan, mockRouter } from '@/lib/scanner'
import { inRoom } from '@/lib/analytics'
import { suggestSpots, nextSpot } from '@/lib/spots'
import { levelText, signalLevel } from '@/lib/signal'
import type { ScanPoint } from '@/types'

export default function Scans() {
  const { rooms } = useFloor()
  const { points, setPoints, addPoint, clear } = useScan()
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null)
  const [scanning, setScanning] = useState(false)

  const spots = useMemo(() => suggestSpots(rooms, points), [rooms, points])
  const last = points[points.length - 1]
  const next = nextSpot(spots, last)
  const doneCount = spots.filter(s => s.done).length

  const handleTap = (x: number, y: number) => {
    if (!rooms.some(r => inRoom({ x, y }, r))) return // ignore taps outside the house
    // tapping near a suggested spot snaps to it
    const near = spots.find(s => !s.done && Math.hypot(s.x - x, s.y - y) <= 25)
    setPending(near ? { x: near.x, y: near.y } : { x, y })
  }

  const scan = async () => {
    if (!pending || scanning) return
    setScanning(true)
    try {
      const reading = await simulateScan(pending.x, pending.y, rooms)
      addPoint({
        id: Date.now(),
        x: pending.x,
        y: pending.y,
        timestamp: new Date().toISOString(),
        ...reading,
      })
      setPending(null)
    } finally {
      setScanning(false)
    }
  }

  // DEV ONLY: scans every suggested spot instantly. Remove when the real ESP32 is in.
  const autoFill = async () => {
    const batch: ScanPoint[] = []
    for (const s of spots.filter(s => !s.done)) {
      const reading = await simulateScan(s.x, s.y, rooms, 0)
      batch.push({
        id: Date.now() + batch.length,
        x: s.x,
        y: s.y,
        timestamp: new Date().toISOString(),
        ...reading,
      })
    }
    setPoints(ps => [...ps, ...batch])
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel h-[480px] grid place-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold">No floor plan yet</p>
          <p className="text-sm text-muted mt-1">
            Draw your rooms first, then come back to scan.
          </p>
          <Link
            to="/floor-plans"
            className="inline-block mt-4 h-9 leading-9 px-3 rounded-md bg-accent text-bg text-sm font-medium"
          >
            Go to Floor Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      {/* map */}
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={scan}
            disabled={!pending || scanning}
            className="h-9 px-3 rounded-md bg-accent text-bg text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Crosshair size={15} />
            {scanning ? 'Scanning…' : 'Scan here'}
          </button>
          <p className="text-sm text-muted">
            {pending ? (
              <span className="font-mono">
                Location · ({pending.x}, {pending.y})
              </span>
            ) : (
              'Tap a numbered spot, or anywhere inside a room'
            )}
          </p>
          <div className="ml-auto">
            <Legend />
          </div>
        </div>
        <FloorMap
          rooms={rooms}
          points={points}
          pending={pending}
          router={mockRouter(rooms)}
          spots={spots}
          nextId={next?.id ?? null}
          onTap={handleTap}
        />
      </div>

      {/* right rail */}
      <div className="flex flex-col gap-4">
        {/* suggested spots */}
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider text-muted">Suggested spots</p>
            <span className="font-mono text-xs text-muted">
              {doneCount}/{spots.length}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-panel-2 mb-3">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${spots.length ? (doneCount / spots.length) * 100 : 0}%` }}
            />
          </div>

          <ul className="flex flex-col gap-1.5 mb-3">
            {rooms.map(r => {
              const rs = spots.filter(s => s.roomId === r.id)
              const d = rs.filter(s => s.done).length
              return (
                <li key={r.id} className="flex justify-between text-sm">
                  <span className={d === rs.length ? 'text-muted' : 'text-ink'}>{r.name}</span>
                  <span className="font-mono text-xs text-muted">
                    {d}/{rs.length}
                  </span>
                </li>
              )
            })}
          </ul>

          {next ? (
            <button
              onClick={() => setPending({ x: next.x, y: next.y })}
              className="h-9 w-full rounded-md border border-line text-sm flex items-center justify-center gap-2 hover:bg-panel-2"
            >
              <MapPin size={15} />
              Next: #{spots.indexOf(next) + 1} · {next.roomName}
            </button>
          ) : (
            <p className="text-sm text-muted">
              All spots covered. Check the Heatmap, or tap anywhere to add extra points.
            </p>
          )}

          {next && (
            <button
              onClick={autoFill}
              className="mt-2 h-8 w-full rounded-md text-xs text-muted hover:text-ink"
            >
              Auto-fill remaining (dev)
            </button>
          )}
        </div>

        {/* latest reading */}
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Latest reading</p>
          {last ? (
            <>
              <p className={`text-3xl font-semibold ${levelText[signalLevel(last.rssi)]}`}>
                {last.rssi}
                <span className="text-sm text-muted font-normal ml-1">dBm</span>
              </p>
              <p className="font-mono text-xs text-muted mt-2">
                {last.ssid} · ({last.x}, {last.y})
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">No readings yet.</p>
          )}
        </div>

        {/* points list */}
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Points · {points.length}
            </p>
            {points.length > 0 && (
              <button
                onClick={() => window.confirm('Delete all scan points?') && clear()}
                className="text-xs text-weak hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <ul className="flex flex-col gap-2 max-h-72 overflow-auto">
            {[...points].reverse().map(p => (
              <li key={p.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted">
                  {new Date(p.timestamp).toTimeString().slice(0, 8)}
                </span>
                <span className="font-mono text-muted">({p.x}, {p.y})</span>
                <span className={`font-mono ${levelText[signalLevel(p.rssi)]}`}>{p.rssi} dBm</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}