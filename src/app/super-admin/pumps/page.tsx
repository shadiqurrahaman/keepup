'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { useRouter } from 'next/navigation'

interface Pump {
  id: string
  name: string
  location: string
  area: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
  admins: Array<{ id: string; user: { name: string; phone: string } }>
  _count: { distributions: number }
}

export default function ManagePumpsPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [pumps, setPumps] = useState<Pump[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [assignPumpId, setAssignPumpId] = useState<string | null>(null)
  const [adminPhone, setAdminPhone] = useState('')
  const [form, setForm] = useState({ name: '', location: '', area: '', latitude: '', longitude: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return }
      if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return }
      fetchPumps()
    }
  }, [user, authLoading])

  const fetchPumps = async () => {
    try {
      const res = await fetch('/api/pumps')
      const data = await res.json()
      if (data.success) setPumps(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePump = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/pumps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(t('common.success'))
        setShowCreateForm(false)
        setForm({ name: '', location: '', area: '', latitude: '', longitude: '' })
        fetchPumps()
      } else {
        setError(data.error)
      }
    } catch {
      setError(t('common.error'))
    }
  }

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignPumpId) return
    setError('')
    try {
      const res = await fetch(`/api/pumps/${assignPumpId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: adminPhone }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(t('common.success'))
        setAssignPumpId(null)
        setAdminPhone('')
        fetchPumps()
      } else {
        setError(data.error)
      }
    } catch {
      setError(t('common.error'))
    }
  }

  const handleRemoveAdmin = async (pumpId: string, userId: string) => {
    try {
      const res = await fetch(`/api/pumps/${pumpId}/admins`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.success) fetchPumps()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePumpActive = async (pumpId: string, isActive: boolean) => {
    try {
      await fetch(`/api/pumps/${pumpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      fetchPumps()
    } catch (err) {
      console.error(err)
    }
  }

  if (authLoading || loading) return <><Navbar /><Loading /></>
  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">{t('superAdmin.managePumps')}</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? t('common.cancel') : t('superAdmin.createPump')}
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600">{success}</div>}

        {/* Create Pump Form */}
        {showCreateForm && (
          <Card title={t('superAdmin.createPump')}>
            <form onSubmit={handleCreatePump} className="space-y-3">
              <input type="text" placeholder={t('superAdmin.pumpName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" required />
              <input type="text" placeholder={t('superAdmin.pumpLocation')} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" required />
              <input type="text" placeholder={t('superAdmin.pumpArea')} value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder={t('superAdmin.latitude')} value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" />
                <input type="text" placeholder={t('superAdmin.longitude')} value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">{t('common.save')}</button>
            </form>
          </Card>
        )}

        {/* Assign Admin Modal */}
        {assignPumpId && (
          <Card title={t('superAdmin.assignAdmin')}>
            <form onSubmit={handleAssignAdmin} className="flex gap-2">
              <input type="tel" placeholder={t('superAdmin.adminPhone')} value={adminPhone} onChange={e => setAdminPhone(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800" required />
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">{t('common.save')}</button>
              <button type="button" onClick={() => setAssignPumpId(null)} className="px-5 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50">{t('common.cancel')}</button>
            </form>
          </Card>
        )}

        {/* Pump List */}
        {pumps.map((pump) => (
          <Card key={pump.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{pump.name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${pump.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {pump.isActive ? t('superAdmin.active') : t('superAdmin.inactive')}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{pump.location}, {pump.area}</p>
                <p className="text-xs text-slate-400 mt-1">{pump._count.distributions} {t('superAdmin.totalDistributions').toLowerCase()}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePumpActive(pump.id, pump.isActive)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 9v2m0 4h.01" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Admins */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500 uppercase">Admins</p>
                <button onClick={() => setAssignPumpId(pump.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  + {t('superAdmin.assignAdmin')}
                </button>
              </div>
              {pump.admins.length > 0 ? (
                <div className="space-y-1">
                  {pump.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-sm text-slate-700">{admin.user.name || admin.user.phone}</span>
                        <span className="text-xs text-slate-400 ml-2">{admin.user.phone}</span>
                      </div>
                      <button onClick={() => handleRemoveAdmin(pump.id, admin.id)} className="text-xs text-red-500 hover:text-red-600">
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No admins assigned</p>
              )}
            </div>
          </Card>
        ))}

        {pumps.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>{t('common.noResults')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
