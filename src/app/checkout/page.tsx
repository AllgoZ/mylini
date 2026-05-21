'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, CreditCard, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const subtotal = getCartTotal();
  const shipping = subtotal > 4000 ? 0 : 150;
  const total = subtotal + shipping;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (isSuccess) {
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
          <h1 className="font-head text-3xl font-bold text-ink mb-4">Order Confirmed!</h1>
          <p className="text-text-mid font-medium mb-8">
            Thank you for your purchase. Your order #MYL-{Math.floor(Math.random() * 100000)} has been placed successfully. We'll send you an email with the tracking details shortly.
          </p>
          <Link 
            href="/shop/girls"
            className="w-full bg-clay-deep text-white px-8 py-3.5 rounded-xl font-bold text-[0.95rem] shadow-s2 transition-transform hover:scale-[1.02]"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Simplified Header for Checkout */}
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
            <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-8">
              
              {/* Contact Info */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-5">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Email or Mobile Number</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" placeholder="Enter email or mobile number" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="newsletter" className="w-4 h-4 rounded text-clay focus:ring-clay border-border-soft accent-clay" defaultChecked />
                    <label htmlFor="newsletter" className="text-[0.8rem] text-text-mid font-medium">Email me with news and offers</label>
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-5">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">First Name</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Last Name</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Address</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" placeholder="House number and street name" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">Apartment, suite, etc. (optional)</label>
                    <input type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">City</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[0.8rem] font-bold text-text-mid mb-1.5">PIN Code</label>
                    <input required type="text" className="w-full bg-surface border border-border-soft rounded-xl px-4 py-3 text-[0.95rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay transition-all" />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-s1">
                <h2 className="font-head text-xl font-bold text-ink mb-1">Payment</h2>
                <p className="text-[0.8rem] text-text-light font-medium mb-5">All transactions are secure and encrypted.</p>
                
                <div className="flex flex-col border border-border-soft rounded-xl overflow-hidden bg-surface">
                  
                  {/* UPI */}
                  <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border-soft ${paymentMethod === 'upi' ? 'bg-[#FDF7F3]' : 'hover:bg-white'}`}>
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="peer sr-only" />
                      <div className="w-5 h-5 rounded-full border-2 border-border-soft peer-checked:border-clay"></div>
                      <div className="absolute w-2.5 h-2.5 bg-clay rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="font-bold text-[0.9rem] text-ink flex-1">UPI (GPay, PhonePe, Paytm)</span>
                    <span className="text-[1.2rem]">📱</span>
                  </label>
                  {paymentMethod === 'upi' && (
                    <div className="p-4 px-12 bg-[#FDF7F3] border-b border-border-soft">
                      <div className="flex flex-col gap-3 items-center text-center py-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-s1 flex items-center justify-center border border-border-soft">
                          <Image src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" width={32} height={32} />
                        </div>
                        <p className="text-[0.85rem] text-text-mid font-medium max-w-xs">You will be redirected to complete your UPI payment securely via Razorpay.</p>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border-soft ${paymentMethod === 'card' ? 'bg-[#FDF7F3]' : 'hover:bg-white'}`}>
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="peer sr-only" />
                      <div className="w-5 h-5 rounded-full border-2 border-border-soft peer-checked:border-clay"></div>
                      <div className="absolute w-2.5 h-2.5 bg-clay rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="font-bold text-[0.9rem] text-ink flex-1">Credit / Debit Card</span>
                    <CreditCard size={18} className="text-text-mid" />
                  </label>
                  {paymentMethod === 'card' && (
                    <div className="p-4 px-12 bg-[#FDF7F3] border-b border-border-soft">
                      <div className="space-y-4 py-2">
                        <div>
                          <input type="text" className="w-full bg-white border border-border-soft rounded-lg px-3 py-2.5 text-[0.85rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay" placeholder="Card Number" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" className="bg-white border border-border-soft rounded-lg px-3 py-2.5 text-[0.85rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay" placeholder="MM / YY" />
                          <input type="text" className="bg-white border border-border-soft rounded-lg px-3 py-2.5 text-[0.85rem] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay" placeholder="CVV" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COD */}
                  <label className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-[#FDF7F3]' : 'hover:bg-white'}`}>
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="peer sr-only" />
                      <div className="w-5 h-5 rounded-full border-2 border-border-soft peer-checked:border-clay"></div>
                      <div className="absolute w-2.5 h-2.5 bg-clay rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="font-bold text-[0.9rem] text-ink flex-1">Cash on Delivery (COD)</span>
                    <span className="text-[1.2rem]">💵</span>
                  </label>

                </div>
              </section>

              {/* Mobile Pay Button */}
              <div className="lg:hidden mt-2 mb-8">
                <button
                  type="submit"
                  disabled={isProcessing || items.length === 0}
                  className="w-full flex items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:scale-[1.02] shadow-[0_8px_24px_rgba(157,62,36,0.25)] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
                >
                  {isProcessing ? 'Processing Securely...' : `Pay ₹${total.toLocaleString('en-IN')}`}
                </button>
              </div>

            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-[120px] order-first lg:order-last">
            <div className="bg-surface-2 rounded-3xl border border-border p-6 shadow-s1">
              
              <div className="max-h-[300px] overflow-y-auto scrollbar-none pr-2 mb-6 flex flex-col gap-4 border-b border-border-soft pb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center relative">
                    <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-border-soft shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                      )}
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink text-white rounded-full flex items-center justify-center text-[0.6rem] font-bold z-10 border border-white">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[0.85rem] text-ink line-clamp-1">{item.name}</h4>
                      <p className="text-[0.75rem] text-text-light font-medium">{item.size}</p>
                    </div>
                    <div className="font-bold text-[0.9rem] text-ink shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
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
                <span className="font-head text-[2rem] font-bold text-clay-deep leading-none">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || items.length === 0}
                className="hidden lg:flex w-full items-center justify-center p-4 bg-clay-deep text-white text-[1rem] font-extrabold rounded-xl transition-all duration-[--t] ease-[--spring] hover:bg-clay hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(157,62,36,0.25)] group disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-clay-deep"
              >
                {isProcessing ? 'Processing Securely...' : `Pay ₹${total.toLocaleString('en-IN')}`}
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
