'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock, ArrowRight, CheckCircle2, Pencil, Plus, Check, Tag, X as XIcon } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cartItemPrice } from '@/types/cart';
import { getAddresses, createAddress, updateAddress as updateAddressApi } from '@/lib/api/addresses';
import { validateCoupon } from '@/lib/api/coupons';
import { getPublicSettings } from '@/lib/api/settings';
import { AddressAutocomplete } from '@/components/checkout/AddressAutocomplete';
import type { Address } from '@/types/user';
import type { AppliedCoupon } from '@/types/coupon';

interface ConfirmedOrder {
  id: string
  total: number
}

// Same defaults as before settings existed — used until the fetch below resolves, and
// kept as the fallback if it fails, so a settings-API hiccup never breaks checkout.
const DEFAULT_SHIPPING_CHARGE = 150;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 4000;

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

  const [shippingCharge, setShippingCharge] = useState(DEFAULT_SHIPPING_CHARGE);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [taxRate, setTaxRate] = useState(0);
  useEffect(() => {
    getPublicSettings()
      .then((s) => {
        setShippingCharge(s.shipping_charge);
        setFreeShippingThreshold(s.free_shipping_threshold);
        setTaxRate(s.tax_rate);
      })
      .catch(() => {});
  }, []);

  const subtotal = getSubtotal();
  const shipping = subtotal > freeShippingThreshold ? 0 : shippingCharge;
  const tax = Math.round((subtotal * taxRate) / 100);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = appliedCoupon?.discount_amount ?? 0;
  const total = subtotal - discount + shipping + tax;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const applied = await validateCoupon(code, subtotal);
      setAppliedCoupon(applied);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput('');
  };

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

  // Address book — saved addresses picker. `selectedAddressId` set means "use this
  // existing address" (the manual form is hidden); null means "show the form" (either
  // no saved addresses yet, or the user chose "+ Add new address").
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;
    getAddresses()
      .then((list) => {
        if (ignore) return;
        setSavedAddresses(list);
        if (list.length > 0) {
          setSelectedAddressId((list.find((a) => a.is_default) ?? list[0]).id);
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [isAuthenticated]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Numeric-only fields — strip non-digits as the user types and cap length, same
  // pattern already proven in PhoneModal.tsx, instead of relying on native pattern alone.
  const setPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }));
  const setPincode = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }));

  const startNewAddress = () => {
    setSelectedAddressId(null);
    setEditingAddressId(null);
    setForm(prev => ({ ...prev, name: '', line1: '', line2: '', city: '', state: '', pincode: '' }));
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setForm(prev => ({
      ...prev,
      name: addr.name,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  };

  const saveEditedAddress = async () => {
    if (!editingAddressId) return;
    setSavingEdit(true);
    try {
      const updated = await updateAddressApi(editingAddressId, {
        name: form.name,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
      setSavedAddresses((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      setEditingAddressId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      // Form state (name/address/etc.) lives in `form`, untouched by the modal opening —
      // resuming here after login continues with everything the user already typed.
      openLoginModal(() => submitOrder());
      return;
    }

    submitOrder();
  };

  const submitOrder = async () => {
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Resolve the shipping address — reuse a selected saved address as-is (never
      // duplicate it), otherwise create one from the form.
      let address_id: string;
      if (selectedAddressId) {
        address_id = selectedAddressId;
      } else {
        const created = await createAddress({
          name: form.name,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          is_default: saveAddress,
        });
        address_id = created.id;
      }

      // 2. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address_id,
          items: items.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
          coupon_code: appliedCoupon?.coupon.code || undefined,
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
            Order Total: <span className="font-bold text-ink">₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
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
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={setPhone}
                      className={inputCls}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                    />
                    {form.phone.length > 0 && form.phone.length !== 10 && (
                      <p className="text-destructive text-[0.8rem] font-semibold mt-1.5">Enter a valid 10-digit mobile number</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-5">Shipping Address</h2>

                {/* Saved-address picker — shown when a saved address is selected and we're
                    not actively adding a new one or editing this one. */}
                {savedAddresses.length > 0 && selectedAddressId && editingAddressId === null ? (
                  <div className="flex flex-col gap-3">
                    {savedAddresses.map((addr) => (
                      <button
                        type="button"
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`text-left flex items-start gap-3 p-4 rounded-xl border-[1.5px] transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-clay bg-rose-pale'
                            : 'border-border-soft hover:border-clay-soft'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'border-clay' : 'border-border'}`}>
                          {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-clay rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[0.9rem] text-ink">{addr.name}</span>
                            {addr.is_default && (
                              <span className="text-[0.65rem] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full uppercase tracking-wide">Default</span>
                            )}
                          </div>
                          <p className="text-[0.82rem] text-text-mid mt-0.5">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); startEditAddress(addr); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); startEditAddress(addr); } }}
                          className="shrink-0 flex items-center gap-1 text-[0.78rem] font-bold text-clay hover:text-clay-deep p-2 -m-2"
                        >
                          <Pencil size={13} /> Edit
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={startNewAddress}
                      className="flex items-center justify-center gap-1.5 p-3.5 rounded-xl border-[1.5px] border-dashed border-border text-[0.85rem] font-bold text-text-mid hover:border-clay hover:text-clay transition-colors"
                    >
                      <Plus size={16} /> Add new address
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {editingAddressId && (
                      <p className="text-[0.8rem] font-semibold text-text-mid">Editing saved address</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Address Line 1 *</label>
                        <AddressAutocomplete
                          required
                          value={form.line1}
                          onChange={(v) => setForm(prev => ({ ...prev, line1: v }))}
                          onPlaceSelect={(place) => setForm(prev => ({
                            ...prev,
                            line1: place.line1 || prev.line1,
                            city: place.city || prev.city,
                            state: place.state || prev.state,
                            pincode: place.pincode || prev.pincode,
                          }))}
                          className={inputCls}
                          placeholder="House / Flat no., Street name"
                        />
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
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          value={form.pincode}
                          onChange={setPincode}
                          className={inputCls}
                          placeholder="6-digit PIN"
                          pattern="[0-9]{6}"
                          maxLength={6}
                        />
                        {form.pincode.length > 0 && form.pincode.length !== 6 && (
                          <p className="text-destructive text-[0.8rem] font-semibold mt-1.5">Enter a valid 6-digit PIN code</p>
                        )}
                      </div>
                    </div>

                    {editingAddressId ? (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveEditedAddress}
                          disabled={savingEdit}
                          className="flex items-center gap-1.5 bg-clay-deep text-white text-[0.85rem] font-bold px-4 py-2.5 rounded-lg disabled:opacity-60"
                        >
                          <Check size={15} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAddressId(null)}
                          className="text-[0.85rem] font-bold text-text-mid hover:text-ink px-4 py-2.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-2.5 text-[0.85rem] font-semibold text-text-mid cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            className="w-[18px] h-[18px] accent-clay-deep rounded"
                          />
                          Save this address to my account
                        </label>
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedAddressId((savedAddresses.find(a => a.is_default) ?? savedAddresses[0]).id)}
                            className="self-start text-[0.8rem] font-bold text-clay hover:text-clay-deep"
                          >
                            ← Use a saved address
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Delivery Notes (optional)</label>
                  <textarea value={form.notes} onChange={set('notes')} className={`${inputCls} resize-none`} rows={2} placeholder="Special instructions, gate code, etc." />
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-1">Payment</h2>
                <p className="text-[0.8rem] text-text-light font-medium mb-5">All transactions are secure and encrypted.</p>
                <div className="flex flex-col border border-border-soft rounded-xl overflow-hidden bg-surface">
                  <div className="flex items-center gap-3 p-4 bg-rose-pale">
                    <div className="w-5 h-5 rounded-full border-2 border-clay flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-clay rounded-full" />
                    </div>
                    <span className="font-bold text-[0.9rem] text-ink flex-1">Cash on Delivery (COD)</span>
                    <span className="text-[1.2rem]">💵</span>
                  </div>
                  <div className="px-12 py-3 bg-rose-pale text-[0.8rem] text-text-mid font-medium border-t border-border-soft">
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
                  className="w-full flex items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all hover:bg-clay hover:scale-[1.02] shadow-[0_8px_24px_rgba(62,15,47,0.25)] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
                >
                  {isProcessing ? 'Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>

            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-[120px] order-first lg:order-last">
            <div className="bg-white rounded-3xl border border-border-soft p-6 shadow-s1">

              <h2 className="font-head text-xl font-bold text-ink mb-5">Order Summary</h2>

              <div className="max-h-[280px] overflow-y-auto scrollbar-none -mr-1 pr-1 mb-5 flex flex-col gap-4">
                {items.map((item) => {
                  const name = item.variant?.product?.name ?? 'Product';
                  const size = item.variant?.size ?? item.variant?.color ?? '';
                  const image = item.variant?.primary_image ?? null;
                  return (
                    <div key={item.variant_id} className="flex gap-3 items-center">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 bg-surface rounded-[12px] overflow-hidden border border-border-soft">
                          {image ? (
                            <Image src={image} alt={name} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-clay-deep text-white rounded-full flex items-center justify-center text-[0.65rem] font-bold border-2 border-white shadow-s1">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[0.85rem] text-ink line-clamp-2 leading-snug">{name}</h4>
                        {size && <p className="text-[0.75rem] text-text-light font-medium mt-0.5">{size}</p>}
                      </div>
                      <div className="font-bold text-[0.88rem] text-ink shrink-0 ml-1">
                        ₹{(cartItemPrice(item) * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="mb-5 pt-5 border-t border-border-soft">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 bg-sage/10 border border-sage/25 rounded-xl pl-3.5 pr-2.5 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
                        <Tag size={12} className="text-sage" />
                      </div>
                      <span className="font-bold text-[0.82rem] text-ink truncate">{appliedCoupon.coupon.code}</span>
                      <span className="text-[0.75rem] text-sage font-semibold shrink-0">applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-light hover:text-destructive hover:bg-white transition-colors"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface focus-within:border-clay focus-within:ring-1 focus-within:ring-clay transition-all pl-3">
                      <Tag size={15} className="text-text-light shrink-0" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        placeholder="Coupon code"
                        className="flex-1 min-w-0 bg-transparent py-2.5 text-[0.85rem] font-semibold tracking-wide uppercase placeholder:normal-case placeholder:font-medium placeholder:text-text-light outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className={`shrink-0 my-1.5 mr-1.5 text-[0.8rem] font-bold px-4 py-2 rounded-lg transition-colors ${
                          couponLoading || !couponInput.trim()
                            ? 'bg-border text-text-light cursor-not-allowed'
                            : 'bg-clay-deep text-white hover:bg-clay cursor-pointer'
                        }`}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-destructive text-[0.78rem] font-semibold pl-1">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 text-[0.88rem] font-medium text-text-mid mb-5 pb-5 border-b border-border-soft">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="text-ink font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sage">
                    <span>Discount{appliedCoupon && ` (${appliedCoupon.coupon.code})`}</span>
                    <span className="font-bold">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="text-ink font-bold">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Tax</span>
                    <span className="text-ink font-bold">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-ink font-bold text-[0.95rem]">Total</span>
                <span className="font-body text-[1.6rem] font-extrabold tracking-tight text-clay-deep leading-none">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || items.length === 0}
                className="hidden lg:flex w-full items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all hover:bg-clay hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(62,15,47,0.25)] group disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
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
