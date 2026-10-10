import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className = '',
  variant = 'default',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  let variantStyle = 'bg-forest-700 text-white hover:bg-forest-800 border-transparent shadow-xs'

  if (variant === 'outline') {
    variantStyle = 'border border-forest-300 bg-white text-forest-900 hover:bg-forest-50'
  } else if (variant === 'secondary') {
    variantStyle = 'bg-stone-100 text-stone-900 hover:bg-stone-200 border-stone-200'
  } else if (variant === 'destructive') {
    variantStyle = 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow-xs'
  } else if (variant === 'ghost') {
    variantStyle = 'bg-transparent text-forest-900 hover:bg-forest-50 border-transparent'
  }

  let sizeStyle = 'px-3 py-1.5 text-xs'
  if (size === 'sm') {
    sizeStyle = 'px-2.5 py-1 text-[11px]'
  } else if (size === 'lg') {
    sizeStyle = 'px-4 py-2.5 text-sm font-semibold'
  }

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
