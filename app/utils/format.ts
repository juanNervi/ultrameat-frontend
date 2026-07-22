export function formatKg(value: number) {
  return `${new Intl.NumberFormat('es-UY', { maximumFractionDigits: 1 }).format(value)} kg`
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPct(value: number, digits = 1) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatDateLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}
