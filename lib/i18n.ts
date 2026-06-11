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

    // Bar / Kitchen
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

    // Stations
    'station.bar': 'Barra',
    'station.kitchen': 'Cocina',
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

    // Bar / Kitchen
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

    // Stations
    'station.bar': '吧台',
    'station.kitchen': '厨房',
  },
}

export type TranslationKey = keyof typeof translations.es

let currentLocale: Locale = 'es'

export function t(key: TranslationKey, locale?: Locale): string {
  const loc = locale || currentLocale
  return (translations[loc] as Record<string, string>)[key] || key
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    const stored = localStorage.getItem('bargo_locale') as Locale | null
    if (stored === 'es' || stored === 'zh') {
      setLocaleState(stored)
      currentLocale = stored
    }
  }, [])

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc)
    currentLocale = loc
    localStorage.setItem('bargo_locale', loc)
  }, [])

  const translate = useCallback(
    (key: TranslationKey): string => {
      return (translations[locale] as Record<string, string>)[key] || key
    },
    [locale]
  )

  return { locale, setLocale, t: translate }
}
