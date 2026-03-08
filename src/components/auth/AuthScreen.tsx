'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'signup'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!email.trim() || !password) {
      setMessage({ type: 'err', text: 'E-posta ve şifre girin.' })
      return
    }
    if (mode === 'signup') {
      if (password.length < 6) {
        setMessage({ type: 'err', text: 'Şifre en az 6 karakter olmalı.' })
        return
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'err', text: 'Şifreler eşleşmiyor.' })
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email.trim(), password)
        if (error) {
          setMessage({ type: 'err', text: error.message || 'Kayıt başarısız.' })
          return
        }
        if (data?.user && !data?.session) {
          setMessage({ type: 'ok', text: 'Kayıt başarılı! E-posta adresinize gelen linke tıklayarak hesabınızı doğrulayın.' })
        } else {
          setMessage({ type: 'ok', text: 'Kayıt başarılı! Yönlendiriliyorsunuz…' })
        }
      } else {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          setMessage({ type: 'err', text: error.message || 'Giriş başarısız.' })
          return
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border2)] bg-[var(--bg1)] p-6 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">TradeSim</h1>
          <p className="text-[12px] text-[var(--muted)] mt-1">Hesabınızla giriş yapın veya kayıt olun. Herkes 2 SOL ile başlar.</p>
        </div>

        <div className="flex rounded-xl bg-[var(--bg2)] p-1 gap-1 mb-5">
          <button
            type="button"
            onClick={() => { setMode('login'); setMessage(null) }}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              mode === 'login' ? 'bg-[var(--bg3)] text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Giriş
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage(null) }}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              mode === 'signup' ? 'bg-[var(--bg3)] text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Kayıt
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-[var(--muted)] mb-1.5">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              autoComplete="email"
              className="w-full bg-[var(--bg2)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-xl text-[13px] outline-none focus:border-[var(--cyan)] transition-colors placeholder:text-[var(--muted2)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--muted)] mb-1.5">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-[var(--bg2)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-xl text-[13px] outline-none focus:border-[var(--cyan)] transition-colors placeholder:text-[var(--muted2)]"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] text-[var(--muted)] mb-1.5">Şifre tekrar</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-[var(--bg2)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-xl text-[13px] outline-none focus:border-[var(--cyan)] transition-colors placeholder:text-[var(--muted2)]"
              />
            </div>
          )}

          {message && (
            <div className={`text-[12px] px-3 py-2 rounded-lg ${message.type === 'ok' ? 'bg-[var(--green-bg)] text-[var(--green)]' : 'bg-[var(--red-bg)] text-[var(--red)]'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--cyan)] text-black text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'İşleniyor…' : mode === 'login' ? 'Giriş yap' : 'Kayıt ol'}
          </button>
        </form>

        <p className="text-[10px] text-[var(--muted2)] text-center mt-4">
          Kayıt olunca 2 SOL simülasyon bakiyesi ile başlarsınız. Portföyünüz sadece size aittir.
        </p>
      </div>
    </div>
  )
}
