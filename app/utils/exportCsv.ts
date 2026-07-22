import type { AccountingRow } from '~/types'

export function downloadAccountingCsv(rows: AccountingRow[], from: string, to: string) {
  const header = ['Cliente', 'RUT', 'Kg', 'Neto UYU', 'IVA 22%', 'Total UYU']
  const lines = rows.map((r) =>
    [
      `"${r.clientName}"`,
      r.rut,
      r.kg.toFixed(1),
      r.neto.toFixed(2),
      r.iva.toFixed(2),
      r.total.toFixed(2),
    ].join(','),
  )

  const totals = rows.reduce(
    (a, r) => ({
      kg: a.kg + r.kg,
      neto: a.neto + r.neto,
      iva: a.iva + r.iva,
      total: a.total + r.total,
    }),
    { kg: 0, neto: 0, iva: 0, total: 0 },
  )

  lines.push(
    [
      '"TOTAL"',
      '',
      totals.kg.toFixed(1),
      totals.neto.toFixed(2),
      totals.iva.toFixed(2),
      totals.total.toFixed(2),
    ].join(','),
  )

  const bom = '\uFEFF'
  const csv = bom + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ultra-meat-contable_${from}_${to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
