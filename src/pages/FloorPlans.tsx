import { useEffect, useState } from 'react'
import { MousePointer2, Square, Trash2 } from 'lucide-react'
import FloorPlanCanvas, { type Mode } from '@/components/floorplan/FloorPlanCanvas'
import { useFloor } from '@/hooks/useFloor'
import { ROOMS } from '@/lib/mock'

export default function FloorPlans() {
  const { rooms, setRooms, addRoom, updateRoom, removeRoom } = useFloor()
  const [mode, setMode] = useState<Mode>('draw')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = rooms.find(r => r.id === selectedId) ?? null

  const remove = (id: string) => {
    removeRoom(id)
    setSelectedId(null)
  }

  // Delete / Backspace removes the selected room (unless you're typing in an input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeRoom(selectedId)
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, removeRoom])

  const toolBtn = (m: Mode, label: string, Icon: typeof Square) => (
    <button
      onClick={() => setMode(m)}
      className={`h-9 px-3 rounded-md text-sm flex items-center gap-2 border ${
        mode === m
          ? 'bg-accent text-bg border-accent font-medium'
          : 'bg-panel border-line text-muted hover:text-ink'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )

  return (
    <div className="grid grid-cols-[1fr_320px] gap-4">
      {/* canvas panel */}
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          {toolBtn('select', 'Select', MousePointer2)}
          {toolBtn('draw', 'Draw room', Square)}
          <p className="ml-auto text-xs text-muted">
            {mode === 'draw'
              ? 'Drag on the canvas to draw a room'
              : 'Click to select · drag to move · handles to resize · Del to delete'}
          </p>
        </div>
        <FloorPlanCanvas
          rooms={rooms}
          selectedId={selectedId}
          mode={mode}
          onSelect={setSelectedId}
          onAdd={addRoom}
          onUpdate={updateRoom}
        />
      </div>

      {/* right rail */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-3">
            Rooms · {rooms.length}
          </p>

          {rooms.length === 0 ? (
            <div className="text-sm text-muted">
              <p className="mb-3">No rooms yet. Draw one, or start from a sample.</p>
              <button
                onClick={() => setRooms(ROOMS)}
                className="h-9 px-3 rounded-md border border-line text-ink hover:bg-panel-2"
              >
                Load sample layout
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {rooms.map(r => (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      setMode('select')
                      setSelectedId(r.id)
                    }}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-md text-sm text-left ${
                      r.id === selectedId ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="font-mono text-xs">{r.w}×{r.h}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Selected room</p>
            <label className="text-xs text-muted">Name</label>
            <input
              value={selected.name}
              onChange={e => updateRoom(selected.id, { name: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-accent"
            />
            <p className="font-mono text-xs text-muted mt-3">
              x {selected.x} · y {selected.y} · {selected.w}×{selected.h}
            </p>
            <button
              onClick={() => remove(selected.id)}
              className="mt-4 h-9 px-3 rounded-md border border-line text-weak text-sm flex items-center gap-2 hover:bg-panel-2"
            >
              <Trash2 size={15} />
              Delete room
            </button>
          </div>
        )}
      </div>
    </div>
  )
}