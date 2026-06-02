import { cn } from '@/lib/utils'

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid:       { label: 'Paid',       className: 'bg-purple-50 text-purple-700 border-purple-200' },
  processing: { label: 'Processing', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipped:    { label: 'Shipped',    className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  delivered:  { label: 'Delivered',  className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-50 text-red-600 border-red-200' },
  refunded:   { label: 'Refunded',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const PRODUCT_STATUS: Record<string, { label: string; className: string }> = {
  active:   { label: 'Active',   className: 'bg-green-50 text-green-700 border-green-200' },
  draft:    { label: 'Draft',    className: 'bg-gray-100 text-gray-600 border-gray-200' },
  archived: { label: 'Archived', className: 'bg-red-50 text-red-600 border-red-200' },
}

interface Props {
  status: string
  type?: 'order' | 'product'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, type = 'order', size = 'sm' }: Props) {
  const map = type === 'product' ? PRODUCT_STATUS : ORDER_STATUS
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }

  return (
    <span className={cn(
      'inline-flex items-center font-bold border rounded-full',
      size === 'sm' ? 'text-[0.7rem] px-2.5 py-0.5' : 'text-[0.8rem] px-3 py-1',
      s.className
    )}>
      {s.label}
    </span>
  )
}
