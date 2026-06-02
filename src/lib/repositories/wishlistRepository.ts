import { createClient } from '@/lib/db/server'
import type { ProductSummary } from '@/types/product'

export const WishlistRepository = {
  async findOrCreateByUserId(userId: string): Promise<{ id: string }> {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) return existing

    const { data, error } = await supabase
      .from('wishlists')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ user_id: userId } as any)
      .select('id')
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async getItems(wishlistId: string): Promise<ProductSummary[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('wishlist_items')
      .select(`
        product:products!inner(
          id, name, slug, base_price, sale_price, is_new_arrival,
          images:product_images(public_url, is_primary, sort_order)
        )
      `)
      .eq('wishlist_id', wishlistId)
      .order('added_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => {
      const p = row.product
      const primaryImage =
        p.images?.find((i: any) => i.is_primary)?.public_url ?? p.images?.[0]?.public_url ?? ''
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.sale_price ?? p.base_price,
        oldPrice: p.sale_price ? p.base_price : undefined,
        image: primaryImage,
        isNew: p.is_new_arrival,
      } satisfies ProductSummary
    })
  },

  async addItem(wishlistId: string, productId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('wishlist_items')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ wishlist_id: wishlistId, product_id: productId } as any, { onConflict: 'wishlist_id,product_id' })

    if (error) throw new Error(error.message)
  },

  async removeItem(wishlistId: string, productId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlistId)
      .eq('product_id', productId)

    if (error) throw new Error(error.message)
  },

  async hasItem(wishlistId: string, productId: string): Promise<boolean> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return !!data
  },
}
