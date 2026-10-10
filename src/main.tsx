import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initializeSyncManager } from '@/services/offline'

// Initialize Stage 6 offline sync listener and indexedDB metadata
initializeSyncManager().catch((err) => {
  console.warn('[PashuRaksha] Offline Sync Manager init error:', err)
})

// Register Service Worker for offline application shell caching in production or supported browsers
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PashuRaksha] Service worker registration skipped:', err)
    })
  })
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a <div id="root"></div>')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
