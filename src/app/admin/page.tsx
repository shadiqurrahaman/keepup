'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { StatCard } from '@/components/stat-card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TodayData {
  distributions: Array<{
    id: string
    amount: number
    vehicleType: string
    createdAt: string
    user: { name: string; phone: string }
  }>
  total: number
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'PUMP_ADMIN' && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
      fetchToday()
    }
  }, [user, authLoading])

  const fetchToday = async () => {
    try {
      const res = await fetch('/api/distributions?today=true&limit=50')
      const data = await res.json()
      if (data.success) setTodayData(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <><Navbar /><Loading /></>
  if (!user) return null

  const totalToday = todayData?.distributions.reduce((s, d) => s + d.amount, 0) || 0
  const countToday = todayData?.distributions.length || 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">{t('admin.title')}</h1>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label={t('admin.todayDistributions')} value={countToday} color="blue" />
          <StatCard label={t('admin.totalDistributed')} value={`${totalToday.toFixed(1)}L`} color="green" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/distribute" className="flex flex-col items-center gap-2 bg-blue-600 text-white rounded-xl p-5 hover:bg-blue-700 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">{t('admin.distributeFuel')}</span>
          </Link>
          <Link href="/admin/distribute?scan=true" className="flex flex-col items-center gap-2 bg-indigo-600 text-white rounded-xl p-5 hover:bg-indigo-700 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-sm font-medium">{t('admin.scanQr')}</span>
          </Link>
        </div>

        {/* Today's distributions */}
        <Card title={t('admin.todayDistributions')}>
          {todayData && todayData.distributions.length > 0 ? (
            <div className="space-y-3">
              {todayData.distributions.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{d.user.name || d.user.phone}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{d.amount}L</p>
                    <p className="text-xs text-slate-400">{t(`vehicles.${d.vehicleType}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-4">{t('dashboard.noDistributions')}</p>
          )}
        </Card>
      </main>
    </div>
  )
}
