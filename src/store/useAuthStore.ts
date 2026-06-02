'use client'

import { create } from 'zustand'
import type { User } from '@/types/user'
import { getMe, loginByPhone, logoutApi } from '@/lib/api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  loginModalOpen: boolean
  loginCallback: (() => void) | null

  hydrate: () => Promise<void>
  login: (phone: string) => Promise<void>
  logout: () => Promise<void>
  openLoginModal: (callback?: () => void) => void
  closeLoginModal: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  loginModalOpen: false,
  loginCallback: null,

  hydrate: async () => {
    set({ loading: true })
    try {
      const user = await getMe()
      set({ user, isAuthenticated: !!user, loading: false })
    } catch {
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  login: async (phone: string) => {
    const user = await loginByPhone(phone)
    set({ user, isAuthenticated: true })
    const cb = get().loginCallback
    get().closeLoginModal()
    if (cb) cb()
  },

  logout: async () => {
    await logoutApi()
    set({ user: null, isAuthenticated: false })
  },

  openLoginModal: (callback?: () => void) => {
    set({ loginModalOpen: true, loginCallback: callback ?? null })
  },

  closeLoginModal: () => {
    set({ loginModalOpen: false, loginCallback: null })
  },
}))
