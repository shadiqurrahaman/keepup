'use client'

import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { QuotaDisplay } from '@/components/quota-display'
import { useRouter, useSearchParams } from 'next/navigation'

interface FoundUser {
  id: string
  phone: string
  name: string | null
  nid: string | null
  nidVerified: boolean
  licensePlate: string | null
  licenseVerified: boolean
  quota: {
    weeklyLimit: number
    used: number
    remaining: number
  }
}

export default function DistributePageWrapper() {
  return (
    <Suspense fallback={<><Navbar /><Loading /></>}>
      <DistributePage />
    </Suspense>
  )
}

function DistributePage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchPhone, setSearchPhone] = useState('')
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null)
  const [amount, setAmount] = useState('')
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE')
  const [searching, setSearching] = useState(false)
  const [distributing, setDistributing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanMode, setScanMode] = useState(searchParams.get('scan') === 'true')

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'PUMP_ADMIN' && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    setFoundUser(null)
    setSearching(true)

    try {
      const res = await fetch(`/api/users/search?phone=${encodeURIComponent(searchPhone)}`)
      const data = await res.json()
      if (data.success) {
        setFoundUser(data.data)
      } else {
        setError(data.error || t('admin.userNotFound'))
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setSearching(false)
    }
  }

  const handleQrScan = async (scannedData: string) => {
    try {
      const parsed = JSON.parse(scannedData)
      if (parsed.userId) {
        const res = await fetch(`/api/users/${parsed.userId}`)
        const data = await res.json()
        if (data.success) {
          setFoundUser(data.data)
          setScanMode(false)
        } else {
          setError(t('admin.userNotFound'))
        }
      }
    } catch {
      // Try as phone number
      setSearchPhone(scannedData)
      handleSearch()
    }
  }

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foundUser) return
    setError('')
    setSuccess('')
    setDistributing(true)

    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: foundUser.id,
          amount: parseFloat(amount),
          vehicleType,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(t('admin.distributionSuccess'))
        setFoundUser(null)
        setSearchPhone('')
        setAmount('')
      } else {
        setError(data.error)
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setDistributing(false)
    }
  }

  if (authLoading) return <><Navbar /><Loading /></>
  if (!user) return null

  const vehicleTypes = ['MOTORCYCLE', 'CAR', 'TRUCK', 'CNG', 'OTHER']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">{t('admin.distributeFuel')}</h1>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Toggle between search and scan */}
        <div className="flex gap-2">
          <button
            onClick={() => setScanMode(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${!scanMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
          >
            {t('admin.searchUser')}
          </button>
          <button
            onClick={() => setScanMode(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${scanMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
          >
            {t('admin.scanQr')}
          </button>
        </div>

        {/* Search Mode */}
        {!scanMode && (
          <Card>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={t('auth.phonePlaceholder')}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
              />
              <button
                type="submit"
                disabled={searching || !searchPhone}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {searching ? '...' : t('common.search')}
              </button>
            </form>
          </Card>
        )}

        {/* Scan Mode */}
        {scanMode && (
          <Card title={t('admin.scanQr')}>
            <div className="bg-slate-100 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm text-slate-500 mb-3">Camera-based QR scanning requires HTTPS</p>
              <p className="text-xs text-slate-400 mb-4">{t('admin.orSearchPhone')}</p>
              {/* Manual QR data input for testing */}
              <input
                type="text"
                placeholder="Paste QR data or User ID"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQrScan((e.target as HTMLInputElement).value)
                  }
                }}
              />
            </div>
          </Card>
        )}

        {/* Found User */}
        {foundUser && (
          <>
            <Card title={t('admin.userFound')}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{foundUser.name || 'N/A'}</p>
                    <p className="text-sm text-slate-500">{foundUser.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    {foundUser.nidVerified && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">NID</span>
                    )}
                    {foundUser.licenseVerified && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">License</span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <QuotaDisplay used={foundUser.quota.used} limit={foundUser.quota.weeklyLimit} size="sm" />
                  <p className="text-xs text-slate-500 mt-2">
                    {t('admin.remainingQuota')}: <strong>{foundUser.quota.remaining.toFixed(1)}L</strong>
                  </p>
                </div>
              </div>
            </Card>

            {foundUser.quota.remaining > 0 && (
              <Card title={t('admin.distributeFuel')}>
                <form onSubmit={handleDistribute} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('admin.vehicleType')}</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                    >
                      {vehicleTypes.map((vt) => (
                        <option key={vt} value={vt}>{t(`vehicles.${vt}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('admin.amount')}</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0.1"
                      max={foundUser.quota.remaining}
                      step="0.1"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">Max: {foundUser.quota.remaining.toFixed(1)}L</p>
                  </div>

                  <button
                    type="submit"
                    disabled={distributing || !amount || parseFloat(amount) <= 0}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {distributing ? t('common.loading') : t('admin.confirmDistribution')}
                  </button>
                </form>
              </Card>
            )}

            {foundUser.quota.remaining <= 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-red-600 font-medium">{t('admin.exceedsLimit')}</p>
                <p className="text-sm text-red-500 mt-1">{t('dashboard.quotaExhausted')}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
