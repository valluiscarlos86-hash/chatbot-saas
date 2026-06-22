import { type ComponentProps } from 'react'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger'
type BadgeSize = 'sm' | 'md'

interface BadgeProps extends ComponentProps<'span'> {
  variant?: BadgeVariant
  size?: BadgeSize
  pulse?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-card-hover text-muted-foreground',
  success: 'bg-accent-subtle text-accent-on-surface',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
}

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-subtle-foreground',
  success: 'bg-accent-on-surface',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {pulse && <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${dotClasses[variant]}`} />}
      {children}
    </span>
  )
}
