'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { QuotaDisplay } from '@/components/quota-display'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface QuotaData {
  weeklyLimit: number
  used: number
  remaining: number
  distributions: Array<{
    id: string
    amount: number
    vehicleType: string
    createdAt: string
    pump: { name: string; area: string }
  }>
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchQuota()
      generateQR()
    }
  }, [user, authLoading])

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/quota')
      const data = await res.json()
      if (data.success) setQuota(data.data)
    } catch (err) {
      console.error('Failed to fetch quota:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateQR = async () => {
    if (!user) return
    try {
      const qrData = JSON.stringify({ userId: user.id, phone: user.phone })
      const url = await QRCode.toDataURL(qrData, {
        width: 250,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      })
      setQrUrl(url)
    } catch (err) {
      console.error('Failed to generate QR:', err)
    }
  }

  if (authLoading || loading) return <><Navbar /><Loading /></>
  if (!user) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {user.name || user.phone}
            </h1>
            <p className="text-sm text-slate-500">{t('dashboard.title')}</p>
          </div>
          {(user.nidVerified || user.licenseVerified) && (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              {t('dashboard.verifiedBadge')}
            </span>
          )}
        </div>

        {/* Quota Card */}
        <Card>
          {quota ? (
            <QuotaDisplay used={quota.used} limit={quota.weeklyLimit} />
          ) : (
            <Loading />
          )}
          <p className="text-center text-xs text-slate-400 mt-3">{t('dashboard.weekResetsOn')}</p>
        </Card>

        {/* QR Code Card */}
        <Card title={t('dashboard.myQrCode')} subtitle={t('dashboard.qrInstruction')}>
          <div className="flex justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            ) : (
              <Loading />
            )}
          </div>
        </Card>

        {/* Recent History */}
        <Card title={t('dashboard.recentHistory')}>
          {quota && quota.distributions.length > 0 ? (
            <div className="space-y-3">
              {quota.distributions.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{d.pump.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(d.createdAt)}</p>
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
