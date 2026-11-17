export interface Room {
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
}

export interface ScanPoint {
  id: number
  x: number
  y: number
  rssi: number
  ssid: string
  bssid: string
  timestamp: string // ISO string
}