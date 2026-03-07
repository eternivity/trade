'use client'
import { create } from 'zustand'
import { useEffect } from 'react'

type ToastType = 'ok' | 'err' | 'warn'
interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  show: (msg: string, type?: ToastType) => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'ok',
  visible: false,
  show: (message, type = 'ok') => {
    set({ message, type, visible: true })
    setTimeout(() => set({ visible: false }), 3800)
  },
  hide: () => set({ visible: false }),
}))

const colors = {
  ok: 'border-[rgba(72,187,120,0.4)] text-[var(--green)]',
  err: 'border-[rgba(252,129,129,0.4)] text-[var(--red)]',
  warn: 'border-[rgba(246,224,94,0.4)] text-[var(--yellow)]',
}

export function Toast() {
  const { message, type, visible } = useToast()
  return (
    <div
      className={`fixed bottom-6 right-6 z-[300] max-w-sm px-4 py-3 rounded-lg border bg-[var(--bg1)] text-[0.72rem] shadow-2xl transition-all duration-300 ${colors[type]} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      dangerouslySetInnerHTML={{ __html: message }}
    />
  )
}
