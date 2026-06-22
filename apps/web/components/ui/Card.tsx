import { type ComponentProps } from 'react'

type CardPadding = 'sm' | 'md' | 'lg'

interface CardProps extends ComponentProps<'div'> {
  padding?: CardPadding
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ padding = 'lg', className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-xl ${paddingClasses[padding]} ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`mb-4 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: ComponentProps<'h2'>) {
  return <h2 className={`text-sm font-semibold text-foreground ${className}`} {...props} />
}
