import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, Radar, Flame, FileText } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Floor Plans', to: '/floor-plans', icon: Map },
  { label: 'Scans', to: '/scans', icon: Radar },
  { label: 'Heatmap', to: '/heatmap', icon: Flame },
  { label: 'Reports', to: '/reports', icon: FileText },
]

export default function Sidebar() {
  return (
    <aside className="w-[232px] shrink-0 border-r border-line bg-panel flex flex-col">
      <div className="h-14 px-5 flex items-center border-b border-line font-semibold tracking-tight">
        Signal<span className="text-accent">Floor</span>
      </div>

      <nav className="p-3 flex flex-col gap-1">
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                isActive ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t border-line">
        <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Device</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-weak" />
          <span className="font-mono text-xs">ESP32 · offline</span>
        </div>
      </div>
    </aside>
  )
}