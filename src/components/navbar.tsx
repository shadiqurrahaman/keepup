'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'

export function Navbar() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = () => {
    if (!user) return []

    switch (user.role) {
      case 'USER':
        return [
          { href: '/dashboard', label: t('nav.dashboard') },
        ]
      case 'PUMP_ADMIN':
        return [
          { href: '/admin', label: t('nav.admin') },
          { href: '/admin/distribute', label: t('nav.distribute') },
          { href: '/admin/history', label: t('nav.history') },
        ]
      case 'SUPER_ADMIN':
        return [
          { href: '/super-admin', label: t('nav.superAdmin') },
          { href: '/super-admin/pumps', label: t('nav.pumps') },
          { href: '/super-admin/users', label: t('nav.users') },
        ]
      default:
        return []
    }
  }

  return (
    <nav className="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={user ? (user.role === 'USER' ? '/dashboard' : user.role === 'PUMP_ADMIN' ? '/admin' : '/super-admin') : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <span className="font-bold text-lg">{t('app.name')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
              className="px-2 py-1 text-xs bg-blue-700 rounded-md hover:bg-blue-600 transition-colors"
            >
              {locale === 'en' ? 'বাংলা' : 'English'}
            </button>

            {user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md hover:bg-blue-700 transition-colors md:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

            {/* Desktop nav */}
            {user && (
              <div className="hidden md:flex items-center gap-4">
                {navLinks().map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm hover:text-blue-200 transition-colors">
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="text-sm px-3 py-1.5 bg-red-600 rounded-md hover:bg-red-500 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}

            {!user && (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm px-3 py-1.5 hover:text-blue-200 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="text-sm px-3 py-1.5 bg-white text-blue-800 rounded-md hover:bg-blue-50 transition-colors font-medium">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && user && (
          <div className="md:hidden pb-4 border-t border-blue-700 mt-2 pt-2">
            <div className="flex flex-col gap-1">
              {navLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="mt-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-blue-700 rounded-md transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
