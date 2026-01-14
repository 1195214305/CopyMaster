import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExtractResult {
  id: string
  platform: string
  url: string
  title: string
  author: string
  content: string
  summary?: string
  keywords?: string[]
  timestamp: number
}

interface AppState {
  apiKey: string
  setApiKey: (key: string) => void

  history: ExtractResult[]
  addHistory: (result: ExtractResult) => void
  clearHistory: () => void
  removeHistory: (id: string) => void

  isLoading: boolean
  setLoading: (loading: boolean) => void

  currentResult: ExtractResult | null
  setCurrentResult: (result: ExtractResult | null) => void

  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),

      history: [],
      addHistory: (result) => set((state) => ({
        history: [result, ...state.history].slice(0, 50)
      })),
      clearHistory: () => set({ history: [] }),
      removeHistory: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
      })),

      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      currentResult: null,
      setCurrentResult: (result) => set({ currentResult: result }),

      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),
    }),
    {
      name: 'copymaster-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        history: state.history,
      }),
    }
  )
)
