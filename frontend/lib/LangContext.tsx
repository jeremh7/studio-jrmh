'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from './i18n'

type LangContextType = {
  locale: Locale
  t: typeof translations['fr']
  toggle: () => void
}

const LangContext = createContext<LangContextType>({
  locale: 'fr',
  t: translations.fr,
  toggle: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('fr')

  const toggle = useCallback(() => {
    setLocale(prev => prev === 'fr' ? 'en' : 'fr')
  }, [])

  return (
    <LangContext.Provider value={{ locale, t: translations[locale] as typeof translations['fr'], toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
