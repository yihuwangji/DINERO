export interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'waiter' | 'bar' | 'kitchen'
  pin: string
  created_at?: string
}

export interface Table {
  id: string
  number: number
  zone?: string
  status: 'free' | 'occupied'
  created_at?: string
}

export interface Category {
  id: string
  name_es: string
  name_zh: string
  station: 'bar' | 'kitchen'
  sort_order: number
  active: boolean
  created_at?: string
}

export interface Product {
  id: string
  name_es: string
  name_zh: string
  price: number
  category_id: string
  category?: Category
  active: boolean
  image_url?: string
  created_at?: string
}

export interface Order {
  id: string
  table_id: string
  table?: Table
  waiter_id: string
  status: 'open' | 'closed'
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  name_es: string
  name_zh: string
  price: number
  qty: number
  note?: string
  status: 'pending' | 'ready'
  station: 'bar' | 'kitchen'
  created_at?: string
}

export interface CartItem {
  product: Product
  qty: number
  note?: string
}
