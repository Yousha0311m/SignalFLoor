import { useCallback, useEffect, useState } from 'react'
import type { ScanPoint } from '@/types'

const KEY = 'signalfloor.points'

function load(): ScanPoint[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ScanPoint[]) : []
  } catch {
    return []
  }
}

export function useScan() {
  const [points, setPoints] = useState<ScanPoint[]>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(points)) } catch { /* ignore */ }
  }, [points])

  const addPoint = useCallback((p: ScanPoint) => setPoints(ps => [...ps, p]), [])
  const clear = useCallback(() => setPoints([]), [])

  return { points, setPoints, addPoint, clear }
}