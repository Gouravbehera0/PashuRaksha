/**
 * PASHURAKSHA (पशुरक्षा) — UNIFIED PAGE HEADER COMPONENT
 * "Detect Early. Prevent Outbreaks. Protect Livestock."
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`mb-5 sm:mb-6 ${className}`}>
      {/* Optional Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2.5">
          <ol className="flex items-center flex-wrap gap-1.5 text-[11px] font-mono text-gray-500">
            <li className="flex items-center gap-1">
              <Link
                to="/dashboard"
                className="hover:text-[#1B5E3C] transition-colors flex items-center gap-1 text-gray-500"
              >
                <Home size={12} />
                <span>PashuRaksha</span>
              </Link>
            </li>
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <ChevronRight size={11} className="text-gray-400 shrink-0" />
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-[#1B5E3C] transition-colors text-gray-600 font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#102A43] font-bold" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102A43] font-sans truncate">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2 shrink-0 pt-1 sm:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
