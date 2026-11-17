interface Props {
  label: string
  value: string | number
  unit?: string
}

export default function StatCard({ label, value, unit }: Props) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-semibold mt-1">
        {value}
        {unit && <span className="text-sm text-muted font-normal ml-1">{unit}</span>}
      </p>
    </div>
  )
}