'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/lib/i18n'
import { Profile, Table, Category, Product, CartItem, OrderItem } from '@/lib/types'

export default function WaiterPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useLocale()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [readyCount, setReadyCount] = useState(0)
  const [viewTab, setViewTab] = useState<'menu' | 'order'>('menu')
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([])
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('bargo_profile')
    if (!stored) { router.push('/'); return }
    const p = JSON.parse(stored) as Profile
    if (p.role !== 'waiter' && p.role !== 'admin') { router.push('/'); return }
    setProfile(p)
  }, [router])

  useEffect(() => {
    async function loadData() {
      const [{ data: tbls }, { data: cats }, { data: prods }] = await Promise.all([
        supabase.from('tables').select('*').order('number'),
        supabase.from('categories').select('*').eq('active', true).order('sort_order'),
        supabase.from('products').select('*, category:categories(*)').eq('active', true),
      ])
      if (tbls) setTables(tbls)
      if (cats) setCategories(cats)
      if (prods) setProducts(prods)
    }
    loadData()
  }, [])

  const subscribeToOrder = useCallback(async (tableId: string) => {
    if (subRef.current) {
      await supabase.removeChannel(subRef.current)
      subRef.current = null
    }
    const { data: openOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', tableId)
      .eq('status', 'open')
      .single()

    if (!openOrder) { setReadyCount(0); setCurrentOrderItems([]); return }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', openOrder.id)
    if (items) {
      setCurrentOrderItems(items)
      setReadyCount(items.filter((i) => i.status === 'ready').length)
    }

    const channel = supabase
      .channel(`order-${openOrder.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${openOrder.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCurrentOrderItems((prev) => [...prev, payload.new as OrderItem])
        } else if (payload.eventType === 'UPDATE') {
          setCurrentOrderItems((prev) =>
            prev.map((i) => i.id === (payload.new as OrderItem).id ? payload.new as OrderItem : i)
          )
        } else if (payload.eventType === 'DELETE') {
          setCurrentOrderItems((prev) => prev.filter((i) => i.id !== (payload.old as OrderItem).id))
        }
      })
      .subscribe()
    subRef.current = channel
  }, [])

  useEffect(() => {
    const ready = currentOrderItems.filter((i) => i.status === 'ready').length
    setReadyCount(ready)
  }, [currentOrderItems])

  const handleSelectTable = useCallback((table: Table) => {
    setSelectedTable(table)
    subscribeToOrder(table.id)
    setViewTab('menu')
  }, [subscribeToOrder])

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === productId)
      if (existing && existing.qty > 1) {
        return prev.map((c) => c.product.id === productId ? { ...c, qty: c.qty - 1 } : c)
      }
      return prev.filter((c) => c.product.id !== productId)
    })
  }, [])

  const updateNote = useCallback((productId: string, note: string) => {
    setCart((prev) => prev.map((c) => c.product.id === productId ? { ...c, note } : c))
  }, [])

  const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)

  const handleSubmitOrder = useCallback(async () => {
    if (!selectedTable || !profile || cart.length === 0) return
    setLoading(true)
    try {
      let orderId: string
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', selectedTable.id)
        .eq('status', 'open')
        .single()

      if (existingOrder) {
        orderId = existingOrder.id
      } else {
        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({ table_id: selectedTable.id, waiter_id: profile.id, status: 'open' })
          .select('id')
          .single()
        if (orderErr || !newOrder) throw new Error('Failed to create order')
        orderId = newOrder.id
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)
        setTables((prev) => prev.map((t) => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t))
      }

      const items = cart.map((c) => ({
        order_id: orderId,
        product_id: c.product.id,
        name_es: c.product.name_es,
        name_zh: c.product.name_zh,
        price: c.product.price,
        qty: c.qty,
        note: c.note || null,
        status: 'pending',
        station: c.product.category?.station ?? 'bar',
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(items)
      if (itemsErr) throw new Error('Failed to insert items')

      setCart([])
      setCartOpen(false)
      setToast(t('waiter.order_sent'))
      setTimeout(() => setToast(''), 3000)
      subscribeToOrder(selectedTable.id)
    } catch {
      setToast(t('waiter.order_error'))
      setTimeout(() => setToast(''), 3000)
    }
    setLoading(false)
  }, [selectedTable, profile, cart, t, subscribeToOrder])

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category_id === selectedCategory)

  const getCartQty = (productId: string) => cart.find((c) => c.product.id === productId)?.qty ?? 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍺</span>
          <span className="font-bold text-lg">BarGo</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocale(locale === 'es' ? 'zh' : 'es')}
            className="text-xs bg-white/20 px-2 py-1 rounded-lg font-medium">
            {locale === 'es' ? 'ES' : '中文'}
          </button>
          <button onClick={() => { localStorage.removeItem('bargo_profile'); router.push('/') }}
            className="text-xs bg-white/20 px-2 py-1 rounded-lg">
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="bg-white border-b border-gray-200 px-2 py-2">
        <p className="text-xs text-gray-500 px-2 mb-1">{t('waiter.select_table')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => handleSelectTable(table)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[56px] transition-all ${
                selectedTable?.id === table.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mb-1 ${table.status === 'free' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs font-semibold text-gray-800">{table.number}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Table Info */}
      {selectedTable && (
        <div className="bg-orange-50 px-4 py-2 flex items-center justify-between">
          <span className="font-semibold text-orange-700">
            {t('waiter.table')} {selectedTable.number}
            {selectedTable.zone ? ` · ${selectedTable.zone}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewTab('menu')}
              className={`text-xs px-3 py-1 rounded-lg font-medium ${viewTab === 'menu' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 border border-orange-200'}`}
            >
              Menú
            </button>
            <button
              onClick={() => setViewTab('order')}
              className={`text-xs px-3 py-1 rounded-lg font-medium relative ${viewTab === 'order' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 border border-orange-200'}`}
            >
              {t('waiter.view_order')}
              {readyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {readyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {viewTab === 'menu' ? (
        <>
          {/* Category Tabs */}
          <div className="bg-white border-b border-gray-200 px-2 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {t('waiter.all')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {locale === 'es' ? cat.name_es : cat.name_zh}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 p-3 pb-28 grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const qty = getCartQty(product.id)
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col">
                  <div className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                    {locale === 'es' ? product.name_es : product.name_zh}
                  </div>
                  <div className="text-xs text-gray-400 mb-auto">
                    {locale === 'es' ? product.name_zh : product.name_es}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-orange-500">{product.price.toFixed(2)}€</span>
                    <div className="flex items-center gap-1">
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center active:scale-95"
                          >−</button>
                          <span className="w-6 text-center text-sm font-bold text-gray-800">{qty}</span>
                        </>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center active:scale-95"
                      >+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Order view */
        <div className="flex-1 p-3 pb-20">
          {currentOrderItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Sin artículos en el pedido</div>
          ) : (
            <div className="space-y-2">
              {currentOrderItems.map((item) => (
                <div key={item.id} className={`rounded-xl p-3 border ${item.status === 'ready' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">{locale === 'es' ? item.name_es : item.name_zh}</span>
                      <span className="text-xs text-gray-400 ml-2">×{item.qty}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.status === 'ready' ? '✓ ' + t('waiter.ready_items') : t('bar.pending')}
                    </span>
                  </div>
                  {item.note && <p className="text-xs text-gray-500 mt-1">📝 {item.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Bar */}
      {cart.length > 0 && viewTab === 'menu' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-200 shadow-lg z-30">
          <button
            onClick={() => {
              if (!selectedTable) { setToast(t('waiter.select_table_first')); setTimeout(() => setToast(''), 2000); return }
              setCartOpen(true)
            }}
            className="w-full bg-orange-500 text-white rounded-2xl py-4 flex items-center justify-between px-5 active:scale-95 transition-transform"
          >
            <span className="bg-white/20 text-white text-sm font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
            <span className="font-semibold">{t('waiter.send_order')}</span>
            <span className="font-bold">{cartTotal.toFixed(2)}€</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col max-w-md mx-auto w-full">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{t('waiter.cart')}</h2>
              <div className="flex gap-2">
                <button onClick={() => { setCart([]); setCartOpen(false) }} className="text-sm text-red-500 font-medium px-3 py-1 bg-red-50 rounded-lg">
                  {t('waiter.clear_cart')}
                </button>
                <button onClick={() => setCartOpen(false)} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-2 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-800">
                      {locale === 'es' ? item.product.name_es : item.product.name_zh}
                    </span>
                    <span className="font-bold text-orange-500">{(item.product.price * item.qty).toFixed(2)}€</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => removeFromCart(item.product.id)} className="w-8 h-8 rounded-full bg-gray-200 font-bold flex items-center justify-center">−</button>
                    <span className="font-bold text-gray-800 w-6 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item.product)} className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">+</button>
                    <span className="text-xs text-gray-400">{item.product.price.toFixed(2)}€ c/u</span>
                  </div>
                  <input
                    type="text"
                    placeholder={t('waiter.note_placeholder')}
                    value={item.note ?? ''}
                    onChange={(e) => updateNote(item.product.id, e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">{t('waiter.total')}</span>
                <span className="text-xl font-bold text-orange-500">{cartTotal.toFixed(2)}€</span>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="w-full bg-orange-500 text-white rounded-2xl py-4 font-semibold text-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? '...' : t('waiter.confirm_order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-50 px-4">
          <div className="bg-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-medium shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
