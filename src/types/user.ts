import type { Database } from '@/lib/db/generated/database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']

export type UserWithAddresses = User & {
  addresses: Address[]
}

export type CreateAddressInput = {
  user_id: string
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
  is_default?: boolean
}
