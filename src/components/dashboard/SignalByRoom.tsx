import { levelBg, rssiToPercent, signalLevel } from '@/lib/signal'
import type { Room } from '@/types'

interface Props {
  data: { room: Room; avg: number; count: number }[]
}

export default function SignalByRoom({ data }: Props) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Signal by room</p>
      <div className="flex flex-col gap-3">
        {data.map(({ room, avg }) => (
          <div key={room.id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{room.name}</span>
              <span className="font-mono text-xs text-muted">{avg} dBm</span>
            </div>
            <div className="h-1.5 rounded-full bg-panel-2">
              <div
                className={`h-full rounded-full ${levelBg[signalLevel(avg)]}`}
                style={{ width: `${rssiToPercent(avg)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}