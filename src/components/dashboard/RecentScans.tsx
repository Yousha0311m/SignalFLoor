import { levelText, signalLevel } from '@/lib/signal'
import type { ScanPoint } from '@/types'

export default function RecentScans({ points }: { points: ScanPoint[] }) {
  const recent = [...points]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5)

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Recent scans</p>
      <ul className="flex flex-col gap-2">
        {recent.map(p => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <span className="font-mono text-muted">
              {new Date(p.timestamp).toISOString().slice(11, 19)}
            </span>
            <span className="font-mono text-muted">({p.x}, {p.y})</span>
            <span className={`font-mono ${levelText[signalLevel(p.rssi)]}`}>{p.rssi} dBm</span>
          </li>
        ))}
      </ul>
    </div>
  )
}