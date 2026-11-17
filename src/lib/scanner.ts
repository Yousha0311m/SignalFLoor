import type { Room } from '@/types'
import { inRoom } from '@/lib/analytics'

const PX_PER_METER = 50   // 1000px canvas ≈ 20m
const WALL_PENALTY = 8    // dB lost when the router is in a different room

// MOCK ONLY: pretend the router sits in the middle of the first room you drew
export function mockRouter(rooms: Room[]) {
  const r = rooms[0]
  return r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : { x: 100, y: 100 }
}

export async function simulateScan(x: number, y: number, rooms: Room[], delay = 900) {
  await new Promise(res => setTimeout(res, delay))

  const router = mockRouter(rooms)
  const meters = Math.max(Math.hypot(x - router.x, y - router.y) / PX_PER_METER, 1)

  const routerRoom = rooms.find(r => inRoom(router, r))
  const here = rooms.find(r => inRoom({ x, y }, r))
  const walls = routerRoom && here && routerRoom.id !== here.id ? WALL_PENALTY : 0

  const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 4
  const rssi = Math.round(-40 - 30 * Math.log10(meters) - walls + noise)

  return {
    rssi: Math.max(-95, Math.min(-30, rssi)),
    ssid: 'HomeNet',
    bssid: 'A4:2B:B0:11:22:33',
  }
}