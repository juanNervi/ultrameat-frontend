<script setup lang="ts">
import { IVA_RATE } from '~/types'
import { downloadAccountingCsv } from '../utils/exportCsv'

const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const today = store.todayIso()
const from = ref(`${today.slice(0, 7)}-01`)
const to = ref(today)

const rows = computed(() => store.accountingRows(from.value, to.value))

const totals = computed(() =>
  rows.value.reduce(
    (a, r) => ({
      kg: a.kg + r.kg,
      neto: a.neto + r.neto,
      iva: a.iva + r.iva,
      total: a.total + r.total,
    }),
    { kg: 0, neto: 0, iva: 0, total: 0 },
  ),
)

function download() {
  downloadAccountingCsv(rows.value, from.value, to.value)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
        Exportación contable
      </h1>
      <p class="text-muted mt-1">
        Resumen consolidado por cliente para enviar al contador (IVA
        {{ formatNumber(IVA_RATE * 100, 0) }}% Uruguay).
      </p>
    </div>

    <div
      class="rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm text-muted"
    >
      En producción este módulo se alinearía con e-Factura DGI y retenciones según
      régimen. Esta demo exporta CSV listo para la planilla del contador.
    </div>

    <div class="flex flex-col sm:flex-row gap-3 items-end">
      <label class="text-sm">
        <span class="text-muted font-semibold">Desde</span>
        <input
          v-model="from"
          type="date"
          class="mt-1 block rounded-lg border border-cream-dark bg-white px-3 py-2"
        />
      </label>
      <label class="text-sm">
        <span class="text-muted font-semibold">Hasta</span>
        <input
          v-model="to"
          type="date"
          class="mt-1 block rounded-lg border border-cream-dark bg-white px-3 py-2"
        />
      </label>
      <button
        type="button"
        class="rounded-xl bg-alert text-white font-semibold px-5 py-2.5 hover:brightness-110 transition"
        :disabled="!rows.length"
        @click="download"
      >
        Descargar CSV
      </button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard label="Kg período" :value="formatKg(totals.kg)" />
      <KpiCard label="Neto" :value="formatMoney(totals.neto)" />
      <KpiCard label="IVA 22%" :value="formatMoney(totals.iva)" />
      <KpiCard label="Total" :value="formatMoney(totals.total)" tone="ok" />
    </div>

    <div class="rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-cream text-left text-muted">
            <tr>
              <th class="px-4 py-3 font-semibold">Cliente</th>
              <th class="px-4 py-3 font-semibold">RUT</th>
              <th class="px-4 py-3 font-semibold text-right">Kg</th>
              <th class="px-4 py-3 font-semibold text-right">Neto</th>
              <th class="px-4 py-3 font-semibold text-right">IVA 22%</th>
              <th class="px-4 py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.clientId"
              class="border-t border-cream-dark"
            >
              <td class="px-4 py-3 font-semibold text-navy">{{ r.clientName }}</td>
              <td class="px-4 py-3 text-muted">{{ r.rut }}</td>
              <td class="px-4 py-3 text-right">{{ formatNumber(r.kg, 1) }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(r.neto) }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(r.iva) }}</td>
              <td class="px-4 py-3 text-right font-semibold">
                {{ formatMoney(r.total) }}
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="px-4 py-10 text-center text-muted">
                No hay ventas confirmadas en el período.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
