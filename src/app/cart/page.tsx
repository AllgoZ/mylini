'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getCartTotal, clearCart } = useCartStore();
  const subtotal = getCartTotal();
  const shipping = subtotal > 4000 ? 0 : 150;
  const total = subtotal + shipping;

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10">
        
        <div className="flex items-center gap-3 mb-8">
          <Link href="/shop/girls" className="text-text-mid hover:text-clay transition-colors">
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
              href="/shop/girls"
              className="bg-clay-deep text-white px-8 py-3.5 rounded-xl font-bold text-[0.95rem] shadow-s2 transition-transform hover:scale-[1.02]"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${item.size}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden', padding: 0, margin: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row gap-5 p-5 bg-white rounded-2xl border border-border-soft shadow-s1 relative"
                  >
                    <Link href={`/product/${item.id}`} className="shrink-0 w-28 h-36 bg-surface-2 rounded-xl overflow-hidden relative border border-border">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="112px" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link href={`/product/${item.id}`} className="font-semibold text-[1.05rem] text-ink hover:text-clay transition-colors line-clamp-2 leading-tight mb-1.5">
                            {item.name}
                          </Link>
                          <p className="text-[0.85rem] text-text-mid font-medium mb-3">Size: <span className="text-ink font-bold">{item.size}</span></p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-text-light hover:text-destructive transition-colors shrink-0 h-fit"
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center border-[1.5px] border-border rounded-lg overflow-hidden bg-surface">
                          <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay"><Minus size={14} /></button>
                          <div className="w-9 text-center font-bold text-[0.9rem] text-text select-none">{item.quantity}</div>
                          <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-text-mid transition-colors hover:bg-surface-2 hover:text-clay"><Plus size={14} /></button>
                        </div>
                        <div className="font-head text-[1.3rem] font-bold text-ink">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary Sticky Sidebar */}
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
                    <span className="text-ink font-bold">{shipping === 0 ? <span className="text-sage bg-sage/10 px-2 py-0.5 rounded-md text-[0.8rem]">Free</span> : `₹${shipping}`}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-text font-bold text-[1.1rem]">Total</span>
                  <span className="font-head text-[2rem] font-bold text-clay-deep leading-none">₹{total.toLocaleString('en-IN')}</span>
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
                      <span>Add ₹{(4000 - subtotal).toLocaleString('en-IN')} more to unlock Free Shipping</span>
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
