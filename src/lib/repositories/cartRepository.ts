import { createClient } from '@/lib/db/server'
import type { Cart, CartWithItems } from '@/types/cart'

const ITEMS_SELECT = `
  *,
  variant:product_variants!inner(
    id, sku, color, size, price_override,
    product:products!inner(id, name, slug, base_price, sale_price),
    images:product_images(public_url, is_primary)
  )
`

export const CartRepository = {
  async findOrCreateBySession(sessionId: string): Promise<Cart> {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (existing) return existing

    const { data, error } = await supabase
      .from('carts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ session_id: sessionId } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async findByUserId(userId: string): Promise<Cart | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data ?? null
  },

  async getWithItems(cartId: string): Promise<CartWithItems> {
    const supabase = await createClient()
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    if (cartError || !cart) throw new Error('Cart not found')

    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(ITEMS_SELECT)
      .eq('cart_id', cartId)

    if (itemsError) throw new Error(itemsError.message)

    const enrichedItems = (items ?? []).map((item: any) => ({
      ...item,
      variant: {
        ...item.variant,
        primary_image:
          item.variant.images?.find((i: any) => i.is_primary)?.public_url ??
          item.variant.images?.[0]?.public_url ?? null,
      },
    }))

    const subtotal = enrichedItems.reduce((sum: number, item: any) => {
      const price = item.variant.price_override ?? item.variant.product.sale_price ?? item.variant.product.base_price
      return sum + price * item.quantity
    }, 0)

    return {
      ...(cart as object),
      items: enrichedItems,
      subtotal,
      item_count: enrichedItems.reduce((n: number, i: any) => n + i.quantity, 0),
    } as import('@/types/cart').CartWithItems
  },

  async addItem(cartId: string, variantId: string, quantity: number): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('cart_items').upsert(
      { cart_id: cartId, variant_id: variantId, quantity } as any,
      { onConflict: 'cart_id,variant_id' }
    )
    if (error) throw new Error(error.message)
  },

  async updateItem(cartId: string, variantId: string, quantity: number): Promise<void> {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)

    if (error) throw new Error(error.message)
  },

  async removeItem(cartId: string, variantId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('variant_id', variantId)

    if (error) throw new Error(error.message)
  },

  async clearCart(cartId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
    if (error) throw new Error(error.message)
  },
}
