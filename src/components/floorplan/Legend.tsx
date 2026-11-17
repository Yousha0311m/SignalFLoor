const ITEMS = [
  { label: 'Strong', dot: 'bg-strong' },
  { label: 'Fair', dot: 'bg-fair' },
  { label: 'Weak', dot: 'bg-weak' },
]

export default function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      {ITEMS.map(i => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${i.dot}`} />
          {i.label}
        </span>
      ))}
    </div>
  )
}