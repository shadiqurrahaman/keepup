'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { useRouter } from 'next/navigation'

interface Distribution {
  id: string
  amount: number
  vehicleType: string
  createdAt: string
  user: { name: string; phone: string }
  pump: { name: string; area: string }
}

export default function AdminHistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'PUMP_ADMIN' && user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
      fetchHistory()
    }
  }, [user, authLoading, page])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/distributions?page=${page}&limit=20`)
      const data = await res.json()
      if (data.success) {
        setDistributions(data.data.distributions)
        setTotal(data.data.total)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <><Navbar /><Loading /></>
  if (!user) return null

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">{t('admin.history')}</h1>
          <span className="text-sm text-slate-500">{total} total</span>
        </div>

        <Card>
          {distributions.length > 0 ? (
            <div className="space-y-3">
              {distributions.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{d.user.name || d.user.phone}</p>
                    <p className="text-xs text-slate-400">{d.user.phone}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(d.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
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
            <p className="text-center text-sm text-slate-400 py-4">{t('common.noResults')}</p>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              {t('common.back')}
            </button>
            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
