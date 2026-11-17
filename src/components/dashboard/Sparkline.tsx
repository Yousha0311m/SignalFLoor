import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import type { ScanPoint } from '@/types'

export default function Sparkline({ points }: { points: ScanPoint[] }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted mb-2">RSSI over time</p>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
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
    </div>
  )
}