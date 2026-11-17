import ThemeToggle from './ThemeToggle'

export default function Topbar() {
  return (
    <header className="h-14 shrink-0 border-b border-line bg-panel px-6 flex items-center justify-between">
      <div className="text-sm text-muted">
        Home <span className="mx-1">/</span> <span className="text-ink">Ground Floor</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="h-9 px-3 rounded-md border border-line bg-panel text-sm hover:bg-panel-2">
          Connect ESP32
        </button>
        <button className="h-9 px-3 rounded-md bg-accent text-bg text-sm font-medium">
          Start Scan
        </button>
      </div>
    </header>
  )
}