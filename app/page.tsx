'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/types'
import { useLocale } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useLocale()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 6) {
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

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLocale('es')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            locale === 'es'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLocale('zh')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            locale === 'zh'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          中文
        </button>
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🍺</div>
        <h1 className="text-4xl font-bold text-orange-500">{t('login.title')}</h1>
        <p className="text-gray-500 mt-1">{t('login.subtitle')}</p>
      </div>

      {/* PIN Display */}
      <div className="w-full max-w-xs mb-6">
        <p className="text-center text-gray-600 mb-3 text-sm">{t('login.enter_pin')}</p>
        <div className="flex justify-center gap-3">
          {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                i < pin.length
                  ? 'bg-orange-500 border-orange-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              {i < pin.length && (
                <span className="w-3 h-3 bg-white rounded-full block" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-3 bg-red-50 py-2 px-3 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-3 gap-3">
          {digits.slice(0, 9).map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={loading}
              className="h-16 bg-white rounded-2xl text-2xl font-semibold text-gray-800 shadow-md active:scale-95 transition-transform border border-gray-100 hover:bg-orange-50 disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          {/* Bottom row: backspace, 0, submit */}
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="h-16 bg-white rounded-2xl text-2xl font-semibold text-gray-600 shadow-md active:scale-95 transition-transform border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
          >
            {t('login.backspace')}
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="h-16 bg-white rounded-2xl text-2xl font-semibold text-gray-800 shadow-md active:scale-95 transition-transform border border-gray-100 hover:bg-orange-50 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pin.length === 0}
            className="h-16 bg-orange-500 rounded-2xl text-2xl font-semibold text-white shadow-md active:scale-95 transition-transform hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '...' : t('login.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
