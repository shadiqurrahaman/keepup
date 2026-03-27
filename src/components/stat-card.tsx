interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
}

const iconColorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
}

export function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
