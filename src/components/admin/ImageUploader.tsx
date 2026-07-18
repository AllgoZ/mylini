'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, Star, X, GripVertical, AlertCircle } from 'lucide-react'
import { adminUploadImage, adminAddImage, adminDeleteImage, adminUpdateImage } from '@/lib/api/admin/products'
import type { ProductImage } from '@/types/product'
import { toast } from 'sonner'

interface PendingUpload {
  id: string
  file: File
  previewUrl: string
  status: 'idle' | 'uploading' | 'done' | 'error'
  errorMsg?: string
  result?: { public_url: string; storage_key: string; storage_provider: string; width?: number; height?: number }
}

interface Props {
  productId?: string
  images: ProductImage[]
  onSavedImagesChange: (images: ProductImage[]) => void
  onPendingChange: (pending: PendingUpload[]) => void
  pending: PendingUpload[]
}

export function ImageUploader({ productId, images, onSavedImagesChange, onPendingChange, pending }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Internal ref keeps the latest pending list for use inside async loops
  const pendingRef = useRef<PendingUpload[]>(pending)
  const updatePending = useCallback((updater: (list: PendingUpload[]) => PendingUpload[]) => {
    const next = updater(pendingRef.current)
    pendingRef.current = next
    onPendingChange(next)
  }, [onPendingChange])

  const processFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    if (valid.length < files.length) toast.error('Only JPG, PNG, and WEBP images are accepted')

    const newItems: PendingUpload[] = valid.map(f => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'idle',
    }))

    updatePending(prev => [...prev, ...newItems])

    // Accumulates this call's successful saves so sort_order/is_primary for the 2nd,
    // 3rd… file in one batch account for the 1st's save, without waiting on the parent
    // re-render (`images` stays stale, closure-captured, for the rest of this loop).
    const savedThisBatch: ProductImage[] = []

    for (const item of newItems) {
      updatePending(prev => prev.map(p => p.id === item.id ? { ...p, status: 'uploading' } : p))
      try {
        if (!productId) {
          updatePending(prev => prev.map(p => p.id === item.id ? { ...p, status: 'done' } : p))
          continue
        }

        const isFirst = images.length === 0 && newItems[0].id === item.id
        const uploadType = isFirst ? 'main' : 'gallery'
        const { main } = await adminUploadImage(item.file, productId, uploadType)

        const created = await adminAddImage(productId, {
          public_url: main.public_url,
          storage_key: main.storage_key,
          storage_provider: main.storage_provider,
          width: main.width,
          height: main.height,
          is_primary: images.length === 0 && savedThisBatch.length === 0,
          sort_order: images.length + savedThisBatch.length,
        })

        // Promote out of `pending` (which shows the local blob preview) into the real
        // saved-images list (which shows the actual Cloudinary URL) — previously this
        // only ever flipped the pending item to status: 'done' and never called
        // onSavedImagesChange, so a successful upload never actually appeared as a
        // real thumbnail; it just sat on its local preview until something else
        // happened to refetch the product.
        savedThisBatch.push(created)
        onSavedImagesChange([...images, ...savedThisBatch])
        URL.revokeObjectURL(item.previewUrl)
        updatePending(prev => prev.filter(p => p.id !== item.id))
        toast.success('Image uploaded')
      } catch (e: any) {
        updatePending(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error', errorMsg: e.message } : p))
        toast.error(`Upload failed: ${e.message}`)
      }
    }
  }, [productId, images, updatePending, onSavedImagesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [processFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleRemoveSaved = async (imageId: string) => {
    if (!productId) return
    try {
      await adminDeleteImage(productId, imageId)
      onSavedImagesChange(images.filter(i => i.id !== imageId))
      toast.success('Image removed')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!productId) return
    try {
      await adminUpdateImage(productId, imageId, { is_primary: true })
      onSavedImagesChange(images.map(i => ({ ...i, is_primary: i.id === imageId })))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Reorder saved images via drag
  const handleDragEnd = async () => {
    if (!draggingId || !dragOverId || draggingId === dragOverId || !productId) {
      setDraggingId(null); setDragOverId(null); return
    }
    const from = images.findIndex(i => i.id === draggingId)
    const to = images.findIndex(i => i.id === dragOverId)
    if (from === -1 || to === -1) { setDraggingId(null); setDragOverId(null); return }

    const reordered = [...images]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const withOrder = reordered.map((img, idx) => ({ ...img, sort_order: idx }))
    onSavedImagesChange(withOrder)

    // Persist reorder
    await Promise.all(withOrder.map(img => adminUpdateImage(productId, img.id, { sort_order: img.sort_order }))).catch(() => null)
    setDraggingId(null); setDragOverId(null)
  }

  const removePending = (id: string) => {
    const item = pendingRef.current.find(p => p.id === id)
    if (item) URL.revokeObjectURL(item.previewUrl)
    updatePending(prev => prev.filter(p => p.id !== id))
  }

  const allCount = images.length + pending.length
  const hasImages = allCount > 0

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      {hasImages && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {/* Saved images (reorderable) */}
          {images.sort((a, b) => a.sort_order - b.sort_order).map(img => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDraggingId(img.id)}
              onDragOver={e => { e.preventDefault(); setDragOverId(img.id) }}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${draggingId === img.id ? 'opacity-40 scale-95' : dragOverId === img.id ? 'border-[#C4654A] scale-105' : 'border-[#E5E7EB]'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.public_url} alt="" className="w-full h-full object-cover" />

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-amber-400 text-white text-[0.58rem] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={7} fill="white" /> Primary
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-white drop-shadow" />
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                  <button onClick={() => handleSetPrimary(img.id)}
                    className="p-1 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Set as primary">
                    <Star size={12} className="text-amber-500" />
                  </button>
                )}
                <button onClick={() => handleRemoveSaved(img.id)}
                  className="p-1 bg-white/90 rounded-lg hover:bg-red-500 hover:text-white transition-colors ml-auto" title="Remove">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Pending uploads */}
          {pending.map(item => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-[#E5E7EB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />

              {/* Status overlay */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/70 flex flex-col items-center justify-center p-2 text-center">
                  <AlertCircle size={16} className="text-white mb-1" />
                  <p className="text-white text-[0.6rem] font-bold">Failed</p>
                </div>
              )}
              {(item.status === 'idle' || item.status === 'done') && (
                <button onClick={() => removePending(item.id)}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-all ${dragOver ? 'border-[#C4654A] bg-[#FFF7F5]' : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#C4654A] hover:bg-[#FFF7F5]'}`}
      >
        <UploadCloud size={22} className={dragOver ? 'text-[#C4654A]' : 'text-[#9CA3AF]'} />
        <div className="text-center">
          <p className="text-[0.875rem] font-semibold text-[#374151]">
            {dragOver ? 'Drop to upload' : 'Drag & drop images here'}
          </p>
          <p className="text-[0.75rem] text-[#9CA3AF] mt-0.5">or click to browse · JPG, PNG, WEBP · max 10 MB each</p>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileInput} />
      </div>
    </div>
  )
}

export type { PendingUpload }
