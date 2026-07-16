'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Package, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { adminGetOrder, adminUpdateOrderStatus, adminUpdateTracking } from '@/lib/api/admin/orders'
import type { OrderWithItems } from '@/types/order'
import type { OrderStatus } from '@/types/order'
import { toast } from 'sonner'

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [updating, setUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [savingTracking, setSavingTracking] = useState(false)

  useEffect(() => {
    adminGetOrder(id)
      .then(o => {
        setOrder(o)
        setNewStatus(o.status)
        setTrackingNumber(o.tracking_number ?? '')
        setTrackingUrl(o.tracking_url ?? '')
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) return
    setUpdating(true)
    try {
      const updated = await adminUpdateOrderStatus(id, newStatus)
      setOrder(o => o ? { ...o, status: updated.status } : null)
      toast.success('Order status updated')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveTracking = async () => {
    setSavingTracking(true)
    try {
      await adminUpdateTracking(id, trackingNumber, trackingUrl)
      setOrder(o => o ? { ...o, tracking_number: trackingNumber, tracking_url: trackingUrl } : null)
      toast.success('Tracking info saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingTracking(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-[#F5F5F4] rounded-2xl animate-pulse" />)}
    </div>
  )

  if (!order) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="p-2 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-body text-[1.35rem] font-bold text-[#1C1917] tracking-tight">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <StatusBadge status={order.status} size="md" />
          </div>
          <p className="text-[0.82rem] text-[#78716C] mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-[#1C1917] mb-3">Update Status</h2>
        <div className="flex items-center gap-3">
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as OrderStatus)}
            className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || newStatus === order.status}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
          >
            <Check size={15} /> {updating ? 'Updating…' : 'Update'}
          </button>
        </div>
      </div>

      {/* Shipment Tracking */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-[#C4654A]" />
          <h2 className="font-semibold text-[#1C1917]">Shipment Tracking</h2>
          {order.tracking_number && (
            <span className="ml-auto text-[0.72rem] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Tracking Added</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[0.78rem] font-semibold text-[#78716C] mb-1.5">Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="e.g. DELHIVERY1234567890"
              className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all placeholder:text-[#A8A29E]"
            />
          </div>
          <div>
            <label className="block text-[0.78rem] font-semibold text-[#78716C] mb-1.5">Tracking URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
                placeholder="https://www.delhivery.com/track/..."
                className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all placeholder:text-[#A8A29E]"
              />
              {trackingUrl && (
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] text-[#78716C] hover:text-[#C4654A] transition-colors shrink-0">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={handleSaveTracking}
            disabled={savingTracking}
            className="self-end flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C4654A] text-white text-[0.875rem] font-bold hover:bg-[#A0523A] disabled:opacity-50 transition-colors"
          >
            <Check size={15} /> {savingTracking ? 'Saving…' : 'Save Tracking'}
          </button>
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-[#1C1917] mb-4">Items</h2>
        <div className="space-y-3">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]">
              <div className="w-12 h-12 rounded-lg bg-[#F5F5F4] border border-[#E7E5E4] overflow-hidden shrink-0">
                {item.image_snapshot ? (
                  <img src={item.image_snapshot} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[1.2rem]">👗</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[0.875rem] text-[#1C1917] line-clamp-1">{item.product_name_snapshot}</p>
                <p className="text-[0.78rem] text-[#78716C]">
                  {item.variant_snapshot && `${item.variant_snapshot} · `}SKU: {item.sku_snapshot}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[0.9rem] text-[#1C1917]">₹{item.total_price.toLocaleString('en-IN')}</p>
                <p className="text-[0.75rem] text-[#A8A29E]">×{item.quantity} @ ₹{item.unit_price.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm mb-4">
          <h2 className="font-semibold text-[#1C1917] mb-3">Delivery Address</h2>
          <div className="text-[0.875rem] text-[#44403C] space-y-0.5">
            <p className="font-bold text-[#1C1917]">{order.address.name}</p>
            <p>{order.address.line1}</p>
            {order.address.line2 && <p>{order.address.line2}</p>}
            <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
            <p className="text-[#78716C]">{order.address.country}</p>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 shadow-sm">
        <h2 className="font-semibold text-[#1C1917] mb-4">Order Summary</h2>
        <div className="space-y-2.5 text-[0.875rem]">
          <div className="flex justify-between text-[#78716C]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1C1917]">₹{order.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount{order.coupon && ` (${order.coupon.code})`}</span>
              <span className="font-semibold">−₹{order.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[1rem] text-[#1C1917] border-t border-[#E7E5E4] pt-2.5">
            <span>Total</span>
            <span>₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
