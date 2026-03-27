'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { useRouter } from 'next/navigation'

interface UserItem {
  id: string
  phone: string
  name: string | null
  role: string
  nid: string | null
  nidVerified: boolean
  licensePlate: string | null
  licenseVerified: boolean
  createdAt: string
}

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
      fetchUsers()
    }
  }, [user, authLoading, page])

  const fetchUsers = async (phone?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (phone || searchPhone) params.set('phone', phone || searchPhone)
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
        setTotal(data.data.total)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(searchPhone)
  }

  if (authLoading) return <><Navbar /><Loading /></>
  if (!user) return null

  const totalPages = Math.ceil(total / 20)

  const roleColors: Record<string, string> = {
    USER: 'bg-slate-100 text-slate-600',
    PUMP_ADMIN: 'bg-blue-100 text-blue-700',
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-800">{t('superAdmin.manageUsers')}</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder={t('admin.searchUser')}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800"
          />
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            {t('common.search')}
          </button>
        </form>

        <p className="text-sm text-slate-500">{total} {t('superAdmin.totalUsers').toLowerCase()}</p>

        {loading ? <Loading /> : (
          <>
            {users.map((u) => (
              <Card key={u.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{u.name || 'N/A'}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${roleColors[u.role] || ''}`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{u.phone}</p>
                    {u.nid && <p className="text-xs text-slate-400">NID: {u.nid} {u.nidVerified ? '✓' : ''}</p>}
                    {u.licensePlate && <p className="text-xs text-slate-400">Plate: {u.licensePlate} {u.licenseVerified ? '✓' : ''}</p>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-slate-400">{t('common.noResults')}</div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50">
                  {t('common.back')}
                </button>
                <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-50">
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
