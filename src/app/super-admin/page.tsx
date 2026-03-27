'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Loading } from '@/components/loading'
import { StatCard } from '@/components/stat-card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  totalPumps: number
  totalUsers: number
  totalDistributions: number
  weeklyDistributions: number
  weeklyVolume: number
}

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
      fetchStats()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <><Navbar /><Loading /></>
  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">{t('superAdmin.title')}</h1>

        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('superAdmin.totalPumps')} value={stats.totalPumps} color="blue" />
            <StatCard label={t('superAdmin.totalUsers')} value={stats.totalUsers} color="green" />
            <StatCard label={`${t('superAdmin.totalDistributions')} (${t('superAdmin.thisWeek')})`} value={stats.weeklyDistributions} color="amber" />
            <StatCard label={`Volume (${t('superAdmin.thisWeek')})`} value={`${stats.weeklyVolume.toFixed(1)}L`} color="purple" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/super-admin/pumps" className="flex flex-col items-center gap-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl p-5 hover:bg-blue-50 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium">{t('superAdmin.managePumps')}</span>
          </Link>
          <Link href="/super-admin/users" className="flex flex-col items-center gap-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl p-5 hover:bg-emerald-50 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-sm font-medium">{t('superAdmin.manageUsers')}</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
