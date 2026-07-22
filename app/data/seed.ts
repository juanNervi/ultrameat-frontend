import type { AppData, Client, Cut, Sale } from '~/types'

export const CUTS: Cut[] = [
  { id: 'asado', name: 'Asado', defaultPricePerKg: 420 },
  { id: 'pulpon', name: 'Pulpón', defaultPricePerKg: 380 },
  { id: 'vacio', name: 'Vacío', defaultPricePerKg: 450 },
  { id: 'tapa-asado', name: 'Tapa de asado', defaultPricePerKg: 390 },
  { id: 'nalga', name: 'Nalga', defaultPricePerKg: 410 },
  { id: 'bife-angosto', name: 'Bife angosto', defaultPricePerKg: 520 },
  { id: 'cuadril', name: 'Cuadril', defaultPricePerKg: 400 },
  { id: 'entraña', name: 'Entraña', defaultPricePerKg: 560 },
]

export const CLIENTS: Client[] = [
  {
    id: 'disco-mvd',
    name: 'Disco Montevideo',
    channel: 'Cadena supermercado',
    rut: '214567890012',
    creditLimit: 2_500_000,
    creditUsed: 2_150_000,
    creditDays: 30,
  },
  {
    id: 'tienda-inglesa',
    name: 'Tienda Inglesa',
    channel: 'Cadena supermercado',
    rut: '213456780019',
    creditLimit: 3_200_000,
    creditUsed: 1_890_000,
    creditDays: 45,
  },
  {
    id: 'devoto',
    name: 'Devoto Hiper',
    channel: 'Cadena supermercado',
    rut: '212345670015',
    creditLimit: 2_800_000,
    creditUsed: 2_800_000,
    creditDays: 30,
  },
  {
    id: 'tata',
    name: 'Ta-Ta Interior',
    channel: 'Cadena supermercado',
    rut: '211234560011',
    creditLimit: 1_800_000,
    creditUsed: 920_000,
    creditDays: 30,
  },
  {
    id: 'mayorista-sur',
    name: 'Mayorista Sur SA',
    channel: 'Mayorista',
    rut: '219876540018',
    creditLimit: 1_200_000,
    creditUsed: 1_050_000,
    creditDays: 15,
  },
  {
    id: 'carniceria-canelones',
    name: 'Carnicería Los Olivos',
    channel: 'Carnicería',
    rut: '218765430014',
    creditLimit: 450_000,
    creditUsed: 180_000,
    creditDays: 15,
  },
  {
    id: 'grupo-gastron',
    name: 'Grupo Gastronómico Este',
    channel: 'Horeca',
    rut: '217654320010',
    creditLimit: 900_000,
    creditUsed: 640_000,
    creditDays: 30,
  },
  {
    id: 'macro-mdeo',
    name: 'Macro Mercado',
    channel: 'Cadena supermercado',
    rut: '216543210016',
    creditLimit: 1_500_000,
    creditUsed: 710_000,
    creditDays: 45,
  },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function hash(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: string) {
  let s = hash(seed) || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export function buildSeedSales(): Sale[] {
  const sales: Sale[] = []
  let id = 1

  for (let day = 0; day < 45; day++) {
    const date = isoDate(daysAgo(day))
    const rand = rng(`day-${date}`)
    const orders = 6 + Math.floor(rand() * 8)

    for (let i = 0; i < orders; i++) {
      const client = CLIENTS[Math.floor(rand() * CLIENTS.length)]
      const cut = CUTS[Math.floor(rand() * CUTS.length)]
      const kg = Math.round((80 + rand() * 420) * 10) / 10
      const priceJitter = 0.92 + rand() * 0.16
      const pricePerKg = Math.round(cut.defaultPricePerKg * priceJitter)
      const isPending = day === 0 && rand() > 0.7

      sales.push({
        id: `sale-${id++}`,
        date,
        clientId: client.id,
        cutId: cut.id,
        kg,
        pricePerKg,
        notes: isPending ? 'Pendiente de despacho' : undefined,
        status: isPending ? 'pendiente' : 'confirmada',
      })
    }
  }

  return sales
}

export function createSeedData(): AppData {
  return {
    clients: CLIENTS.map((c) => ({ ...c })),
    cuts: CUTS.map((c) => ({ ...c })),
    sales: buildSeedSales(),
  }
}
