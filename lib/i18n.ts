'use client'

import { useState, useEffect, useCallback } from 'react'

export type Locale = 'es' | 'zh'

const translations = {
  es: {
    // Login
    'login.title': 'BarGo',
    'login.subtitle': 'Sistema de pedidos',
    'login.enter_pin': 'Introduce tu PIN',
    'login.submit': '✓',
    'login.backspace': '⌫',
    'login.error': 'PIN incorrecto. Inténtalo de nuevo.',
    'login.loading': 'Verificando...',

    // Nav / General
    'nav.logout': 'Salir',
    'nav.waiter': 'Camarero',
    'nav.bar': 'Barra',
    'nav.kitchen': 'Cocina',
    'nav.admin': 'Admin',
    'general.loading': 'Cargando...',
    'general.error': 'Error al cargar datos',
    'general.save': 'Guardar',
    'general.cancel': 'Cancelar',
    'general.delete': 'Eliminar',
    'general.edit': 'Editar',
    'general.add': 'Añadir',
    'general.close': 'Cerrar',
    'general.confirm': 'Confirmar',
    'general.yes': 'Sí',
    'general.no': 'No',
    'general.active': 'Activo',
    'general.inactive': 'Inactivo',

    // Waiter
    'waiter.select_table': 'Selecciona una mesa',
    'waiter.free': 'Libre',
    'waiter.occupied': 'Ocupada',
    'waiter.categories': 'Categorías',
    'waiter.products': 'Productos',
    'waiter.cart': 'Pedido',
    'waiter.cart_empty': 'El carrito está vacío',
    'waiter.send_order': 'Enviar pedido',
    'waiter.view_order': 'Ver pedido',
    'waiter.order_sent': 'Pedido enviado',
    'waiter.note_placeholder': 'Nota (sin gluten, sin sal...)',
    'waiter.clear_cart': 'Vaciar',
    'waiter.total': 'Total',
    'waiter.items': 'artículos',
    'waiter.ready_items': 'Listos',
    'waiter.pending_items': 'Pendientes',
    'waiter.no_products': 'Sin productos en esta categoría',
    'waiter.select_table_first': 'Selecciona una mesa primero',
    'waiter.order_tab': 'Pedido',
    'waiter.menu_tab': 'Carta',

    // Bar / Kitchen station
    'station.pending': 'Pendiente',
    'station.ready': 'Listo',
    'station.mark_ready': 'Marcar listo',
    'station.table': 'Mesa',
    'station.no_items': 'Sin pedidos pendientes',
    'station.elapsed': 'hace',
    'station.minutes': 'min',
    'station.seconds': 'seg',
    'station.bar_title': 'Barra',
    'station.kitchen_title': 'Cocina',
    'station.bar': 'Barra',
    'station.kitchen': 'Cocina',

    // Admin
    'admin.title': 'Administración',
    'admin.tables_tab': 'Mesas',
    'admin.menu_tab': 'Carta',
    'admin.staff_tab': 'Personal',

    // Admin - Tables
    'admin.tables.title': 'Mesas',
    'admin.tables.number': 'Número',
    'admin.tables.zone': 'Zona',
    'admin.tables.status': 'Estado',
    'admin.tables.add': 'Añadir mesa',
    'admin.tables.edit': 'Editar mesa',

    // Admin - Categories
    'admin.categories.title': 'Categorías',
    'admin.categories.name_es': 'Nombre (ES)',
    'admin.categories.name_zh': 'Nombre (ZH)',
    'admin.categories.station': 'Estación',
    'admin.categories.sort_order': 'Orden',
    'admin.categories.add': 'Añadir categoría',
    'admin.categories.edit': 'Editar categoría',

    // Admin - Products
    'admin.products.title': 'Productos',
    'admin.products.name_es': 'Nombre (ES)',
    'admin.products.name_zh': 'Nombre (ZH)',
    'admin.products.price': 'Precio',
    'admin.products.category': 'Categoría',
    'admin.products.add': 'Añadir producto',
    'admin.products.edit': 'Editar producto',
    'admin.products.select_category': 'Selecciona una categoría',

    // Admin - Staff
    'admin.staff.title': 'Personal',
    'admin.staff.name': 'Nombre',
    'admin.staff.role': 'Rol',
    'admin.staff.pin': 'PIN',
    'admin.staff.add': 'Añadir persona',
    'admin.staff.edit': 'Editar persona',
    'admin.staff.roles.admin': 'Administrador',
    'admin.staff.roles.waiter': 'Camarero',
    'admin.staff.roles.bar': 'Barra',
    'admin.staff.roles.kitchen': 'Cocina',

    // Admin flat keys (used by admin page)
    'admin.menu': 'Carta',
    'admin.confirm_delete': '¿Eliminar este elemento?',
    'admin.tables': 'Mesas',
    'admin.add': 'Añadir',
    'admin.edit': 'Editar',
    'admin.save': 'Guardar',
    'admin.cancel': 'Cancelar',
    'admin.no_tables': 'Sin mesas',
    'admin.no_categories': 'Sin categorías',
    'admin.no_products': 'Sin productos',
    'admin.no_staff': 'Sin personal',
    'admin.table_number': 'Mesa nº',
    'admin.table_zone': 'Zona',
    'admin.table_status': 'Estado',
    'admin.free': 'Libre',
    'admin.occupied': 'Ocupada',
    'admin.categories': 'Categorías',
    'admin.products': 'Productos',
    'admin.active': 'Activo',
    'admin.inactive': 'Inactivo',
    'admin.staff': 'Personal',
    'admin.bar': 'Barra',
    'admin.kitchen': 'Cocina',
    'admin.category_name_es': 'Nombre (ES)',
    'admin.category_name_zh': 'Nombre (ZH)',
    'admin.category_station': 'Estación',
    'admin.category_sort': 'Orden',
    'admin.product_active': 'Activo',
    'admin.product_name_es': 'Nombre (ES)',
    'admin.product_name_zh': 'Nombre (ZH)',
    'admin.product_price': 'Precio (€)',
    'admin.product_category': 'Categoría',
    'admin.staff_name': 'Nombre',
    'admin.staff_pin': 'PIN',
    'admin.staff_role': 'Rol',
    'admin.role_admin': 'Administrador',
    'admin.role_waiter': 'Camarero',
    'admin.role_bar': 'Barra',
    'admin.role_kitchen': 'Cocina',

    // Bar station flat keys
    'bar.title': 'Barra',
    'bar.subtitle': 'Pedidos en tiempo real',
    'bar.table': 'Mesa',
    'bar.pending': 'Pendiente',
    'bar.ready': 'Listo',
    'bar.mark_ready': 'Marcar listo',
    'bar.no_orders': 'Sin pedidos pendientes',
    'bar.ago': 'hace',
    'bar.min': 'min',
    'bar.sec': 'seg',

    // Kitchen station flat keys
    'kitchen.title': 'Cocina',
    'kitchen.subtitle': 'Pedidos en tiempo real',
    'kitchen.table': 'Mesa',
    'kitchen.pending': 'Pendiente',
    'kitchen.ready': 'Listo',
    'kitchen.mark_ready': 'Marcar listo',
    'kitchen.no_orders': 'Sin pedidos pendientes',
    'kitchen.ago': 'hace',
    'kitchen.min': 'min',
    'kitchen.sec': 'seg',

    // Waiter additional keys
    'waiter.all': 'Todo',
    'waiter.table': 'Mesa',
    'waiter.confirm_order': 'Confirmar pedido',
    'waiter.order_error': 'Error al enviar pedido',
  },
  zh: {
    // Login
    'login.title': 'BarGo',
    'login.subtitle': '点餐系统',
    'login.enter_pin': '输入PIN码',
    'login.submit': '✓',
    'login.backspace': '⌫',
    'login.error': 'PIN码错误，请重试。',
    'login.loading': '验证中...',

    // Nav / General
    'nav.logout': '退出',
    'nav.waiter': '服务员',
    'nav.bar': '吧台',
    'nav.kitchen': '厨房',
    'nav.admin': '管理',
    'general.loading': '加载中...',
    'general.error': '加载数据出错',
    'general.save': '保存',
    'general.cancel': '取消',
    'general.delete': '删除',
    'general.edit': '编辑',
    'general.add': '添加',
    'general.close': '关闭',
    'general.confirm': '确认',
    'general.yes': '是',
    'general.no': '否',
    'general.active': '启用',
    'general.inactive': '禁用',

    // Waiter
    'waiter.select_table': '选择桌台',
    'waiter.free': '空闲',
    'waiter.occupied': '使用中',
    'waiter.categories': '分类',
    'waiter.products': '产品',
    'waiter.cart': '订单',
    'waiter.cart_empty': '购物车为空',
    'waiter.send_order': '发送订单',
    'waiter.view_order': '查看订单',
    'waiter.order_sent': '订单已发送',
    'waiter.note_placeholder': '备注（无麸质，无盐...）',
    'waiter.clear_cart': '清空',
    'waiter.total': '合计',
    'waiter.items': '件商品',
    'waiter.ready_items': '已准备',
    'waiter.pending_items': '待处理',
    'waiter.no_products': '此分类下没有产品',
    'waiter.select_table_first': '请先选择桌台',
    'waiter.order_tab': '订单',
    'waiter.menu_tab': '菜单',

    // Bar / Kitchen station
    'station.pending': '待处理',
    'station.ready': '已就绪',
    'station.mark_ready': '标记完成',
    'station.table': '桌',
    'station.no_items': '没有待处理的订单',
    'station.elapsed': '前',
    'station.minutes': '分钟',
    'station.seconds': '秒',
    'station.bar_title': '吧台',
    'station.kitchen_title': '厨房',
    'station.bar': '吧台',
    'station.kitchen': '厨房',

    // Admin
    'admin.title': '管理面板',
    'admin.tables_tab': '桌台',
    'admin.menu_tab': '菜单',
    'admin.staff_tab': '员工',

    // Admin - Tables
    'admin.tables.title': '桌台',
    'admin.tables.number': '编号',
    'admin.tables.zone': '区域',
    'admin.tables.status': '状态',
    'admin.tables.add': '添加桌台',
    'admin.tables.edit': '编辑桌台',

    // Admin - Categories
    'admin.categories.title': '分类',
    'admin.categories.name_es': '名称（西班牙语）',
    'admin.categories.name_zh': '名称（中文）',
    'admin.categories.station': '站台',
    'admin.categories.sort_order': '排序',
    'admin.categories.add': '添加分类',
    'admin.categories.edit': '编辑分类',

    // Admin - Products
    'admin.products.title': '产品',
    'admin.products.name_es': '名称（西班牙语）',
    'admin.products.name_zh': '名称（中文）',
    'admin.products.price': '价格',
    'admin.products.category': '分类',
    'admin.products.add': '添加产品',
    'admin.products.edit': '编辑产品',
    'admin.products.select_category': '选择分类',

    // Admin - Staff
    'admin.staff.title': '员工',
    'admin.staff.name': '姓名',
    'admin.staff.role': '角色',
    'admin.staff.pin': 'PIN码',
    'admin.staff.add': '添加员工',
    'admin.staff.edit': '编辑员工',
    'admin.staff.roles.admin': '管理员',
    'admin.staff.roles.waiter': '服务员',
    'admin.staff.roles.bar': '吧台',
    'admin.staff.roles.kitchen': '厨房',

    // Admin flat keys
    'admin.menu': '菜单',
    'admin.confirm_delete': '确定要删除此项目吗？',
    'admin.tables': '桌台',
    'admin.add': '添加',
    'admin.edit': '编辑',
    'admin.save': '保存',
    'admin.cancel': '取消',
    'admin.no_tables': '暂无桌台',
    'admin.no_categories': '暂无分类',
    'admin.no_products': '暂无产品',
    'admin.no_staff': '暂无员工',
    'admin.table_number': '桌台编号',
    'admin.table_zone': '区域',
    'admin.table_status': '状态',
    'admin.free': '空闲',
    'admin.occupied': '使用中',
    'admin.categories': '分类',
    'admin.products': '产品',
    'admin.active': '启用',
    'admin.inactive': '禁用',
    'admin.staff': '员工',
    'admin.bar': '吧台',
    'admin.kitchen': '厨房',
    'admin.category_name_es': '名称（西语）',
    'admin.category_name_zh': '名称（中文）',
    'admin.category_station': '站台',
    'admin.category_sort': '排序',
    'admin.product_active': '启用',
    'admin.product_name_es': '名称（西语）',
    'admin.product_name_zh': '名称（中文）',
    'admin.product_price': '价格（€）',
    'admin.product_category': '分类',
    'admin.staff_name': '姓名',
    'admin.staff_pin': 'PIN码',
    'admin.staff_role': '角色',
    'admin.role_admin': '管理员',
    'admin.role_waiter': '服务员',
    'admin.role_bar': '吧台',
    'admin.role_kitchen': '厨房',

    // Bar station flat keys
    'bar.title': '吧台',
    'bar.subtitle': '实时订单',
    'bar.table': '桌',
    'bar.pending': '待处理',
    'bar.ready': '已完成',
    'bar.mark_ready': '标记完成',
    'bar.no_orders': '暂无待处理订单',
    'bar.ago': '前',
    'bar.min': '分钟',
    'bar.sec': '秒',

    // Kitchen station flat keys
    'kitchen.title': '厨房',
    'kitchen.subtitle': '实时订单',
    'kitchen.table': '桌',
    'kitchen.pending': '待处理',
    'kitchen.ready': '已完成',
    'kitchen.mark_ready': '标记完成',
    'kitchen.no_orders': '暂无待处理订单',
    'kitchen.ago': '前',
    'kitchen.min': '分钟',
    'kitchen.sec': '秒',

    // Waiter additional keys
    'waiter.all': '全部',
    'waiter.table': '桌',
    'waiter.confirm_order': '确认下单',
    'waiter.order_error': '下单失败，请重试',
  },
} as const

export type TranslationKey = keyof typeof translations.es

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    const stored = localStorage.getItem('bargo_locale') as Locale | null
    if (stored === 'es' || stored === 'zh') {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc)
    localStorage.setItem('bargo_locale', loc)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[locale] as Record<string, string>)[key] ?? key
    },
    [locale]
  )

  return { locale, setLocale, t }
}

// Alias
export const useI18n = useLocale
