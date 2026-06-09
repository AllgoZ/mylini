'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrders } from '@/lib/api/auth';
import type { OrderSummary } from '@/types/order';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-800' },
  paid:       { label: 'Paid',       color: 'bg-purple-100 text-purple-800' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
  shipped:    { label: 'Shipped',    color: 'bg-cyan-100 text-cyan-800' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800' },
  refunded:   { label: 'Refunded',   color: 'bg-gray-100 text-gray-800' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    if (user) {
      getOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex-1 bg-canvas py-10">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-8 w-36 bg-surface-2 rounded animate-pulse mb-8" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface-2 rounded-2xl animate-pulse mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-canvas py-10 md:py-16">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-text-mid hover:text-clay transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-head text-3xl font-bold text-ink tracking-tight">My Orders</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => <div key={i} className="h-32 bg-surface-2 rounded-2xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-3xl border border-border-soft shadow-s1">
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-text-light mb-6">
              <ShoppingBag size={28} strokeWidth={1.5} />
            </div>
            <h2 className="font-head text-xl font-bold text-ink mb-2.5">No Orders Yet</h2>
            <p className="text-[0.88rem] text-text-mid leading-relaxed mb-8 max-w-xs">
              You haven't placed any orders. Start exploring our exclusive ethnic wear collection.
            </p>
            <Link
              href="/"
              className="bg-clay-deep text-white px-8 py-3 rounded-full text-[0.88rem] font-bold shadow-s2 hover:bg-clay transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
              const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              });
              const orderId = order.id.slice(0, 8).toUpperCase();

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-border-soft shadow-s1 p-5 flex flex-col gap-4"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-ink text-[0.95rem] mb-0.5">Order #{orderId}</div>
                      <div className="text-[0.78rem] text-text-light font-medium">{date} · {order.item_count} item{order.item_count !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[0.72rem] font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="font-bold text-ink text-[0.9rem]">
                        ₹{order.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Item previews */}
                  {order.items_preview.length > 0 && (
                    <div className="flex gap-3 items-center">
                      {order.items_preview.map((item, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-border-soft bg-surface shrink-0">
                          {item.image_snapshot ? (
                            <Image
                              src={item.image_snapshot}
                              alt={item.product_name_snapshot}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#E8C9B8] to-[#B87050]" />
                          )}
                        </div>
                      ))}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.82rem] font-semibold text-ink line-clamp-1">
                          {order.items_preview[0].product_name_snapshot}
                        </p>
                        {order.items_preview.length > 1 && (
                          <p className="text-[0.75rem] text-text-light font-medium">
                            +{order.item_count - 1} more item{order.item_count - 1 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
