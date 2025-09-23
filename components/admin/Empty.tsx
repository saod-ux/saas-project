import { Button } from '@/components/ui/button'

interface EmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function Empty({ icon, title, description, action, className = '' }: EmptyProps) {
  return (
    <div className={`card p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center">
          <div className="w-12 h-12 text-muted">
            {icon}
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted mb-6 max-w-sm mx-auto">{description}</p>
      )}
      
      {action && (
        <Button onClick={action.onClick} className="btn-primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}










