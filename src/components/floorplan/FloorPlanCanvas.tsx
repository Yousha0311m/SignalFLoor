import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Line, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { Room } from '@/types'
import { CANVAS_W, CANVAS_H, MIN_ROOM, snap, clamp } from '@/lib/floor'
import { useCanvasColors } from '@/hooks/useCanvasColors'

export type Mode = 'select' | 'draw'

interface Rect4 { x: number; y: number; w: number; h: number }

interface Props {
  rooms: Room[]
  selectedId: string | null
  mode: Mode
  onSelect: (id: string | null) => void
  onAdd: (rect: Rect4) => string
  onUpdate: (id: string, patch: Partial<Room>) => void
}

export default function FloorPlanCanvas({
  rooms, selectedId, mode, onSelect, onAdd, onUpdate,
}: Props) {
  const c = useCanvasColors()
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const [width, setWidth] = useState(CANVAS_W)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<Rect4 | null>(null)

  const scale = width / CANVAS_W

  // fit the 1000x600 logical canvas to whatever width the container has
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // attach the resize handles to the selected room
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node =
      mode === 'select' && selectedId
        ? stage.findOne((n: Konva.Node) => n.id() === selectedId)
        : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, mode, rooms])

  const pointer = () => stageRef.current?.getRelativePointerPosition() ?? null

  const handleDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target !== e.target.getStage()) return // clicked a room, not empty space
    if (mode === 'select') {
      onSelect(null)
      return
    }
    const p = pointer()
    if (!p) return
    const o = { x: snap(clamp(p.x, 0, CANVAS_W)), y: snap(clamp(p.y, 0, CANVAS_H)) }
    setOrigin(o)
    setDraft({ ...o, w: 0, h: 0 })
  }

  const handleMove = () => {
    if (!origin) return
    const p = pointer()
    if (!p) return
    const x2 = snap(clamp(p.x, 0, CANVAS_W))
    const y2 = snap(clamp(p.y, 0, CANVAS_H))
    setDraft({
      x: Math.min(origin.x, x2),
      y: Math.min(origin.y, y2),
      w: Math.abs(x2 - origin.x),
      h: Math.abs(y2 - origin.y),
    })
  }

  const handleUp = () => {
    if (draft && draft.w >= MIN_ROOM && draft.h >= MIN_ROOM) {
      onSelect(onAdd(draft))
    }
    setOrigin(null)
    setDraft(null)
  }

  const vLines = Array.from({ length: CANVAS_W / 50 + 1 }, (_, i) => i * 50)
  const hLines = Array.from({ length: CANVAS_H / 50 + 1 }, (_, i) => i * 50)

  return (
    <div ref={wrapRef} className="w-full">
      <Stage
        ref={stageRef}
        width={width}
        height={CANVAS_H * scale}
        scale={{ x: scale, y: scale }}
        onMouseDown={handleDown}
        onTouchStart={handleDown}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleUp}
        onTouchEnd={handleUp}
        onMouseLeave={handleUp}
        style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
      >
        {/* grid + outline */}
        <Layer listening={false}>
          {vLines.map(x => (
            <Line key={`v${x}`} points={[x, 0, x, CANVAS_H]} stroke={c.grid} strokeWidth={1} />
          ))}
          {hLines.map(y => (
            <Line key={`h${y}`} points={[0, y, CANVAS_W, y]} stroke={c.grid} strokeWidth={1} />
          ))}
          <Rect width={CANVAS_W} height={CANVAS_H} stroke={c.line} strokeWidth={1} />
        </Layer>

        {/* rooms */}
        <Layer>
          {rooms.map(r => {
            const isSel = r.id === selectedId
            return (
              <Group
                key={r.id}
                id={r.id}
                x={r.x}
                y={r.y}
                draggable={mode === 'select'}
                listening={mode === 'select'}
                onClick={() => onSelect(r.id)}
                onTap={() => onSelect(r.id)}
                onDragEnd={e => {
                  const x = snap(e.target.x())
                  const y = snap(e.target.y())
                  e.target.position({ x, y })
                  onUpdate(r.id, { x, y })
                }}
                onTransformEnd={e => {
                  const node = e.target
                  const w = Math.max(MIN_ROOM, snap(r.w * node.scaleX()))
                  const h = Math.max(MIN_ROOM, snap(r.h * node.scaleY()))
                  const x = snap(node.x())
                  const y = snap(node.y())
                  node.scale({ x: 1, y: 1 })
                  node.position({ x, y })
                  onUpdate(r.id, { x, y, w, h })
                }}
              >
                <Rect
                  width={r.w}
                  height={r.h}
                  fill={c['panel-2']}
                  stroke={isSel ? c.accent : c.wall}
                  strokeWidth={isSel ? 2 : 1.5}
                />
                <Text
                  text={r.name}
                  width={r.w}
                  height={r.h}
                  align="center"
                  verticalAlign="middle"
                  fill={c.label}
                  fontSize={14}
                  fontFamily="ui-monospace, Menlo, monospace"
                  listening={false}
                />
              </Group>
            )
          })}

          {draft && (
            <Rect
              x={draft.x}
              y={draft.y}
              width={draft.w}
              height={draft.h}
              stroke={c.accent}
              strokeWidth={1.5}
              dash={[6, 4]}
              listening={false}
            />
          )}

          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorSize={8}
            anchorCornerRadius={2}
            anchorFill={c.panel}
            anchorStroke={c.accent}
            borderStroke={c.accent}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < MIN_ROOM * scale || newBox.height < MIN_ROOM * scale
                ? oldBox
                : newBox
            }
          />
        </Layer>
      </Stage>
    </div>
  )
}