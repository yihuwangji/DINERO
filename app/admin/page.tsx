'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/lib/i18n'
import { Profile, Table, Category, Product } from '@/lib/types'

type AdminTab = 'tables' | 'menu' | 'staff'

interface TableForm { number: string; zone: string; status: 'free' | 'occupied' }
interface CategoryForm { name_es: string; name_zh: string; station: 'bar' | 'kitchen'; sort_order: string; active: boolean }
interface ProductForm { name_es: string; name_zh: string; price: string; category_id: string; active: boolean }
interface StaffForm { full_name: string; role: 'admin' | 'waiter' | 'bar' | 'kitchen'; pin: string }

const emptyTableForm: TableForm = { number: '', zone: '', status: 'free' }
const emptyCategoryForm: CategoryForm = { name_es: '', name_zh: '', station: 'bar', sort_order: '0', active: true }
const emptyProductForm: ProductForm = { name_es: '', name_zh: '', price: '', category_id: '', active: true }
const emptyStaffForm: StaffForm = { full_name: '', role: 'waiter', pin: '' }

export default function AdminPage() {
  const router = useRouter()
  const { locale, setLocale, t } = useLocale()
  const [tab, setTab] = useState<AdminTab>('tables')

  // Tables state
  const [tables, setTables] = useState<Table[]>([])
  const [tableModal, setTableModal] = useState(false)
  const [tableForm, setTableForm] = useState<TableForm>(emptyTableForm)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [catModal, setCatModal] = useState(false)
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategoryForm)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [prodModal, setProdModal] = useState(false)
  const [prodForm, setProdForm] = useState<ProductForm>(emptyProductForm)
  const [editingProdId, setEditingProdId] = useState<string | null>(null)

  // Staff state
  const [staff, setStaff] = useState<Profile[]>([])
  const [staffModal, setStaffModal] = useState(false)
  const [staffForm, setStaffForm] = useState<StaffForm>(emptyStaffForm)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('bargo_profile')
    if (!stored) { router.push('/'); return }
    const p = JSON.parse(stored) as Profile
    if (p.role !== 'admin') { router.push('/'); return }
  }, [router])

  const loadAll = useCallback(async () => {
    const [{ data: tbls }, { data: cats }, { data: prods }, { data: st }] = await Promise.all([
      supabase.from('tables').select('*').order('number'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('name_es'),
      supabase.from('profiles').select('*').order('full_name'),
    ])
    if (tbls) setTables(tbls)
    if (cats) { setCategories(cats); if (!selectedCatId && cats.length > 0) setSelectedCatId(cats[0].id) }
    if (prods) setProducts(prods)
    if (st) setStaff(st)
  }, [selectedCatId])

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Tables CRUD
  const saveTable = async () => {
    const payload = { number: parseInt(tableForm.number), zone: tableForm.zone || null, status: tableForm.status }
    if (editingTableId) {
      await supabase.from('tables').update(payload).eq('id', editingTableId)
    } else {
      await supabase.from('tables').insert(payload)
    }
    setTableModal(false); setEditingTableId(null); setTableForm(emptyTableForm)
    const { data } = await supabase.from('tables').select('*').order('number')
    if (data) setTables(data)
  }
  const deleteTable = async (id: string) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await supabase.from('tables').delete().eq('id', id)
    setTables((prev) => prev.filter((x) => x.id !== id))
  }

  // Categories CRUD
  const saveCat = async () => {
    const payload = { name_es: catForm.name_es, name_zh: catForm.name_zh, station: catForm.station, sort_order: parseInt(catForm.sort_order) || 0, active: catForm.active }
    if (editingCatId) {
      await supabase.from('categories').update(payload).eq('id', editingCatId)
    } else {
      await supabase.from('categories').insert(payload)
    }
    setCatModal(false); setEditingCatId(null); setCatForm(emptyCategoryForm)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data) setCategories(data)
  }
  const deleteCat = async (id: string) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories((prev) => prev.filter((x) => x.id !== id))
    if (selectedCatId === id) setSelectedCatId(null)
  }

  // Products CRUD
  const saveProd = async () => {
    const payload = { name_es: prodForm.name_es, name_zh: prodForm.name_zh, price: parseFloat(prodForm.price) || 0, category_id: prodForm.category_id, active: prodForm.active }
    if (editingProdId) {
      await supabase.from('products').update(payload).eq('id', editingProdId)
    } else {
      await supabase.from('products').insert(payload)
    }
    setProdModal(false); setEditingProdId(null); setProdForm(emptyProductForm)
    const { data } = await supabase.from('products').select('*').order('name_es')
    if (data) setProducts(data)
  }
  const deleteProd = async (id: string) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((x) => x.id !== id))
  }

  // Staff CRUD
  const saveStaff = async () => {
    const payload = { full_name: staffForm.full_name, role: staffForm.role, pin: staffForm.pin }
    if (editingStaffId) {
      await supabase.from('profiles').update(payload).eq('id', editingStaffId)
    } else {
      await supabase.from('profiles').insert(payload)
    }
    setStaffModal(false); setEditingStaffId(null); setStaffForm(emptyStaffForm)
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    if (data) setStaff(data)
  }
  const deleteStaff = async (id: string) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await supabase.from('profiles').delete().eq('id', id)
    setStaff((prev) => prev.filter((x) => x.id !== id))
  }

  const filteredProducts = selectedCatId ? products.filter((p) => p.category_id === selectedCatId) : products

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow">
        <div className="flex items-center gap-2">
          <span>🍺</span>
          <span className="font-bold">{t('admin.title')}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLocale(locale === 'es' ? 'zh' : 'es')} className="text-xs bg-white/20 px-2 py-1 rounded-lg">{locale === 'es' ? 'ES' : '中'}</button>
          <button onClick={() => { localStorage.removeItem('bargo_profile'); router.push('/') }} className="text-xs bg-white/20 px-2 py-1 rounded-lg">{t('nav.logout')}</button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex bg-white border-b border-gray-200 sticky top-14 z-10">
        {(['tables', 'menu', 'staff'] as AdminTab[]).map((tab_) => (
          <button key={tab_} onClick={() => setTab(tab_)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === tab_ ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}>
            {t(`admin.${tab_ === 'tables' ? 'tables' : tab_ === 'menu' ? 'menu' : 'staff'}`)}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {/* TABLES TAB */}
        {tab === 'tables' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">{t('admin.tables')}</h2>
              <button onClick={() => { setEditingTableId(null); setTableForm(emptyTableForm); setTableModal(true) }}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform">
                + {t('admin.add')}
              </button>
            </div>
            {tables.length === 0 && <p className="text-gray-400 text-center mt-8">{t('admin.no_tables')}</p>}
            <div className="space-y-2">
              {tables.map((table) => (
                <div key={table.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">{t('admin.table_number')} {table.number}</span>
                    {table.zone && <span className="ml-2 text-xs text-gray-400">{table.zone}</span>}
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${table.status === 'free' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-gray-500">{table.status === 'free' ? t('admin.free') : t('admin.occupied')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTableId(table.id); setTableForm({ number: String(table.number), zone: table.zone ?? '', status: table.status }); setTableModal(true) }}
                      className="p-2 text-blue-500 bg-blue-50 rounded-lg text-sm">✏️</button>
                    <button onClick={() => deleteTable(table.id)} className="p-2 text-red-500 bg-red-50 rounded-lg text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {tab === 'menu' && (
          <div>
            {/* Categories section */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-800">{t('admin.categories')}</h2>
              <button onClick={() => { setEditingCatId(null); setCatForm(emptyCategoryForm); setCatModal(true) }}
                className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium">
                + {t('admin.add')}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {categories.length === 0 && <p className="text-gray-400 text-sm">{t('admin.no_categories')}</p>}
              {categories.map((cat) => (
                <div key={cat.id} className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl border cursor-pointer transition-all ${selectedCatId === cat.id ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}`}
                  onClick={() => setSelectedCatId(cat.id)}>
                  <span className="text-sm font-medium text-gray-700">{locale === 'es' ? cat.name_es : cat.name_zh}</span>
                  <span className="text-xs text-gray-400 ml-1">{cat.station === 'bar' ? '🍺' : '🍳'}</span>
                  <button onClick={(e) => { e.stopPropagation(); setEditingCatId(cat.id); setCatForm({ name_es: cat.name_es, name_zh: cat.name_zh, station: cat.station, sort_order: String(cat.sort_order), active: cat.active }); setCatModal(true) }}
                    className="ml-1 text-blue-400 text-xs">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCat(cat.id) }} className="text-red-400 text-xs">✕</button>
                </div>
              ))}
            </div>

            {/* Products section */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-800">{t('admin.products')}</h2>
              <button onClick={() => { setEditingProdId(null); setProdForm({ ...emptyProductForm, category_id: selectedCatId ?? '' }); setProdModal(true) }}
                className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium">
                + {t('admin.add')}
              </button>
            </div>
            {filteredProducts.length === 0 && <p className="text-gray-400 text-center mt-4">{t('admin.no_products')}</p>}
            <div className="space-y-2">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{locale === 'es' ? prod.name_es : prod.name_zh}</div>
                    <div className="text-xs text-gray-400">{locale === 'es' ? prod.name_zh : prod.name_es}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-orange-500 font-bold text-sm">{prod.price.toFixed(2)}€</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${prod.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {prod.active ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProdId(prod.id); setProdForm({ name_es: prod.name_es, name_zh: prod.name_zh, price: String(prod.price), category_id: prod.category_id, active: prod.active }); setProdModal(true) }}
                      className="p-2 text-blue-500 bg-blue-50 rounded-lg text-sm">✏️</button>
                    <button onClick={() => deleteProd(prod.id)} className="p-2 text-red-500 bg-red-50 rounded-lg text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {tab === 'staff' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">{t('admin.staff')}</h2>
              <button onClick={() => { setEditingStaffId(null); setStaffForm(emptyStaffForm); setStaffModal(true) }}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
                + {t('admin.add')}
              </button>
            </div>
            {staff.length === 0 && <p className="text-gray-400 text-center mt-8">{t('admin.no_staff')}</p>}
            <div className="space-y-2">
              {staff.map((member) => (
                <div key={member.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">{member.full_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {t(`admin.role_${member.role}`)}
                      </span>
                      <span className="text-xs text-gray-400">PIN: {'•'.repeat(member.pin.length)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingStaffId(member.id); setStaffForm({ full_name: member.full_name, role: member.role, pin: member.pin }); setStaffModal(true) }}
                      className="p-2 text-blue-500 bg-blue-50 rounded-lg text-sm">✏️</button>
                    <button onClick={() => deleteStaff(member.id)} className="p-2 text-red-500 bg-red-50 rounded-lg text-sm">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table Modal */}
      {tableModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTableModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">{editingTableId ? t('admin.edit') : t('admin.add')} Mesa</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.table_number')}</label>
              <input type="number" value={tableForm.number} onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.table_zone')}</label>
              <input type="text" value={tableForm.zone} onChange={(e) => setTableForm({ ...tableForm, zone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.table_status')}</label>
              <select value={tableForm.status} onChange={(e) => setTableForm({ ...tableForm, status: e.target.value as 'free' | 'occupied' })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400">
                <option value="free">{t('admin.free')}</option>
                <option value="occupied">{t('admin.occupied')}</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setTableModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 font-medium text-gray-600">{t('admin.cancel')}</button>
              <button onClick={saveTable} className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-medium">{t('admin.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCatModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">{editingCatId ? t('admin.edit') : t('admin.add')} Categoría</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.category_name_es')}</label>
              <input value={catForm.name_es} onChange={(e) => setCatForm({ ...catForm, name_es: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.category_name_zh')}</label>
              <input value={catForm.name_zh} onChange={(e) => setCatForm({ ...catForm, name_zh: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.category_station')}</label>
              <select value={catForm.station} onChange={(e) => setCatForm({ ...catForm, station: e.target.value as 'bar' | 'kitchen' })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400">
                <option value="bar">{t('admin.bar')}</option>
                <option value="kitchen">{t('admin.kitchen')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.category_sort')}</label>
              <input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm text-gray-700">{t('admin.product_active')}</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCatModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 font-medium text-gray-600">{t('admin.cancel')}</button>
              <button onClick={saveCat} className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-medium">{t('admin.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {prodModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProdModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-800">{editingProdId ? t('admin.edit') : t('admin.add')} Producto</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.product_name_es')}</label>
              <input value={prodForm.name_es} onChange={(e) => setProdForm({ ...prodForm, name_es: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.product_name_zh')}</label>
              <input value={prodForm.name_zh} onChange={(e) => setProdForm({ ...prodForm, name_zh: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.product_price')}</label>
              <input type="number" step="0.01" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.product_category')}</label>
              <select value={prodForm.category_id} onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400">
                <option value="">-- {t('admin.product_category')} --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{locale === 'es' ? cat.name_es : cat.name_zh}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={prodForm.active} onChange={(e) => setProdForm({ ...prodForm, active: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm text-gray-700">{t('admin.product_active')}</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setProdModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 font-medium text-gray-600">{t('admin.cancel')}</button>
              <button onClick={saveProd} className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-medium">{t('admin.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStaffModal(false)} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">{editingStaffId ? t('admin.edit') : t('admin.add')} Personal</h3>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.staff_name')}</label>
              <input value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.staff_role')}</label>
              <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as StaffForm['role'] })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400">
                <option value="admin">{t('admin.role_admin')}</option>
                <option value="waiter">{t('admin.role_waiter')}</option>
                <option value="bar">{t('admin.role_bar')}</option>
                <option value="kitchen">{t('admin.role_kitchen')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">{t('admin.staff_pin')}</label>
              <input type="password" value={staffForm.pin} onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStaffModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 font-medium text-gray-600">{t('admin.cancel')}</button>
              <button onClick={saveStaff} className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-medium">{t('admin.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
