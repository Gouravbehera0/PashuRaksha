import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  let variantStyle = 'bg-forest-100 text-forest-800 border-forest-300'

  if (variant === 'secondary') {
    variantStyle = 'bg-amber-100 text-amber-800 border-amber-300'
  } else if (variant === 'destructive') {
    variantStyle = 'bg-red-100 text-red-800 border-red-300'
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent text-forest-900 border-forest-300'
  } else if (variant === 'success') {
    variantStyle = 'bg-green-100 text-green-800 border-green-300'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantStyle} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
