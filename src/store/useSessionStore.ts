import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  studentId: string | null
  nickname: string | null
  sessionId: string | null
  sessionCode: string | null
  xp: number
  streak: number
  isAuthenticated: boolean
  
  // Actions
  setStudent: (studentId: string, nickname: string, sessionId: string, sessionCode: string) => void
  addXp: (amount: number) => void
  setStreak: (streak: number) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      studentId: null,
      nickname: null,
      sessionId: null,
      sessionCode: null,
      xp: 0,
      streak: 1,
      isAuthenticated: false,

      setStudent: (studentId, nickname, sessionId, sessionCode) =>
        set({
          studentId,
          nickname,
          sessionId,
          sessionCode,
          isAuthenticated: true,
        }),

      addXp: (amount) =>
        set((state) => ({ xp: state.xp + amount })),

      setStreak: (streak) =>
        set({ streak }),

      logout: () =>
        set({
          studentId: null,
          nickname: null,
          sessionId: null,
          sessionCode: null,
          xp: 0,
          streak: 1,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'lecturaviva-session',
    }
  )
)
