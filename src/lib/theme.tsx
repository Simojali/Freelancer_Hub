import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Theme provider — persists user choice in localStorage and applies the
 * `.dark` class on <html> so Tailwind's `dark:` variant + the existing
 * `.dark` CSS token block in index.css both take effect.
 *
 * Three values:
 *   - 'light' / 'dark': explicit user preference, persisted
 *   - 'system': follow OS `prefers-color-scheme` and re-react to changes
 */

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  /** What the user picked (may be 'system'). */
  theme: Theme
  /** What is actually applied right now ('light' | 'dark'). */
  resolvedTheme: ResolvedTheme
  setTheme: (t: Theme) => void
  /** Toggle between light and dark (collapses 'system' into the opposite of what's currently applied). */
  toggleTheme: () => void
}

const STORAGE_KEY = 'fh-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPref(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const v = window.localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return 'system'
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  // Tell the browser so native form controls (date inputs, scrollbars) match.
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    readStoredTheme() === 'system' ? getSystemPref() : (readStoredTheme() as ResolvedTheme),
  )

  // Apply on mount + whenever the user-selected theme changes.
  useEffect(() => {
    const next: ResolvedTheme = theme === 'system' ? getSystemPref() : theme
    setResolvedTheme(next)
    applyTheme(next)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // When following the system, re-react to OS-level changes.
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next: ResolvedTheme = mql.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      applyTheme(next)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState(resolvedTheme === 'dark' ? 'light' : 'dark'),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
