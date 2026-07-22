export interface Session {
  name: string
}

export interface Cut {
  id: string
  name: string
  defaultPricePerKg: number
}

export interface Client {
  id: string
  name: string
  channel: string
  rut: string
  creditLimit: number
  creditUsed: number
  creditDays: 15 | 30 | 45
}

export interface Sale {
  id: string
  date: string
  clientId: string
  cutId: string
  kg: number
  pricePerKg: number
  notes?: string
  status: 'confirmada' | 'pendiente'
}

export interface AppData {
  clients: Client[]
  cuts: Cut[]
  sales: Sale[]
}

export interface CreditStatus {
  client: Client
  available: number
  utilization: number
  level: 'ok' | 'alerta' | 'bloqueado'
}

export interface CutAgg {
  cutId: string
  name: string
  kg: number
  amount: number
}

export interface ChannelAgg {
  clientId: string
  name: string
  channel: string
  kg: number
  amount: number
}

export interface AccountingRow {
  clientId: string
  clientName: string
  rut: string
  kg: number
  neto: number
  iva: number
  total: number
}

export const IVA_RATE = 0.22
export const FLEET_VEHICLES = 7
export const FLEET_CAPACITY_KG_PER_DAY = 14000
