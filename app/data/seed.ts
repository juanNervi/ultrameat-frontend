import type { AppData, Channel, Client, Cut, Sale } from '~/types'

export const CUTS: Cut[] = [
  { id: 'asado', name: 'Asado', defaultPricePerKg: 420, active: true, stockKg: 2400, costPerKg: 310 },
  { id: 'pulpon', name: 'Pulpón', defaultPricePerKg: 380, active: true, stockKg: 1800, costPerKg: 275 },
  { id: 'vacio', name: 'Vacío', defaultPricePerKg: 450, active: true, stockKg: 950, costPerKg: 340 },
  { id: 'tapa-asado', name: 'Tapa de asado', defaultPricePerKg: 390, active: true, stockKg: 720, costPerKg: 290 },
  { id: 'nalga', name: 'Nalga', defaultPricePerKg: 410, active: true, stockKg: 1600, costPerKg: 300 },
  { id: 'bife-angosto', name: 'Bife angosto', defaultPricePerKg: 520, active: true, stockKg: 480, costPerKg: 400 },
  { id: 'cuadril', name: 'Cuadril', defaultPricePerKg: 400, active: true, stockKg: 1100, costPerKg: 295 },
  { id: 'entraña', name: 'Entraña', defaultPricePerKg: 560, active: true, stockKg: 320, costPerKg: 430 },
]

export const CHANNELS: Channel[] = [
  { id: 'grupo-disco', name: 'Grupo Disco' },
  { id: 'tienda-inglesa', name: 'Tienda Inglesa' },
  { id: 'grupo-devoto', name: 'Grupo Devoto' },
  { id: 'tata', name: 'Ta-Ta' },
  { id: 'mayoristas', name: 'Mayoristas' },
  { id: 'carnicerias', name: 'Carnicerías' },
  { id: 'horeca', name: 'Horeca' },
]

export const CLIENTS: Client[] = [
  {
    id: 'disco-malvin',
    channelId: 'grupo-disco',
    name: 'Disco Sucursal Malvín',
    rut: '214567890012',
    creditLimit: 900_000,
    creditUsed: 780_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'disco-pocitos',
    channelId: 'grupo-disco',
    name: 'Disco Sucursal Pocitos',
    rut: '214567890013',
    creditLimit: 850_000,
    creditUsed: 820_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'disco-centro',
    channelId: 'grupo-disco',
    name: 'Disco Sucursal Centro',
    rut: '214567890014',
    creditLimit: 750_000,
    creditUsed: 550_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'ti-carrasco',
    channelId: 'tienda-inglesa',
    name: 'Tienda Inglesa Carrasco',
    rut: '213456780019',
    creditLimit: 1_600_000,
    creditUsed: 980_000,
    creditDays: 45,
    blocked: false,
  },
  {
    id: 'ti-puntacarretas',
    channelId: 'tienda-inglesa',
    name: 'Tienda Inglesa Punta Carretas',
    rut: '213456780020',
    creditLimit: 1_600_000,
    creditUsed: 910_000,
    creditDays: 45,
    blocked: false,
  },
  {
    id: 'devoto-hiper',
    channelId: 'grupo-devoto',
    name: 'Devoto Hiper',
    rut: '212345670015',
    creditLimit: 1_800_000,
    creditUsed: 1_800_000,
    creditDays: 30,
    blocked: true,
  },
  {
    id: 'devoto-goes',
    channelId: 'grupo-devoto',
    name: 'Devoto Goes',
    rut: '212345670016',
    creditLimit: 1_000_000,
    creditUsed: 420_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'tata-interior',
    channelId: 'tata',
    name: 'Ta-Ta Interior',
    rut: '211234560011',
    creditLimit: 1_800_000,
    creditUsed: 920_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'mayorista-sur',
    channelId: 'mayoristas',
    name: 'Mayorista Sur SA',
    rut: '219876540018',
    creditLimit: 1_200_000,
    creditUsed: 1_050_000,
    creditDays: 15,
    blocked: false,
  },
  {
    id: 'carniceria-olivos',
    channelId: 'carnicerias',
    name: 'Carnicería Los Olivos',
    rut: '218765430014',
    creditLimit: 450_000,
    creditUsed: 180_000,
    creditDays: 15,
    blocked: false,
  },
  {
    id: 'grupo-gastron',
    channelId: 'horeca',
    name: 'Grupo Gastronómico Este',
    rut: '217654320010',
    creditLimit: 900_000,
    creditUsed: 640_000,
    creditDays: 30,
    blocked: false,
  },
  {
    id: 'macro-mdeo',
    channelId: 'mayoristas',
    name: 'Macro Mercado',
    rut: '216543210016',
    creditLimit: 1_500_000,
    creditUsed: 710_000,
    creditDays: 45,
    blocked: false,
  },
]

export const COMERCIALES = ['Martín', 'Diego', 'Ana', 'María'] as const

export function pickComercial(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return COMERCIALES[(h >>> 0) % COMERCIALES.length]
}

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
      const saleId = `sale-${id++}`

      sales.push({
        id: saleId,
        date,
        clientId: client.id,
        cutId: cut.id,
        kg,
        pricePerKg,
        comercial: pickComercial(saleId),
        notes: isPending ? 'Pendiente de despacho' : undefined,
        status: isPending ? 'pendiente' : 'confirmada',
      })
    }
  }

  return sales
}

export function createSeedData(): AppData {
  return {
    channels: CHANNELS.map((c) => ({ ...c })),
    clients: CLIENTS.map((c) => ({ ...c })),
    cuts: CUTS.map((c) => ({ ...c })),
    sales: buildSeedSales(),
    stockEntries: [],
  }
}
