import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Line, Circle, Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { Room, ScanPoint } from '@/types'
import { CANVAS_W, CANVAS_H, clamp } from '@/lib/floor'
import { signalLevel } from '@/lib/signal'
import { renderHeatCanvas, type HeatGrid } from '@/lib/heatmap'
import type { Spot } from '@/lib/spots'
import { useCanvasColors } from '@/hooks/useCanvasColors'

export interface Marker {
  x: number
  y: number
  label: string
  kind: 'dead' | 'extender'
}

interface Props {
  rooms: Room[]
  points: ScanPoint[]
  pending?: { x: number; y: number } | null
  router?: { x: number; y: number } | null
  heat?: HeatGrid | null
  spots?: Spot[]
  nextId?: string | null
  markers?: Marker[]
  showPoints?: boolean
  onTap?: (x: number, y: number) => void
}

export default function FloorMap({
  rooms, points, pending, router, heat, spots, nextId, markers, showPoints = true, onTap,
}: Props) {
  const c = useCanvasColors()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(CANVAS_W)
  const scale = width / CANVAS_W

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const heatCanvas = useMemo(
    () => (heat ? renderHeatCanvas(heat, { weak: c.weak, fair: c.fair, strong: c.strong }) : null),
    [heat, c.weak, c.fair, c.strong],
  )

  const handleTap = (e: Konva.KonvaEventObject<Event>) => {
    if (!onTap) return
    const p = e.target.getStage()?.getRelativePointerPosition()
    if (!p) return
    onTap(Math.round(clamp(p.x, 0, CANVAS_W)), Math.round(clamp(p.y, 0, CANVAS_H)))
  }

  const vLines = Array.from({ length: CANVAS_W / 50 + 1 }, (_, i) => i * 50)
  const hLines = Array.from({ length: CANVAS_H / 50 + 1 }, (_, i) => i * 50)
  const last = points[points.length - 1]

  return (
    <div ref={wrapRef} className="w-full">
      <Stage
        width={width}
        height={CANVAS_H * scale}
        scale={{ x: scale, y: scale }}
        onClick={handleTap}
        onTap={handleTap}
        style={{ cursor: onTap ? 'crosshair' : 'default' }}
      >
        {/* 1. grid + room fills */}
        <Layer listening={false}>
          {vLines.map(x => (
            <Line key={`v${x}`} points={[x, 0, x, CANVAS_H]} stroke={c.grid} strokeWidth={1} />
          ))}
          {hLines.map(y => (
            <Line key={`h${y}`} points={[0, y, CANVAS_W, y]} stroke={c.grid} strokeWidth={1} />
          ))}
          <Rect width={CANVAS_W} height={CANVAS_H} stroke={c.line} strokeWidth={1} />
          {rooms.map(r => (
            <Rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={c['panel-2']} />
          ))}
        </Layer>

        {/* 2. heatmap */}
        {heatCanvas && (
          <Layer listening={false}>
            <KonvaImage
              image={heatCanvas}
              x={0}
              y={0}
              width={CANVAS_W}
              height={CANVAS_H}
              opacity={0.75}
              globalCompositeOperation={(c['heat-blend'] || 'source-over') as GlobalCompositeOperation}
            />
          </Layer>
        )}

        {/* 3. walls, labels, router, suggested spots, points */}
        <Layer listening={false}>
          {rooms.map(r => (
            <Rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              stroke={c.wall}
              strokeWidth={1.5}
            />
          ))}
          {rooms.map(r => (
            <Text
              key={`t${r.id}`}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              text={r.name}
              align="center"
              verticalAlign="middle"
              fill={c.label}
              fontSize={14}
              fontFamily="ui-monospace, Menlo, monospace"
            />
          ))}

          {router && (
            <>
              <Circle
                x={router.x}
                y={router.y}
                radius={9}
                fill={c.panel}
                stroke={c['accent-2']}
                strokeWidth={2}
              />
              <Text
                x={router.x - 40}
                y={router.y + 14}
                width={80}
                align="center"
                text="router (mock)"
                fill={c['accent-2']}
                fontSize={11}
                fontFamily="ui-monospace, Menlo, monospace"
              />
            </>
          )}

          {spots?.map((s, i) => {
            if (s.done) return null
            const isNext = s.id === nextId
            return (
              <Group key={s.id} x={s.x} y={s.y}>
                <Circle
                  radius={isNext ? 17 : 14}
                  stroke={isNext ? c.accent : c.muted}
                  strokeWidth={isNext ? 2 : 1.5}
                  dash={[4, 3]}
                />
                <Text
                  x={-16}
                  y={-6}
                  width={32}
                  align="center"
                  text={String(i + 1)}
                  fill={isNext ? c.accent : c.muted}
                  fontSize={11}
                  fontFamily="ui-monospace, Menlo, monospace"
                />
              </Group>
            )
          })}

          {showPoints &&
            points.map(p => (
              <Circle
                key={p.id}
                x={p.x}
                y={p.y}
                radius={6}
                fill={c[signalLevel(p.rssi)]}
                stroke={c.bg}
                strokeWidth={2}
              />
            ))}

          {showPoints && last && (
            <Circle x={last.x} y={last.y} radius={11} stroke={c.ink} strokeWidth={1} opacity={0.6} />
          )}

          {pending && (
            <>
              <Circle x={pending.x} y={pending.y} radius={22} stroke={c.accent} strokeWidth={2} />
              <Circle x={pending.x} y={pending.y} radius={3} fill={c.accent} />
            </>
          )}
                  {markers?.map(m => (
            <Group key={`${m.kind}-${m.label}`} x={m.x} y={m.y}>
              {m.kind === 'dead' ? (
                <Circle radius={34} stroke={c.weak} strokeWidth={2} dash={[6, 4]} />
              ) : (
                <Circle radius={9} fill={c['accent-2']} stroke={c.bg} strokeWidth={2} />
              )}
              <Text
                x={-30}
                y={m.kind === 'dead' ? -52 : 13}
                width={60}
                align="center"
                text={m.label}
                fill={m.kind === 'dead' ? c.weak : c['accent-2']}
                fontSize={11}
                fontStyle="bold"
                fontFamily="ui-monospace, Menlo, monospace"
              />
            </Group>
          ))}
          
        </Layer>
      </Stage>
    </div>
  )
}