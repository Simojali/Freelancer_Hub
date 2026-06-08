import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Privacy mode — when on, every element with `data-private` is blurred and
 * un-selectable. Used to hide money values when screen-sharing, recording,
 * or working in public. Persists in localStorage so toggling survives reloads.
 *
 * The actual blur is CSS-driven (src/index.css → `html.privacy-on [data-private]`).
 * This provider just toggles the class on <html> and exposes the state.
 */

type PrivacyContextValue = {
  isPrivate: boolean
  toggle: () => void
  setPrivate: (v: boolean) => void
}

const STORAGE_KEY = 'fh-privacy'
const PrivacyContext = createContext<PrivacyContextValue | null>(null)

function readStored(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

function apply(on: boolean) {
  document.documentElement.classList.toggle('privacy-on', on)
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivate, setIsPrivate] = useState<boolean>(() => readStored())

  useEffect(() => {
    apply(isPrivate)
    window.localStorage.setItem(STORAGE_KEY, isPrivate ? '1' : '0')
  }, [isPrivate])

  const value: PrivacyContextValue = {
    isPrivate,
    toggle: () => setIsPrivate(v => !v),
    setPrivate: setIsPrivate,
  }

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used inside <PrivacyProvider>')
  return ctx
}
