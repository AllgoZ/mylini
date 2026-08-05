import { z } from 'zod'

export const updateStoreSettingsSchema = z.object({
  shipping_charge: z.number().min(0).optional(),
  free_shipping_threshold: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().max(500).optional(),
  store_name: z.string().min(1).max(200).optional(),
  store_email: z.string().email().optional().or(z.literal('')),
  store_phone: z.string().max(20).optional().or(z.literal('')),
  store_address: z.string().max(500).optional().or(z.literal('')),
  order_notification_email: z.string().email().optional().or(z.literal('')),
})

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>

export const changeAdminCredentialsSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_email: z.string().email().optional(),
    new_password: z.string().min(8, 'New password must be at least 8 characters').optional(),
    confirm_password: z.string().optional(),
  })
  .refine((data) => data.new_email || data.new_password, {
    message: 'Provide a new email and/or a new password',
  })
  .refine((data) => !data.new_password || data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ChangeAdminCredentialsInput = z.infer<typeof changeAdminCredentialsSchema>
