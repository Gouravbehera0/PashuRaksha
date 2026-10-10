/**
 * PASHURAKSHA (पशुरक्षा) — UNIFIED EMPTY STATE COMPONENT
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`
        p-8 sm:p-12 text-center bg-white rounded-lg border border-gray-200 shadow-xs
        flex flex-col items-center justify-center max-w-lg mx-auto my-6
        ${className}
      `}
    >
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1B5E3C] mb-4 shadow-2xs">
        {icon || (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#102A43] tracking-tight mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="flex items-center flex-wrap justify-center gap-3">
          {action && (
            action.href ? (
              <a
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                {action.icon}
                <span>{action.label}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E3C] hover:bg-[#123C2A] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                {secondaryAction.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
