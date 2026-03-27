'use client'

import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/lib/i18n'
import { PWARegister } from '@/components/pwa-register'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <PWARegister />
        {children}
      </AuthProvider>
    </I18nProvider>
  )
}
