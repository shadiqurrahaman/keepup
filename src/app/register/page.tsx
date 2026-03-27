'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const { register } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [form, setForm] = useState({
    phone: '', password: '', confirmPassword: '', name: '', nid: '', licensePlate: ''
  })
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCode, setDevCode] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data.devCode) setDevCode(data.data.devCode)
        if (data.data.tempCode) setDevCode(data.data.tempCode)
        setStep('otp')
      } else {
        setError(data.error)
      }
    } catch {
      setError(t('common.error'))
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register({
      phone: form.phone,
      password: form.password,
      name: form.name,
      nid: form.nid || undefined,
      licensePlate: form.licensePlate || undefined,
      otpCode,
    })

    if (result.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError(result.error || t('common.error'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('auth.registerTitle')}</h1>
            <p className="text-slate-500 mt-1">{t('auth.registerSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 'info' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.name')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.phone')} *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={t('auth.phonePlaceholder')}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.password')} *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.confirmPassword')} *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.nid')}</label>
                <input
                  type="text"
                  value={form.nid}
                  onChange={(e) => setForm({ ...form, nid: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.licensePlate')}</label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('common.next')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <p className="text-center text-sm text-slate-500 mb-4">{t('auth.otpSent')}: {form.phone}</p>

              {devCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  DEV Mode - OTP Code: <strong>{devCode}</strong>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.otpCode')}</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-2xl tracking-widest text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('auth.signUp')}
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-slate-500">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
