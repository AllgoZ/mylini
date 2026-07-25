'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, ExternalLink, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { getOrderById } from '@/lib/api/auth'
import type { OrderWithItems } from '@/types/order'

// Map DB status → stepper step index (0-based)
const STATUS_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
}

const STEPS = [
  { label: 'Order Placed', icon: Clock },
  { label: 'Confirmed', icon: CheckCircle2 },
  { label: 'Packing', icon: Package },
  { label: 'Shipped', icon: Truck },
  { label: 'Delivered', icon: CheckCircle2 },
]

const CANCELLED_STATUSES = new Set(['cancelled', 'refunded'])

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuthStore()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return }
    if (user && id) {
      getOrderById(id)
        .then(setOrder)
        .catch(e => setError(e.message ?? 'Order not found'))
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, id, router])

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-canvas py-10">
        <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-2 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex-1 bg-canvas py-20 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-text-mid font-medium mb-4">{error ?? 'Order not found'}</p>
        <Link href="/orders" className="text-clay font-bold hover:underline">← Back to Orders</Link>
      </div>
    )
  }

  const isCancelled = CANCELLED_STATUSES.has(order.status)
  const activeStep = STATUS_STEP[order.status] ?? 0
  const orderId = order.id.slice(0, 8).toUpperCase()
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 bg-canvas py-8 md:py-12">
      <div className="w-full max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="text-text-mid hover:text-clay transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-head text-2xl font-bold text-ink tracking-tight">Order #{orderId}</h1>
            <p className="text-[0.78rem] text-text-light font-medium mt-0.5">{date}</p>
          </div>
          <span className={`ml-auto text-[0.72rem] font-bold px-3 py-1 rounded-full border ${
            isCancelled
              ? 'bg-red-50 text-red-700 border-red-200'
              : order.status === 'delivered'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Status Stepper */}
        {!isCancelled ? (
          <div className="bg-white rounded-2xl border border-border-soft shadow-s1 p-5 mb-4">
            <h2 className="text-[0.78rem] font-bold text-text-mid uppercase tracking-widest mb-5">Order Progress</h2>
            <div className="relative flex items-start justify-between">
              {/* Progress line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border-soft z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-clay z-0 transition-all duration-500"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * (100 - (8 / (STEPS.length - 1)) * 100)}%` }}
              />
              {STEPS.map((step, idx) => {
                const Icon = step.icon
                const done = idx < activeStep
                const active = idx === activeStep
                return (
                  <div key={step.label} className="flex flex-col items-center gap-2 z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      done ? 'bg-clay border-clay text-white'
                        : active ? 'bg-white border-clay text-clay shadow-[0_0_0_3px_rgba(196,101,74,0.15)]'
                          : 'bg-white border-border-soft text-text-light'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-[0.65rem] font-bold text-center leading-tight max-w-[56px] ${
                      done || active ? 'text-ink' : 'text-text-light'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700 text-[0.9rem]">
                Order {order.status === 'refunded' ? 'Refunded' : 'Cancelled'}
              </p>
              <p className="text-[0.78rem] text-red-600">This order has been {order.status}.</p>
            </div>
          </div>
        )}

        {/* Tracking */}
        {order.tracking_number && (
          <div className="bg-clay/5 border border-clay/20 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <Truck size={18} className="text-clay shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink text-[0.88rem] mb-0.5">Your order is on its way!</p>
              <p className="text-[0.8rem] text-text-mid font-medium font-mono">{order.tracking_number}</p>
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-[0.8rem] font-bold text-clay hover:text-clay-deep transition-colors bg-white border border-clay/20 px-3 py-1.5 rounded-lg"
              >
                Track <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-border-soft shadow-s1 p-5 mb-4">
          <h2 className="text-[0.78rem] font-bold text-text-mid uppercase tracking-widest mb-4">Items Ordered</h2>
          <div className="flex flex-col gap-3">
            {order.items.map(item => {
              const images = item.variant?.product?.images ?? []
              const fallbackImage = images.find(i => i.is_primary)?.public_url ?? images[0]?.public_url ?? null
              const image = item.image_snapshot ?? fallbackImage
              return (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-soft">
                <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border-soft overflow-hidden shrink-0">
                  {image ? (
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[0.85rem] text-ink line-clamp-1">{item.product_name_snapshot}</p>
                  <p className="text-[0.75rem] text-text-light font-medium">
                    {item.variant_snapshot && `${item.variant_snapshot} · `}Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[0.88rem] text-ink">₹{item.total_price.toLocaleString('en-IN')}</p>
                  <p className="text-[0.7rem] text-text-light">@ ₹{item.unit_price.toLocaleString('en-IN')}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Delivery Address */}
        {order.address && (
          <div className="bg-white rounded-2xl border border-border-soft shadow-s1 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-clay" />
              <h2 className="text-[0.78rem] font-bold text-text-mid uppercase tracking-widest">Delivery Address</h2>
            </div>
            <div className="text-[0.85rem] text-text-mid space-y-0.5">
              <p className="font-bold text-ink">{order.address.name}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="bg-white rounded-2xl border border-border-soft shadow-s1 p-5 mb-6">
          <h2 className="text-[0.78rem] font-bold text-text-mid uppercase tracking-widest mb-4">Price Details</h2>
          <div className="space-y-2.5 text-[0.88rem]">
            <div className="flex justify-between text-text-mid">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{(order.coupon as any)?.code && ` (${(order.coupon as any).code})`}</span>
                <span className="font-semibold">−₹{order.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-text-mid">
              <span>Shipping</span>
              {/* `?? 0` — orders placed before migration 040 has no shipping_charge column
                  yet; degrades to the old "Free" display instead of crashing on undefined. */}
              {(order.shipping_charge ?? 0) === 0 ? (
                <span className="font-semibold text-sage">Free</span>
              ) : (
                <span className="font-semibold text-ink">₹{order.shipping_charge.toLocaleString('en-IN')}</span>
              )}
            </div>
            {(order.tax_amount ?? 0) > 0 && (
              <div className="flex justify-between text-text-mid">
                <span>Tax</span>
                <span className="font-semibold text-ink">₹{order.tax_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[1rem] text-ink border-t border-border-soft pt-3">
              <span>Total</span>
              <span className="text-clay-deep">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <Link
          href="/orders"
          className="flex items-center justify-center gap-2 w-full py-3.5 border border-border-soft rounded-xl text-[0.88rem] font-bold text-text-mid hover:bg-surface transition-colors"
        >
          <ArrowLeft size={15} /> Back to My Orders
        </Link>

      </div>
    </div>
  )
}
