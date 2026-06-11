'use client'
export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 4) {
        setPin((p) => p + digit)
        setError('')
      }
    },
    [pin]
  )

  const handleBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (pin.length === 0) return
    setLoading(true)
    setError('')

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('pin', pin)
        .single()

      if (dbError || !data) {
        setError(t('login.error'))
        setPin('')
        setLoading(false)
        return
      }

      const profile = data as Profile
      localStorage.setItem('bargo_profile', JSON.stringify(profile))

      if (profile.role === 'admin') {
        router.push('/admin')
      } else if (profile.role === 'waiter') {
        router.push('/waiter')
      } else if (profile.role === 'bar') {
        router.push('/bar')
      } else if (profile.role === 'kitchen') {
        router.push('/kitchen')
      }
    } catch {
      setError(t('login.error'))
      setPin('')
      setLoading(false)
    }
  }, [pin, router, t])

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4 relative">
      {/* Language toggle */}
      <button
        onClick={() => setLocale(locale === 'es' ? 'zh' : 'es')}
        className="absolute top-4 right-4 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow text-sm font-semibold text-gray-600 hover:bg-gray-50"
        style={{ minHeight: '44px' }}
      >
        {locale === 'es' ? 'ZH' : 'ES'}
      </button>

      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="text-center">
          <div className="text-6xl mb-2">🍺</div>
          <h1 className="text-4xl font-black" style={{ color: '#f97316' }}>
            BarGo
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{t('login.subtitle')}</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all"
              style={{
                borderColor: i < pin.length ? '#f97316' : '#e5e7eb',
                backgroundColor: i < pin.length ? '#fff7ed' : '#f9fafb',
              }}
            >
              {i < pin.length ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center font-medium">{error}</p>
        )}

        {/* Keypad */}
        <div className="w-full max-w-xs">
          <div className="grid grid-cols-3 gap-3">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => handleDigit(k)}
                disabled={loading}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 shadow text-2xl font-bold text-gray-800 transition-colors disabled:opacity-50"
                style={{ minHeight: '60px' }}
              >
                {k}
              </button>
            ))}
            {/* Bottom row: backspace, 0, submit */}
            <button
              onClick={handleBackspace}
              disabled={loading}
              className="rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 shadow text-2xl font-bold text-gray-800 transition-colors disabled:opacity-50"
              style={{ minHeight: '60px' }}
            >
              ⌫
            </button>
            <button
              onClick={() => handleDigit('0')}
              disabled={loading}
              className="rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 shadow text-2xl font-bold text-gray-800 transition-colors disabled:opacity-50"
              style={{ minHeight: '60px' }}
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || pin.length === 0}
              className="rounded-xl text-white shadow text-2xl font-bold transition-colors disabled:opacity-50"
              style={{
                minHeight: '60px',
                backgroundColor: '#f97316',
              }}
            >
              {loading ? '...' : '✓'}
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-orange-500 text-sm">{t('login.loading')}</p>
        )}
      </div>
    </div>
  )
}
