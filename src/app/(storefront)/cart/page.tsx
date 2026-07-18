'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { FadeImage } from '@/components/ui/FadeImage';
import { cartItemPrice } from '@/types/cart';
import { toast } from 'sonner';
import { getPublicSettings } from '@/lib/api/settings';

// Same defaults as before settings existed — used until the fetch below resolves, and
// kept as the fallback if it fails, so a settings-API hiccup never breaks the cart page.
const DEFAULT_SHIPPING_CHARGE = 150;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 4000;

export default function CartPage() {
  const { cart, loading, fetchCart, updateItem, removeItem, getSubtotal } = useCartStore();
  const [shippingCharge, setShippingCharge] = useState(DEFAULT_SHIPPING_CHARGE);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);

  useEffect(() => { fetchCart(); }, [fetchCart]);
  useEffect(() => {
    getPublicSettings()
      .then((s) => {
        setShippingCharge(s.shipping_charge);
        setFreeShippingThreshold(s.free_shipping_threshold);
      })
      .catch(() => {});
  }, []);

  const subtotal = getSubtotal();
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingCharge;
  const total = subtotal + shipping;
  const items = cart?.items ?? [];

  const handleUpdateQty = async (variantId: string, qty: number, stockAvailable: number | null) => {
    if (qty < 1) return;
    if (stockAvailable != null && qty > stockAvailable) {
      toast.error(
        stockAvailable > 0
          ? `Only ${stockAvailable} piece${stockAvailable === 1 ? '' : 's'} available.`
          : 'This item is out of stock.'
      );
      return;
    }
    try { await updateItem(variantId, qty); }
    catch (e: any) {
      toast.error(e?.message?.includes('Insufficient stock') ? 'Not enough stock for that quantity.' : (e?.message ?? 'Failed to update'));
    }
  };

  const handleRemove = async (variantId: string) => {
    try { await removeItem(variantId); }
    catch (e: any) { toast.error(e?.message ?? 'Failed to remove'); }
  };

  if (loading && !cart) {
    return (
      <div className="flex flex-col min-h-screen bg-canvas">
        <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10">
          <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse mb-8" />
          <div className="flex flex-col gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 bg-surface-2 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-text-mid hover:text-clay transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-head text-3xl md:text-4xl font-bold text-ink tracking-tight">Your Cart</h1>
          <span className="text-text-light font-semibold bg-surface-2 px-3 py-1 rounded-full text-[0.9rem] ml-2">
            {items.length} items
          </span>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-surface border border-border-soft rounded-3xl"
          >
            <div className="text-[5rem] mb-4">🛍️</div>
            <h2 className="font-head text-2xl font-bold text-ink mb-2">Your cart is empty</h2>
            <p className="text-text-mid mb-8 max-w-md text-center">Looks like you haven't added anything yet. Discover our premium ethnic collections for your little ones.</p>
            <Link
              href="/"
              className="bg-clay-deep text-white px-8 py-3.5 rounded-xl font-bold text-[0.95rem] shadow-s2 transition-transform hover:scale-[1.02]"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* Cart Items */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <AnimatePresence>
                {items.map((item) => {
                  const name = item.variant?.product?.name ?? 'Product';
                  const size = item.variant?.size ?? item.variant?.color ?? '';
                  const image = item.variant?.primary_image ?? null;
                  const variantId = item.variant_id;
                  const price = cartItemPrice(item);
                  const slug = item.variant?.product?.slug ?? '';
                  const stock = item.variant?.inventory;
                  const stockAvailable = stock ? stock.stock_available : null;
                  const atStockCap = stockAvailable != null && item.quantity >= stockAvailable;
                  const lowStock = stockAvailable != null && stockAvailable <= (stock?.low_stock_threshold ?? 5) && stockAvailable > 0;

                  return (
                    <motion.div
                      key={`${variantId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-3.5 p-4 bg-white rounded-2xl border border-border-soft shadow-s1 relative"
                    >
                      <Link href={slug ? `/product/${slug}` : '#'} className="shrink-0 w-20 h-24 sm:w-28 sm:h-36 bg-surface-2 rounded-xl overflow-hidden relative border border-border">
                        {image ? (
                          <FadeImage src={image} alt={name} fill className="object-cover" sizes="(max-width:640px) 80px, 112px" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                        )}
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={slug ? `/product/${slug}` : '#'} className="font-semibold text-[0.95rem] sm:text-[1.05rem] text-ink hover:text-clay transition-colors line-clamp-2 leading-tight mb-1">
                              {name}
                            </Link>
                            {size && (
                              <p className="text-[0.8rem] text-text-mid font-medium">
                                Size: <span className="text-ink font-bold">{size}</span>
                              </p>
                            )}
                            {lowStock && (
                              <p className="text-[0.72rem] text-destructive font-bold mt-0.5">Only {stockAvailable} left</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(variantId)}
                            aria-label="Remove item"
                            className="text-text-light hover:text-destructive transition-all shrink-0 active:scale-90 p-2.5 -m-2.5"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3 gap-2">
                          <div className="flex items-center border-[1.5px] border-border rounded-lg overflow-hidden bg-surface">
                            <button
                              onClick={() => handleUpdateQty(variantId, item.quantity - 1, stockAvailable)}
                              disabled={item.quantity <= 1}
                              className="w-11 h-11 flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Minus size={13} />
                            </button>
                            <div className="w-8 text-center font-bold text-[0.85rem] text-text select-none">{item.quantity}</div>
                            <button
                              onClick={() => handleUpdateQty(variantId, item.quantity + 1, stockAvailable)}
                              disabled={atStockCap}
                              className="w-11 h-11 flex items-center justify-center text-text-mid transition-all hover:bg-surface-2 hover:text-clay active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-body text-[1.05rem] font-extrabold text-ink tracking-tight leading-tight">
                              ₹{(price * item.quantity).toLocaleString('en-IN')}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-[0.7rem] text-text-light font-medium mt-0.5">
                                ₹{price.toLocaleString('en-IN')} × {item.quantity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 lg:sticky lg:top-[100px]"
            >
              <div className="bg-white rounded-3xl border border-border-soft p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <h3 className="font-head text-[1.35rem] font-bold text-ink mb-6 pb-4 border-b border-border-soft">Order Summary</h3>

                <div className="flex flex-col gap-4 text-[0.95rem] font-semibold text-text-mid mb-6 pb-6 border-b border-border-soft">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-ink font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-ink font-bold">
                      {shipping === 0
                        ? <span className="text-sage bg-sage/10 px-2 py-0.5 rounded-md text-[0.8rem]">Free</span>
                        : `₹${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-text font-bold text-[1.1rem]">Total</span>
                  <span className="font-body text-[1.75rem] font-extrabold text-clay-deep leading-none tracking-tight">₹{total.toLocaleString('en-IN')}</span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-between p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(157,62,36,0.25)] group"
                >
                  Proceed to Checkout
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-[0.8rem] font-semibold text-text-mid bg-surface p-3 rounded-xl border border-border-soft">
                    <ShieldCheck size={18} className="text-sage shrink-0" />
                    <span>Secure Checkout with 256-bit encryption</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex items-center gap-2.5 text-[0.8rem] font-semibold text-text-mid bg-surface p-3 rounded-xl border border-border-soft">
                      <Truck size={18} className="text-clay shrink-0" />
                      <span>Add ₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN')} more to unlock Free Shipping</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}
