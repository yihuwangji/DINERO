'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLocale, TranslationKey } from '@/lib/i18n'
import { Profile, OrderItem } from '@/lib/types'

interface StationItem extends OrderItem {
  table_number?: number
  order_created_at?: string
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 520
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch {}
}

function timeAgo(createdAt: string, t: (k: TranslationKey) => string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (diff < 60) return `${diff}${t('kitchen.sec')} ${t('kitchen.ago')}`
  return `${Math.floor(diff / 60)}${t('kitchen.min')} ${t('kitchen.ago')}`
}

export default function KitchenPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useLocale()
  const [items, setItems] = useState<StationItem[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [, forceUpdate] = useState(0)
  const prevIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('bargo_profile')
    if (!stored) { router.push('/'); return }
    const p = JSON.parse(stored) as Profile
    if (p.role !== 'kitchen' && p.role !== 'admin') { router.push('/'); return }
  }, [router])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => forceUpdate((n) => n + 1), 10000)
    return () => clearInterval(tick)
  }, [])

  const loadItems = useCallback(async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('order_items')
      .select('*, orders!inner(created_at, table_id, tables!inner(number))')
      .eq('station', 'kitchen')
      .in('status', ['pending', 'ready'])
      .gte('orders.created_at', twoHoursAgo)

    if (data) {
      const mapped: StationItem[] = data.map((row: Record<string, unknown>) => {
        const order = row.orders as { created_at: string; table_id: string; tables: { number: number } }
        return {
          ...(row as unknown as OrderItem),
          table_number: order?.tables?.number,
          order_created_at: order?.created_at,
        }
      })
      const sorted = mapped.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return new Date(a.order_created_at ?? 0).getTime() - new Date(b.order_created_at ?? 0).getTime()
      })
      setItems(sorted)
    }
  }, [])

  useEffect(() => {
    loadItems()
    const channel = supabase
      .channel('kitchen-station')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: 'station=eq.kitchen',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as StationItem
          if (!prevIdsRef.current.has(newItem.id) && newItem.status === 'pending') {
            playBeep()
            prevIdsRef.current.add(newItem.id)
          }
          loadItems()
        } else if (payload.eventType === 'UPDATE') {
          loadItems()
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as StationItem).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadItems])

  const markReady = useCallback(async (itemId: string) => {
    await supabase.from('order_items').update({ status: 'ready' }).eq('id', itemId)
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, status: 'ready' } : i))
  }, [])

  const pendingItems = items.filter((i) => i.status === 'pending')
  const readyItems = items.filter((i) => i.status === 'ready')

  return (
    <div className="min-h-screen bg-green-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 py-4 sticky top-0 z-10 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t('kitchen.title')} / 厨房</h1>
            <p className="text-green-200 text-xs">{t('kitchen.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono bg-white/20 px-2 py-1 rounded-lg">
              {currentTime.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button onClick={() => setLocale(locale === 'es' ? 'zh' : 'es')}
              className="text-xs bg-white/20 px-2 py-1 rounded-lg">
              {locale === 'es' ? 'ES' : '中'}
            </button>
            <button onClick={() => { localStorage.removeItem('bargo_profile'); router.push('/') }}
              className="text-xs bg-white/20 px-2 py-1 rounded-lg">
              {t('nav.logout')}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <span className="bg-green-800 text-white text-xs px-3 py-1 rounded-full font-medium">
            {pendingItems.length} {t('kitchen.pending')}
          </span>
          <span className="bg-green-400 text-white text-xs px-3 py-1 rounded-full font-medium">
            {readyItems.length} {t('kitchen.ready')}
          </span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3">
        {items.length === 0 && (
          <div className="text-center text-gray-400 mt-16 text-lg">{t('kitchen.no_orders')}</div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl p-4 shadow-sm border-2 transition-all ${
              item.status === 'pending'
                ? 'bg-green-100 border-green-400'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
                  item.status === 'pending' ? 'bg-green-700 text-white' : 'bg-green-500 text-white'
                }`}>
                  {t('kitchen.table')} {item.table_number ?? '?'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.status === 'pending' ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-700'
                }`}>
                  {item.status === 'pending' ? t('kitchen.pending') : t('kitchen.ready')}
                </span>
              </div>
              {item.order_created_at && (
                <span className="text-xs text-gray-400">{timeAgo(item.order_created_at, t)}</span>
              )}
            </div>
            <div className="mb-2">
              <p className="font-bold text-gray-800 text-base">{item.name_es}</p>
              <p className="text-gray-500 text-sm">{item.name_zh}</p>
              <p className="text-green-700 font-semibold">×{item.qty}</p>
            </div>
            {item.note && (
              <p className="text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2 mb-2">📝 {item.note}</p>
            )}
            {item.status === 'pending' && (
              <button
                onClick={() => markReady(item.id)}
                className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform"
              >
                ✓ {t('kitchen.mark_ready')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
