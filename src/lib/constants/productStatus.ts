import type { ProductStatus } from '@/types/product'

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft:    'Draft',
  active:   'Active',
  archived: 'Archived',
}

export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = ['active']
