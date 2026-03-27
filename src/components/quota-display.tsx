'use client'

import { useI18n } from '@/lib/i18n'

interface QuotaDisplayProps {
  used: number
  limit: number
  size?: 'sm' | 'lg'
}

export function QuotaDisplay({ used, limit, size = 'lg' }: QuotaDisplayProps) {
  const { t } = useI18n()
  const remaining = Math.max(0, limit - used)
  const percentage = Math.min(100, (used / limit) * 100)

  const getColor = () => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getTextColor = () => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 70) return 'text-amber-600'
    return 'text-emerald-600'
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getColor()}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className={`text-xs font-medium ${getTextColor()}`}>
          {remaining.toFixed(1)}L
        </span>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9155" fill="none"
            stroke={percentage >= 100 ? '#dc2626' : percentage >= 70 ? '#d97706' : '#059669'}
            strokeWidth="3"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getTextColor()}`}>{remaining.toFixed(1)}</span>
          <span className="text-xs text-slate-500">{t('dashboard.liters')}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('dashboard.used')}</span>
          <span className="font-medium">{used.toFixed(1)}L</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('dashboard.weeklyLimit')}</span>
          <span className="font-medium">{limit}L</span>
        </div>
      </div>
      {percentage >= 100 && (
        <p className="mt-2 text-xs text-red-600 font-medium bg-red-50 rounded-lg py-1.5 px-3">
          {t('dashboard.quotaExhausted')}
        </p>
      )}
    </div>
  )
}
