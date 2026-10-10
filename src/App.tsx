import { AuthProvider } from '@/hooks/useAuth'
import { I18nProvider } from '@/i18n/I18nContext'
import { AppRouter } from '@/routes/AppRouter'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
