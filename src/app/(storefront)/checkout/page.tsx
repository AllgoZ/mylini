'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cartItemPrice } from '@/types/cart';

interface ConfirmedOrder {
  id: string
  total: number
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, getSubtotal, clearCart } = useCartStore();
  const { user, isAuthenticated, loading: authLoading, openLoginModal } = useAuthStore();
  const items = cart?.items ?? [];

  // Cart is already fetched by Navbar (guarded the same way) and auth is already
  // hydrated by AuthProvider in the parent storefront layout — avoid re-fetching both
  // on every checkout mount.
  useEffect(() => {
    if (!useCartStore.getState().cart) fetchCart();
  }, [fetchCart]);

  const subtotal = getSubtotal();
  const shipping = subtotal > 4000 ? 0 : 150;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      openLoginModal(() => {});
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create address
      const addrRes = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: 'India',
        }),
      });
      const addrJson = await addrRes.json();
      if (!addrRes.ok || addrJson.error) throw new Error(addrJson.error ?? 'Failed to save address');
      const address_id: string = addrJson.data.id;

      // 2. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address_id,
          items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
          notes: form.notes || undefined,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || orderJson.error) throw new Error(orderJson.error ?? 'Failed to place order');

      // 3. Clear cart
      await clearCart();

      setConfirmedOrder({ id: orderJson.data.id, total: orderJson.data.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-canvas px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="bg-white p-10 rounded-[2rem] shadow-s2 max-w-lg w-full border border-border-soft flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-sage/10 text-sage rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="font-head text-3xl font-bold text-ink mb-2">Order Confirmed!</h1>
          <p className="text-[0.8rem] font-mono text-text-mid mb-2">Order #{confirmedOrder.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-text-mid font-medium mb-2">
            Total paid: <span className="font-bold text-ink">₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
          </p>
          <p className="text-[0.85rem] text-text-light mb-8">
            Thank you for shopping with MYLINI. We'll keep you updated on your delivery.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/orders"
              className="w-full bg-clay-deep text-white px-8 py-3.5 rounded-xl font-bold text-[0.95rem] shadow-s2 text-center transition-transform hover:scale-[1.02]"
            >
              View My Orders
            </Link>
            <Link
              href="/shop/girls"
              className="w-full border border-border-soft text-text px-8 py-3.5 rounded-xl font-bold text-[0.95rem] text-center hover:bg-surface transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const inputCls = "w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all";

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="bg-white border-b border-border-soft py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40">
        <Link href="/cart" className="flex items-center gap-2 text-[0.85rem] font-bold text-text-mid hover:text-clay transition-colors">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <div className="flex items-center gap-1.5 text-sage text-[0.85rem] font-bold">
          <Lock size={14} /> Secure Checkout
        </div>
      </div>

      <div className="w-full mx-auto max-w-6xl px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* Left: Checkout Form */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {!isAuthenticated && !authLoading && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-[0.88rem] text-amber-800 font-medium flex items-center justify-between gap-4">
                <span>Sign in to place your order</span>
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="shrink-0 bg-clay-deep text-white px-4 py-1.5 rounded-lg text-[0.85rem] font-bold"
                >
                  Sign In
                </button>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-8">

              {/* Contact Info */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-5">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Full Name *</label>
                    <input required type="text" value={form.name} onChange={set('name')} className={inputCls} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Mobile Number *</label>
                    <input required type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="10-digit mobile number" pattern="[0-9]{10}" />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-5">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Address Line 1 *</label>
                    <input required type="text" value={form.line1} onChange={set('line1')} className={inputCls} placeholder="House / Flat no., Street name" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Address Line 2 (optional)</label>
                    <input type="text" value={form.line2} onChange={set('line2')} className={inputCls} placeholder="Apartment, landmark, area" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">City *</label>
                    <input required type="text" value={form.city} onChange={set('city')} className={inputCls} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">State *</label>
                    <input required type="text" value={form.state} onChange={set('state')} className={inputCls} placeholder="e.g. Tamil Nadu" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">PIN Code *</label>
                    <input required type="text" value={form.pincode} onChange={set('pincode')} className={inputCls} placeholder="6-digit PIN" pattern="[0-9]{6}" maxLength={6} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Delivery Notes (optional)</label>
                    <textarea value={form.notes} onChange={set('notes')} className={`${inputCls} resize-none`} rows={2} placeholder="Special instructions, gate code, etc." />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-1">Payment</h2>
                <p className="text-[0.8rem] text-text-light font-medium mb-5">All transactions are secure and encrypted.</p>
                <div className="flex flex-col border border-border-soft rounded-xl overflow-hidden bg-surface">
                  <div className="flex items-center gap-3 p-4 bg-[#FDF7F3]">
                    <div className="w-5 h-5 rounded-full border-2 border-clay flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-clay rounded-full" />
                    </div>
                    <span className="font-bold text-[0.9rem] text-ink flex-1">Cash on Delivery (COD)</span>
                    <span className="text-[1.2rem]">💵</span>
                  </div>
                  <div className="px-12 py-3 bg-[#FDF7F3] text-[0.8rem] text-text-mid font-medium border-t border-border-soft">
                    Pay when your order arrives. UPI &amp; Card payments coming soon.
                  </div>
                </div>
              </section>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 text-[0.88rem] text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Mobile Pay Button */}
              <div className="lg:hidden mt-2 mb-8">
                <button
                  type="submit"
                  disabled={isProcessing || items.length === 0}
                  className="w-full flex items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all hover:bg-clay hover:scale-[1.02] shadow-[0_8px_24px_rgba(157,62,36,0.25)] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
                >
                  {isProcessing ? 'Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>

            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-[120px] order-first lg:order-last">
            <div className="bg-surface-2 rounded-3xl border border-border p-6 shadow-s1">

              <div className="max-h-[300px] overflow-y-auto scrollbar-none pr-2 mb-6 flex flex-col gap-4 border-b border-border-soft pb-6">
                {items.map((item) => {
                  const name = item.variant?.product?.name ?? 'Product';
                  const size = item.variant?.size ?? item.variant?.color ?? '';
                  const image = item.variant?.primary_image ?? null;
                  return (
                    <div key={item.variant_id} className="flex gap-3 items-center">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 bg-white rounded-lg overflow-hidden border border-border-soft">
                          {image ? (
                            <Image src={image} alt={name} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                          )}
                        </div>
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink text-white rounded-full flex items-center justify-center text-[0.6rem] font-bold border-2 border-white">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[0.82rem] text-ink line-clamp-2 leading-snug">{name}</h4>
                        {size && <p className="text-[0.72rem] text-text-light font-medium mt-0.5">{size}</p>}
                      </div>
                      <div className="font-bold text-[0.88rem] text-ink shrink-0 ml-1">
                        ₹{(cartItemPrice(item) * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 text-[0.9rem] font-medium text-text-mid mb-6 pb-6 border-b border-border-soft">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-ink font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="text-ink font-bold">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-text font-bold text-[1.1rem]">Total</span>
                <span className="font-body text-[1.75rem] font-extrabold tracking-tight text-clay-deep leading-none">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || items.length === 0}
                className="hidden lg:flex w-full items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all hover:bg-clay hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(157,62,36,0.25)] group disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
              >
                {isProcessing ? 'Placing Order...' : 'Place Order'}
                {!isProcessing && <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />}
              </button>

              <div className="mt-5 flex items-center justify-center gap-1.5 text-[0.75rem] font-semibold text-sage">
                <ShieldCheck size={16} /> 256-bit SSL Secure Checkout
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
