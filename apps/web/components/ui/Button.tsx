import { type ComponentProps } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'bg-transparent border border-border text-foreground hover:bg-card-hover',
  ghost: 'bg-transparent text-muted-foreground hover:bg-card-hover hover:text-foreground',
  danger: 'bg-danger-subtle text-danger border border-danger/20 hover:bg-danger/10',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg font-medium transition-colors active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 ${className}`}
      style={{ transitionProperty: 'background-color, color, transform', transitionDuration: '160ms' }}
      {...props}
    />
  )
}
