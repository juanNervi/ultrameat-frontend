import type {
  AccountingRow,
  AppData,
  Channel,
  ChannelAgg,
  Client,
  CreditStatus,
  CutAgg,
  Sale,
} from '~/types'
import { IVA_RATE } from '~/types'
import { createSeedData } from '../data/seed'

const STORAGE_KEY = 'ultrameat-demo-v2'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthPrefix(iso: string) {
  return iso.slice(0, 7)
}

function saleAmount(s: Sale) {
  return s.kg * s.pricePerKg
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`
}

function isValidData(raw: unknown): raw is AppData {
  if (!raw || typeof raw !== 'object') return false
  const d = raw as AppData
  return Array.isArray(d.channels) && Array.isArray(d.clients) && Array.isArray(d.sales)
}

function loadRaw(): AppData {
  if (import.meta.client) {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (isValidData(parsed)) return parsed
      } catch {
        /* fallthrough */
      }
    }
  }
  return createSeedData()
}

function persist(data: AppData) {
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

function syncCreditUsed(data: AppData): AppData {
  const open = new Map<string, number>()
  for (const s of data.sales) {
    if (s.status !== 'confirmada') continue
    open.set(s.clientId, (open.get(s.clientId) ?? 0) + saleAmount(s) * 0.35)
  }

  return {
    ...data,
    clients: data.clients.map((c) => {
      const computed = open.get(c.id)
      if (computed == null) return c
      const blended = Math.min(c.creditLimit, Math.round(c.creditUsed * 0.55 + computed * 0.45))
      return { ...c, creditUsed: blended }
    }),
  }
}

export function useDemoStore() {
  const data = useState<AppData>('demo-data', () => createSeedData())
  const hydrated = useState('demo-hydrated', () => false)

  function ensureHydrated() {
    if (!import.meta.client || hydrated.value) return
    data.value = syncCreditUsed(loadRaw())
    hydrated.value = true
  }

  function save() {
    persist(data.value)
  }

  function resetDemo() {
    data.value = syncCreditUsed(createSeedData())
    save()
  }

  function getCut(id: string) {
    return data.value.cuts.find((c) => c.id === id)
  }

  function getChannel(id: string) {
    return data.value.channels.find((c) => c.id === id)
  }

  function getClient(id: string) {
    return data.value.clients.find((c) => c.id === id)
  }

  function clientsByChannel(channelId: string) {
    return data.value.clients.filter((c) => c.channelId === channelId)
  }

  function creditStatus(clientId: string): CreditStatus | null {
    const client = getClient(clientId)
    if (!client) return null
    const available = client.blocked
      ? 0
      : Math.max(0, client.creditLimit - client.creditUsed)
    const utilization = client.creditLimit === 0 ? 0 : client.creditUsed / client.creditLimit
    let level: CreditStatus['level'] = 'ok'
    if (client.blocked || utilization >= 1) level = 'bloqueado'
    else if (utilization >= 0.8) level = 'alerta'
    return { client, available, utilization, level }
  }

  function allCreditStatuses(): CreditStatus[] {
    return data.value.clients
      .map((c) => creditStatus(c.id)!)
      .sort((a, b) => b.utilization - a.utilization)
  }

  function salesInRange(from: string, to: string) {
    return data.value.sales.filter((s) => s.date >= from && s.date <= to)
  }

  function salesOn(date: string) {
    return data.value.sales.filter((s) => s.date === date)
  }

  function salesMonth(iso: string) {
    const prefix = monthPrefix(iso)
    return data.value.sales.filter((s) => s.date.startsWith(prefix))
  }

  function aggregateByCut(sales: Sale[]): CutAgg[] {
    const map = new Map<string, CutAgg>()
    for (const s of sales) {
      const cut = getCut(s.cutId)
      const cur = map.get(s.cutId) ?? {
        cutId: s.cutId,
        name: cut?.name ?? s.cutId,
        kg: 0,
        amount: 0,
      }
      cur.kg += s.kg
      cur.amount += saleAmount(s)
      map.set(s.cutId, cur)
    }
    return [...map.values()].sort((a, b) => b.kg - a.kg)
  }

  function aggregateByChannel(sales: Sale[]): ChannelAgg[] {
    const map = new Map<string, ChannelAgg>()
    for (const s of sales) {
      const client = getClient(s.clientId)
      const channelId = client?.channelId ?? 'sin-canal'
      const channel = getChannel(channelId)
      const cur = map.get(channelId) ?? {
        channelId,
        name: channel?.name ?? 'Sin canal',
        kg: 0,
        amount: 0,
      }
      cur.kg += s.kg
      cur.amount += saleAmount(s)
      map.set(channelId, cur)
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount)
  }

  function totals(sales: Sale[]) {
    const kg = sales.reduce((a, s) => a + s.kg, 0)
    const amount = sales.reduce((a, s) => a + saleAmount(s), 0)
    return { kg, amount, avgPrice: kg ? amount / kg : 0, count: sales.length }
  }

  function dailyTrend(days = 30) {
    const end = todayIso()
    const points: { date: string; kg: number; amount: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = shiftIso(end, -i)
      const t = totals(salesOn(date))
      points.push({ date, kg: Math.round(t.kg), amount: Math.round(t.amount) })
    }
    return points
  }

  function pctChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / previous) * 100
  }

  function dashboardKpis() {
    const today = todayIso()
    const yesterday = shiftIso(today, -1)
    const lastMonthSame = (() => {
      const d = new Date(`${today}T12:00:00`)
      d.setMonth(d.getMonth() - 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()

    const tToday = totals(salesOn(today))
    const tYday = totals(salesOn(yesterday))
    const tMonth = totals(salesMonth(today))
    const tPrevDayMonth = totals(salesOn(lastMonthSame))

    const credits = allCreditStatuses()
    const alertCount = credits.filter((c) => c.level === 'alerta').length
    const blockedCount = credits.filter((c) => c.level === 'bloqueado').length
    const exposure = credits.reduce((a, c) => a + c.client.creditUsed, 0)
    const limitTotal = credits.reduce((a, c) => a + c.client.creditLimit, 0)
    const avgCreditDays =
      credits.reduce((a, c) => a + c.client.creditDays, 0) / Math.max(1, credits.length)
    const dso = Math.round(
      avgCreditDays * (exposure / Math.max(1, tMonth.amount / 30 || 1)) * 0.08 + avgCreditDays,
    )

    const todaySales = salesOn(today)
    const pending = todaySales.filter((s) => s.status === 'pendiente').length
    const confirmed = todaySales.filter((s) => s.status === 'confirmada').length

    return {
      today: tToday,
      yesterday: tYday,
      month: tMonth,
      vsYesterday: pctChange(tToday.kg, tYday.kg),
      vsLastMonthDay: pctChange(tToday.kg, tPrevDayMonth.kg),
      byCutToday: aggregateByCut(todaySales),
      byCutMonth: aggregateByCut(salesMonth(today)),
      topChannels: aggregateByChannel(salesMonth(today)).slice(0, 5),
      trend: dailyTrend(30),
      alertCount,
      blockedCount,
      exposure,
      utilizationGlobal: limitTotal ? exposure / limitTotal : 0,
      avgCreditDays,
      dso,
      pending,
      confirmed,
      todayIso: today,
    }
  }

  function addChannel(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false as const, reason: 'El nombre del canal es obligatorio.' }
    const channel: Channel = { id: newId('ch'), name: trimmed }
    data.value = { ...data.value, channels: [...data.value.channels, channel] }
    save()
    return { ok: true as const, channel }
  }

  function updateChannel(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false as const, reason: 'El nombre del canal es obligatorio.' }
    data.value = {
      ...data.value,
      channels: data.value.channels.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    }
    save()
    return { ok: true as const }
  }

  function deleteChannel(id: string) {
    const hasClients = data.value.clients.some((c) => c.channelId === id)
    if (hasClients) {
      return {
        ok: false as const,
        reason: 'No se puede borrar: el canal todavía tiene clientes. Borrá o mové los clientes antes.',
      }
    }
    data.value = {
      ...data.value,
      channels: data.value.channels.filter((c) => c.id !== id),
    }
    save()
    return { ok: true as const }
  }

  function addClient(
    input: Omit<Client, 'id' | 'creditUsed'> & { creditUsed?: number },
  ) {
    if (!input.name.trim()) return { ok: false as const, reason: 'El nombre es obligatorio.' }
    if (!getChannel(input.channelId)) {
      return { ok: false as const, reason: 'Canal inválido.' }
    }
    const client: Client = {
      id: newId('cli'),
      channelId: input.channelId,
      name: input.name.trim(),
      rut: input.rut.trim(),
      creditLimit: Number(input.creditLimit) || 0,
      creditUsed: Number(input.creditUsed) || 0,
      creditDays: input.creditDays,
      blocked: Boolean(input.blocked),
    }
    data.value = { ...data.value, clients: [...data.value.clients, client] }
    save()
    return { ok: true as const, client }
  }

  function updateClient(id: string, patch: Partial<Omit<Client, 'id'>>) {
    const existing = getClient(id)
    if (!existing) return { ok: false as const, reason: 'Cliente no encontrado.' }
    if (patch.channelId && !getChannel(patch.channelId)) {
      return { ok: false as const, reason: 'Canal inválido.' }
    }
    data.value = {
      ...data.value,
      clients: data.value.clients.map((c) => {
        if (c.id !== id) return c
        return {
          ...c,
          ...patch,
          name: patch.name != null ? patch.name.trim() : c.name,
          rut: patch.rut != null ? patch.rut.trim() : c.rut,
          creditLimit:
            patch.creditLimit != null ? Number(patch.creditLimit) : c.creditLimit,
          creditUsed:
            patch.creditUsed != null ? Number(patch.creditUsed) : c.creditUsed,
          blocked: patch.blocked != null ? Boolean(patch.blocked) : c.blocked,
        }
      }),
    }
    save()
    return { ok: true as const }
  }

  function deleteClient(id: string) {
    const hasSales = data.value.sales.some((s) => s.clientId === id)
    if (hasSales) {
      return {
        ok: false as const,
        reason: 'No se puede borrar: el cliente tiene ventas registradas. Podés bloquearlo en su lugar.',
      }
    }
    data.value = {
      ...data.value,
      clients: data.value.clients.filter((c) => c.id !== id),
    }
    save()
    return { ok: true as const }
  }

  function addSale(input: Omit<Sale, 'id'>) {
    const status = creditStatus(input.clientId)
    const amount = input.kg * input.pricePerKg
    if (status?.client.blocked && input.status === 'confirmada') {
      return { ok: false as const, reason: 'Cliente bloqueado: no se puede confirmar la venta.' }
    }
    if (status && amount > status.available && input.status === 'confirmada') {
      return { ok: false as const, reason: 'Crédito insuficiente para confirmar esta venta.' }
    }

    const sale: Sale = {
      ...input,
      id: newId('sale'),
    }

    data.value = {
      ...data.value,
      sales: [sale, ...data.value.sales],
      clients: data.value.clients.map((c) => {
        if (c.id !== input.clientId || input.status !== 'confirmada') return c
        return { ...c, creditUsed: Math.min(c.creditLimit, c.creditUsed + amount) }
      }),
    }
    save()
    return { ok: true as const, sale }
  }

  function deleteSale(id: string) {
    const sale = data.value.sales.find((s) => s.id === id)
    if (!sale) return
    const amount = saleAmount(sale)
    data.value = {
      ...data.value,
      sales: data.value.sales.filter((s) => s.id !== id),
      clients: data.value.clients.map((c) => {
        if (c.id !== sale.clientId || sale.status !== 'confirmada') return c
        return { ...c, creditUsed: Math.max(0, c.creditUsed - amount) }
      }),
    }
    save()
  }

  function updateSaleStatus(id: string, status: Sale['status']) {
    const sale = data.value.sales.find((s) => s.id === id)
    if (!sale || sale.status === status) return { ok: true as const }

    if (status === 'confirmada') {
      const cs = creditStatus(sale.clientId)
      const amount = saleAmount(sale)
      if (cs?.client.blocked) {
        return { ok: false as const, reason: 'Cliente bloqueado.' }
      }
      if (cs && amount > cs.available) {
        return { ok: false as const, reason: 'Crédito insuficiente para confirmar.' }
      }
    }

    const amount = saleAmount(sale)
    data.value = {
      ...data.value,
      sales: data.value.sales.map((s) => (s.id === id ? { ...s, status } : s)),
      clients: data.value.clients.map((c) => {
        if (c.id !== sale.clientId) return c
        if (sale.status === 'pendiente' && status === 'confirmada') {
          return { ...c, creditUsed: Math.min(c.creditLimit, c.creditUsed + amount) }
        }
        if (sale.status === 'confirmada' && status === 'pendiente') {
          return { ...c, creditUsed: Math.max(0, c.creditUsed - amount) }
        }
        return c
      }),
    }
    save()
    return { ok: true as const }
  }

  function accountingRows(from: string, to: string): AccountingRow[] {
    const sales = salesInRange(from, to).filter((s) => s.status === 'confirmada')
    const map = new Map<string, AccountingRow>()
    for (const s of sales) {
      const client = getClient(s.clientId)
      const neto = saleAmount(s)
      const cur = map.get(s.clientId) ?? {
        clientId: s.clientId,
        clientName: client?.name ?? s.clientId,
        rut: client?.rut ?? '',
        kg: 0,
        neto: 0,
        iva: 0,
        total: 0,
      }
      cur.kg += s.kg
      cur.neto += neto
      cur.iva = cur.neto * IVA_RATE
      cur.total = cur.neto + cur.iva
      map.set(s.clientId, cur)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }

  return {
    data,
    ensureHydrated,
    resetDemo,
    getCut,
    getChannel,
    getClient,
    clientsByChannel,
    creditStatus,
    allCreditStatuses,
    salesOn,
    salesMonth,
    salesInRange,
    aggregateByCut,
    aggregateByChannel,
    totals,
    dashboardKpis,
    addChannel,
    updateChannel,
    deleteChannel,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    deleteSale,
    updateSaleStatus,
    accountingRows,
    todayIso,
    shiftIso,
  }
}
