import type { AnimalType } from '@/types'

interface AnimalIconProps {
  type: AnimalType | string
  className?: string
  size?: number
}

/**
 * Institutional vector SVG silhouettes for livestock species.
 * Clean, government-grade iconography (no cartoon illustrations).
 */
export function AnimalIcon({ type, className = 'w-5 h-5', size }: AnimalIconProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined
  const normalized = (type || '').toLowerCase()

  if (normalized.includes('buf') || normalized.includes('buffalo') || normalized.includes('भैंस')) {
    // Water Buffalo Silhouette
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
        aria-label="Buffalo"
      >
        <path d="M21 9.5c-.3-.8-1.1-1.3-2-1.3h-1.2l-.7-1.4c-.4-.8-1.2-1.3-2.1-1.3H9c-.8 0-1.6.4-2 1.1L5.8 9H3.5C2.7 9 2 9.7 2 10.5v2c0 .8.7 1.5 1.5 1.5H4v4c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-3.5h3V18c0 .6.4 1 1 1H13c.6 0 1-.4 1-1v-3.5h3.5c.8 0 1.5-.7 1.5-1.5v-1l1.6-.7c.6-.2 1-.8.9-1.4-.1-.5-.1-.7-.5-.9zM17 11.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
      </svg>
    )
  }

  if (normalized.includes('goat') || normalized.includes('बकरी') || normalized.includes('bakri')) {
    // Goat Silhouette
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
        aria-label="Goat"
      >
        <path d="M19.5 8c-.4-.7-1.1-1.2-1.9-1.2h-.8l-.5-1.2c-.3-.7-1-1.1-1.8-1.1h-4c-.7 0-1.3.4-1.6 1L8 7H6c-.8 0-1.5.7-1.5 1.5v2c0 .8.7 1.5 1.5 1.5h.5V17c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-4h3V17c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-4h1.5c.8 0 1.5-.7 1.5-1.5v-1.5l1.2-.8c.4-.3.6-.8.5-1.2z" />
      </svg>
    )
  }

  if (normalized.includes('sheep') || normalized.includes('भेड़') || normalized.includes('bhed')) {
    // Sheep Silhouette
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
        aria-label="Sheep"
      >
        <path d="M19 10c0-1.1-.9-2-2-2h-1c-.2-.8-.9-1.5-1.8-1.5h-4.4c-.9 0-1.6.7-1.8 1.5H7c-1.1 0-2 .9-2 2v2c0 .9.6 1.7 1.5 1.9V18c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-3h4v3c0 .6.4 1 1 1H17c.6 0 1-.4 1-1v-4.1c.9-.2 1.5-1 1.5-1.9v-2z" />
      </svg>
    )
  }

  if (normalized.includes('poultry') || normalized.includes('मुर्गी') || normalized.includes('chicken')) {
    // Poultry Silhouette
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
        aria-label="Poultry"
      >
        <path d="M18.5 9c-.3-.9-1.1-1.5-2.1-1.5h-.7L15 6c-.3-.6-.9-1-1.6-1h-2.8c-.8 0-1.5.5-1.7 1.2L8 8H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-2h2v2c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3h1.5c1.1 0 2-.9 2-2V9.5c0-.2 0-.4-.1-.5z" />
      </svg>
    )
  }

  // Default: Cattle / Cow Silhouette
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-label="Cow"
    >
      <path d="M20.5 8.5c-.3-.8-1.1-1.3-2-1.3h-1.3l-.6-1.5c-.4-.9-1.2-1.4-2.2-1.4H8.5c-.9 0-1.7.5-2.1 1.3L5.3 8H3.5C2.7 8 2 8.7 2 9.5v2.5c0 .8.7 1.5 1.5 1.5H4v4c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-3.5h4V17c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-3.5H17c.8 0 1.5-.7 1.5-1.5v-1l1.5-.7c.5-.3.8-.8.7-1.4-.1-.6-.1-.8-.2-.9zM16.5 11c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
    </svg>
  )
}
