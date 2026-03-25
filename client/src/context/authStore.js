import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'
const useAuthStore = create(persist((set, get) => ({
  user: null, token: null, isAuthenticated: false,
  setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: async () => { try { await api.post('/auth/logout') } catch {} set({ user: null, token: null, isAuthenticated: false }) },
  updateUser: (updates) => set({ user: { ...get().user, ...updates } }),
  fetchMe: async () => { try { const { data } = await api.get('/auth/me'); set({ user: data, isAuthenticated: true }) } catch { set({ user: null, token: null, isAuthenticated: false }) } },
}), { name: 'auth', partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }) }))
export default useAuthStore
