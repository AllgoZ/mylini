'use client'

import { useRef, useState } from 'react'
import { Upload, X, Link as LinkIcon } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  aspectHint?: string
}

export function CmsImageUpload({ value, onChange, folder = 'general', label = 'Image', aspectHint }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)
    setProgress(10)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)

      setProgress(40)
      const res = await fetch('/api/admin/upload/cms', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      setProgress(80)
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onChange(json.data.url)
      setProgress(100)
      setShowUrlInput(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="block text-[0.78rem] font-semibold text-[#78716C]">{label}</span>
        {aspectHint && (
          <span className="text-[0.7rem] text-[#A8A29E]">{aspectHint}</span>
        )}
      </div>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-[#E7E5E4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="w-full h-36 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-white text-[#1C1917] text-[0.78rem] font-bold px-3 py-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors"
            >
              <Upload size={13} /> Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 bg-white text-red-600 text-[0.78rem] font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X size={13} /> Remove
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#E7E5E4]">
              <div
                className="h-full bg-[#C4654A] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative border-2 border-dashed border-[#E7E5E4] rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C4654A] hover:bg-[#FDF9F7] transition-colors group"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-[#C4654A] border-t-transparent rounded-full animate-spin" />
              <p className="text-[0.8rem] text-[#78716C] font-medium">Uploading… {progress}%</p>
              <div className="w-full h-1 bg-[#E7E5E4] rounded-full mt-1">
                <div
                  className="h-full bg-[#C4654A] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#F5F5F4] group-hover:bg-[#F0EDE9] flex items-center justify-center transition-colors">
                <Upload size={18} className="text-[#78716C]" />
              </div>
              <p className="text-[0.82rem] font-semibold text-[#44403C]">Click or drag to upload</p>
              <p className="text-[0.72rem] text-[#A8A29E]">JPG, PNG, WebP · max 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && (
        <p className="text-[0.78rem] text-red-600 font-medium flex items-center gap-1.5">
          <X size={13} /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowUrlInput(v => !v)}
        className="flex items-center gap-1.5 text-[0.75rem] text-[#A8A29E] hover:text-[#78716C] transition-colors"
      >
        <LinkIcon size={12} /> {showUrlInput ? 'Hide' : 'or paste a URL instead'}
      </button>

      {showUrlInput && (
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or /public/path"
          className="w-full bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-[0.875rem] text-[#1C1917] outline-none focus:border-[#C4654A] transition-all"
        />
      )}
    </div>
  )
}
