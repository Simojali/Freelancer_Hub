import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { PrivacyProvider } from '@/lib/privacy'

// Toaster pulls its own theme so sonner notifications match the rest of the chrome.
function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster position="bottom-right" richColors closeButton theme={resolvedTheme} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PrivacyProvider>
        <BrowserRouter>
          <App />
          <ThemedToaster />
        </BrowserRouter>
      </PrivacyProvider>
    </ThemeProvider>
  </StrictMode>,
)
