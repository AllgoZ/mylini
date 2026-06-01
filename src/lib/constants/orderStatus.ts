import type { OrderStatus } from '@/types/order'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  paid:       'Paid',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  refunded:   'Refunded',
}

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'refunded']

export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed']
