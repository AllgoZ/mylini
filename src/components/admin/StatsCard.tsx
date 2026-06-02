import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: 'clay' | 'sage' | 'blue' | 'amber' | 'red'
  loading?: boolean
}

const COLORS = {
  clay:  { bg: 'bg-[#FEF0EC]', icon: 'text-[#C4654A]', border: 'border-[#FDDDD4]' },
  sage:  { bg: 'bg-[#F0F4F0]', icon: 'text-[#5A6D5D]', border: 'border-[#D4E0D6]' },
  blue:  { bg: 'bg-[#EFF6FF]', icon: 'text-blue-600',   border: 'border-[#BFDBFE]' },
  amber: { bg: 'bg-[#FFFBEB]', icon: 'text-amber-600',  border: 'border-[#FDE68A]' },
  red:   { bg: 'bg-[#FEF2F2]', icon: 'text-red-500',    border: 'border-[#FECACA]' },
}

export function StatsCard({ title, value, sub, icon: Icon, color = 'clay', loading }: Props) {
  const c = COLORS[color]

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm animate-pulse">
        <div className="h-3 w-20 bg-[#F5F5F4] rounded mb-4" />
        <div className="h-8 w-28 bg-[#F5F5F4] rounded mb-2" />
        <div className="h-3 w-16 bg-[#F5F5F4] rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[0.8rem] font-semibold text-[#78716C] uppercase tracking-[0.05em]">{title}</span>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
          <Icon size={18} className={c.icon} strokeWidth={1.8} />
        </div>
      </div>
      <div className="font-head text-[1.9rem] font-bold text-[#1C1917] leading-none mb-1">{value}</div>
      {sub && <div className="text-[0.78rem] text-[#A8A29E] font-medium">{sub}</div>}
    </div>
  )
}
