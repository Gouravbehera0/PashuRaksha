// ============================================================
// PASHURAKSHA (पशुरक्षा) — GLOBAL APPLICATION ERROR BOUNDARY
// Standard: React 19 / GIGW Accessibility / Resilient Government Platform
// "Detect Early. Prevent Outbreaks. Protect Livestock."
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  correlationId: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: '',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
    return {
      hasError: true,
      error,
      correlationId: `PR-ERR-${Date.now().toString(36).toUpperCase()}-${randomHex}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[PashuRaksha ErrorBoundary Intercepted]', {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReturnHome = () => {
    window.location.href = '/'
  }

  handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('pashuraksha_preview_role')
      sessionStorage.clear()
    } catch {
      // Ignore
    }
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, correlationId } = this.state

      return (
        <div className="min-h-screen bg-[#F3F5F1] text-[#102A43] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-2xl bg-[#F7F5EE] border-2 border-[#C62828] shadow-lg p-6 sm:p-8 rounded-none">
            {/* Government / Platform Identity Header */}
            <div className="flex items-center gap-3 border-b-2 border-[#123C2A]/20 pb-4 mb-5">
              <div className="w-12 h-12 bg-[#C62828]/10 border border-[#C62828] flex items-center justify-center text-[#C62828] shrink-0">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-[#1B5E3C] uppercase">
                  PASHURAKSHA LIVESTOCK SURVEILLANCE PLATFORM
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] leading-tight">
                  System Exception Intercepted
                </h1>
                <p className="text-xs text-[#555] font-medium">
                  सिस्टम अपवाद दर्ज किया गया — सुरक्षित रिकवरी उपलब्ध है
                </p>
              </div>
            </div>

            {/* Error Summary Banner */}
            <div className="bg-[#C62828]/10 border-l-4 border-[#C62828] p-4 mb-5">
              <p className="text-sm font-semibold text-[#C62828]">
                An unexpected interface error prevented this section from rendering normally.
              </p>
              <p className="text-xs text-[#444] mt-1">
                Your recorded livestock data and synchronizations remain safe in the persistent registry.
              </p>
              <div className="mt-2 text-xs font-mono text-[#102A43] bg-white/70 p-2 border border-[#C62828]/30">
                <span className="font-bold text-[#1B5E3C]">Incident ID / घटना पहचान संख्या:</span> {correlationId}
              </div>
            </div>

            {/* Technical Detail Collapsible (for debugging) */}
            {error && (
              <details className="mb-5 bg-white border border-[#123C2A]/20 p-3 text-xs">
                <summary className="font-bold text-[#123C2A] cursor-pointer select-none hover:underline">
                  View Technical Diagnostics / तकनीकी विवरण देखें
                </summary>
                <div className="mt-2 pt-2 border-t border-gray-200 overflow-x-auto font-mono text-gray-700 max-h-48">
                  <div className="text-[#C62828] font-semibold mb-1">{error.toString()}</div>
                  {errorInfo?.componentStack && (
                    <pre className="text-[11px] whitespace-pre-wrap leading-tight text-gray-600">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-[#1B5E3C] text-white text-sm font-bold tracking-wide uppercase hover:bg-[#123C2A] transition-colors border border-[#123C2A] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload View / पुनः लोड करें
              </button>

              <button
                type="button"
                onClick={this.handleReturnHome}
                className="px-4 py-2.5 bg-[#F7F5EE] text-[#102A43] text-sm font-bold tracking-wide uppercase hover:bg-gray-200 transition-colors border border-[#102A43]/30 flex items-center justify-center gap-2"
              >
                Safe Dashboard / सुरक्षित डैशबोर्ड
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="px-3 py-2.5 bg-transparent text-[#C62828] text-xs font-semibold hover:bg-[#C62828]/10 transition-colors border border-[#C62828]/40 flex items-center justify-center"
                title="Clears local session state and reloads"
              >
                Reset Session
              </button>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-5 pt-3 border-t border-[#123C2A]/10 text-center text-[11px] text-[#666]">
              Department of Animal Husbandry & Dairying • PashuRaksha Livestock Health Surveillance
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
