import { useCallback, useEffect, useState } from 'react'
import type { Room } from '@/types'

const KEY = 'signalfloor.rooms'

function load(): Room[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Room[]) : []
  } catch {
    return []
  }
}

export function useFloor() {
  const [rooms, setRooms] = useState<Room[]>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(rooms)) } catch { /* ignore */ }
  }, [rooms])

  const addRoom = useCallback((rect: Omit<Room, 'id' | 'name'>) => {
    const id = crypto.randomUUID()
    setRooms(rs => [...rs, { id, name: `Room ${rs.length + 1}`, ...rect }])
    return id
  }, [])

  const updateRoom = useCallback((id: string, patch: Partial<Room>) => {
    setRooms(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const removeRoom = useCallback((id: string) => {
    setRooms(rs => rs.filter(r => r.id !== id))
  }, [])

  return { rooms, setRooms, addRoom, updateRoom, removeRoom }
}