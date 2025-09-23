interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  className?: string
}

export function StatCard({ label, value, sublabel, className = '' }: StatCardProps) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="text-sm font-medium text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold text-ink mb-1">{value}</div>
      {sublabel && (
        <div className="text-xs text-muted">{sublabel}</div>
      )}
    </div>
  )
}


