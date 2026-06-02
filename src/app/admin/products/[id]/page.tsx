'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductDrawer } from '@/components/admin/ProductDrawer'
import { adminGetProduct } from '@/lib/api/admin/products'
import type { ProductWithVariants } from '@/types/product'

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(true)

  useEffect(() => {
    adminGetProduct(id).then(setProduct).catch(console.error)
  }, [id])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 rounded-xl border border-[#E7E5E4] bg-white text-[#78716C] hover:bg-[#F5F5F4] transition-colors shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-head text-[1.4rem] font-bold text-[#1C1917]">{product?.name ?? 'Loading…'}</h1>
          <p className="text-[0.82rem] text-[#78716C]">{product?.slug}</p>
        </div>
      </div>

      <ProductDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); window.history.back() }}
        productId={id}
        onSaved={() => adminGetProduct(id).then(setProduct)}
      />
    </div>
  )
}
