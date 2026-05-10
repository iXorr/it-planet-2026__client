import { defineStore } from 'pinia'
import type { AuthUser } from '../types'
import { getMe } from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') ?? '',
    user: null as AuthUser | null,
  }),

  getters: {
    isAuth: (state) => !!state.token,
    role: (state) => state.user?.role ?? null,
  },

  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setUser(user: AuthUser | null) {
      this.user = user
    },

    async fetchUser() {
      if (!this.token) return
      try {
        this.user = await getMe()
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
