'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: number
  footer?: React.ReactNode
}

export function AdminDrawer({ open, onClose, title, subtitle, children, width = 560, footer }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{ width }}
            className="fixed top-0 right-0 h-full z-[301] bg-white shadow-[−20px_0_60px_rgba(0,0,0,0.12)] flex flex-col max-w-full"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-[#E7E5E4] shrink-0">
              <div>
                <h2 className="font-head text-[1.15rem] font-bold text-[#1C1917]">{title}</h2>
                {subtitle && <p className="text-[0.82rem] text-[#78716C] mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F5F5F4] transition-colors mt-0.5">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-[#E7E5E4] p-4 bg-[#FAFAF9]">{footer}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
