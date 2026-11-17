import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'
import StatCard from '@/components/dashboard/StatCard'
import FloorMap, { type Marker } from '@/components/floorplan/FloorMap'
import Legend from '@/components/floorplan/Legend'
import { useFloor } from '@/hooks/useFloor'
import { useScan } from '@/hooks/useScan'
import { computeHeatGrid } from '@/lib/heatmap'
import { coveragePct, inRoom } from '@/lib/analytics'
import { findDeadZones, recommend, DEAD_RSSI, GOOD_RSSI } from '@/lib/recommend'
import { levelText, signalLevel } from '@/lib/signal'

const axis = {
  stroke: 'var(--line)',
  tick: { fill: 'var(--muted)', fontSize: 11 },
  tickLine: false as const,
}
const tip = {
  contentStyle: {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: 6,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--muted)' },
  itemStyle: { color: 'var(--ink)' },
}

export default function Reports() {
  const { rooms } = useFloor()
  const { points } = useScan()

  const heat = useMemo(() => computeHeatGrid(rooms, points), [rooms, points])
  const zones = useMemo(() => findDeadZones(rooms, points), [rooms, points])
  const recs = useMemo(() => recommend(rooms, zones, points, heat), [rooms, zones, points, heat])

  if (rooms.length === 0 || points.length === 0) {
    const noRooms = rooms.length === 0
    return (
      <div className="rounded-lg border border-line bg-panel h-[480px] grid place-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold">{noRooms ? 'No floor plan yet' : 'No scan data yet'}</p>
          <p className="text-sm text-muted mt-1">
            {noRooms ? 'Draw your rooms first.' : 'Scan your rooms and the report builds itself.'}
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

  // per-room stats
  const rows = rooms.map(room => {
    const pts = points.filter(p => inRoom(p, room))
    if (pts.length === 0) return { room, count: 0, avg: null, min: null, cov: null }
    const avg = Math.round(pts.reduce((s, p) => s + p.rssi, 0) / pts.length)
    return {
      room,
      count: pts.length,
      avg,
      min: Math.min(...pts.map(p => p.rssi)),
      cov: Math.round((pts.filter(p => p.rssi >= GOOD_RSSI).length / pts.length) * 100),
    }
  })
  const scanned = rows.filter(r => r.avg !== null)
  const weakest = scanned.length
    ? scanned.reduce((b, r) => ((r.avg as number) < (b.avg as number) ? r : b))
    : null

  const avgAll = Math.round(points.reduce((s, p) => s + p.rssi, 0) / points.length)

  // charts
  const series = [...points]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(p => ({ time: new Date(p.timestamp).toTimeString().slice(0, 8), rssi: p.rssi }))

  const dist = (['strong', 'fair', 'weak'] as const).map(level => ({
    level,
    count: points.filter(p => signalLevel(p.rssi) === level).length,
  }))

  // map markers
  const markers: Marker[] = [
    ...zones.map(z => ({ x: z.cx, y: z.cy, label: `DZ${z.id}`, kind: 'dead' as const })),
    ...recs.map(r => ({ x: r.x, y: r.y, label: `E${r.zone.id}`, kind: 'extender' as const })),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Avg RSSI" value={avgAll} unit="dBm" />
        <StatCard label="Coverage" value={coveragePct(points)} unit="%" />
        <StatCard label="Dead zones" value={zones.length} />
        <StatCard
          label="Weakest room"
          value={weakest ? weakest.room.name : '--'}
          unit={weakest ? `${weakest.avg} dBm` : undefined}
        />
      </div>

      {/* map + recommendations */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider text-muted">Coverage map</p>
            <Legend />
          </div>
          <FloorMap rooms={rooms} points={points} heat={heat} markers={markers} />
          <p className="text-xs text-muted mt-3">
            DZ = dead zone (below {DEAD_RSSI} dBm). E = suggested extender spot.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Recommendations</p>

          {zones.length === 0 ? (
            <p className="text-sm text-muted">
              No dead zones. Every scanned area is at or above {DEAD_RSSI} dBm.
            </p>
          ) : recs.length === 0 ? (
            <p className="text-sm text-muted">
              Signal is weak everywhere you scanned, so there's no strong spot to anchor an
              extender to. Try moving the router first, then rescan.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {recs.map(r => (
                <li key={r.zone.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
                  <p className="text-sm">
                    <span className="font-mono text-xs text-accent-2 mr-2">E{r.zone.id}</span>
                    {r.text}
                  </p>
                  <p className="font-mono text-xs text-muted mt-1">
                    extender ({r.x}, {r.y}) · zone ({r.zone.cx}, {r.zone.cy})
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-muted mt-4 border-t border-line pt-3">
            A starting point, not a guarantee. Move the extender, then rescan to confirm.
          </p>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">RSSI over time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="time" {...axis} minTickGap={32} />
                <YAxis domain={[-95, -30]} {...axis} />
                <Tooltip {...tip} />
                <ReferenceLine y={GOOD_RSSI} stroke="var(--fair)" strokeDasharray="4 4" />
                <ReferenceLine y={DEAD_RSSI} stroke="var(--weak)" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="rssi"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted mt-2">
            Dashed lines: {GOOD_RSSI} dBm (good) and {DEAD_RSSI} dBm (dead zone).
          </p>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Points by signal level</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="level" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip {...tip} cursor={{ fill: 'var(--panel-2)' }} />
                <Bar dataKey="count" isAnimationActive={false}>
                  {dist.map(d => (
                    <Cell key={d.level} fill={`var(--${d.level})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* room table */}
      <div className="rounded-lg border border-line bg-panel p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted mb-3">By room</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="font-normal pb-2">Room</th>
              <th className="font-normal pb-2 text-right">Points</th>
              <th className="font-normal pb-2 text-right">Avg</th>
              <th className="font-normal pb-2 text-right">Weakest</th>
              <th className="font-normal pb-2 text-right">Coverage</th>
              <th className="font-normal pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.room.id} className="border-t border-line">
                <td className="py-2">{r.room.name}</td>
                <td className="py-2 text-right font-mono text-xs text-muted">{r.count}</td>
                {r.avg === null ? (
                  <td colSpan={4} className="py-2 text-right text-xs text-muted">
                    not scanned
                  </td>
                ) : (
                  <>
                    <td className="py-2 text-right font-mono text-xs">{r.avg} dBm</td>
                    <td className="py-2 text-right font-mono text-xs">{r.min} dBm</td>
                    <td className="py-2 text-right font-mono text-xs">{r.cov}%</td>
                    <td className={`py-2 text-right text-xs capitalize ${levelText[signalLevel(r.avg)]}`}>
                      {signalLevel(r.avg)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}