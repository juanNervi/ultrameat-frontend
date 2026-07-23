<script setup lang="ts">
import { FLEET_CAPACITY_KG_PER_DAY, FLEET_VEHICLES } from '~/types'

const store = useDemoStore()

onMounted(() => store.ensureHydrated())

const kpis = computed(() => store.dashboardKpis())

const barData = computed(() => ({
  labels: kpis.value.byCutMonth.map((c) => c.name),
  datasets: [
    {
      label: 'Kg del mes',
      data: kpis.value.byCutMonth.map((c) => Math.round(c.kg)),
      backgroundColor: '#1b2a4a',
      borderRadius: 6,
    },
  ],
}))

const lineData = computed(() => ({
  labels: kpis.value.trend.map((p) => formatDateLabel(p.date)),
  datasets: [
    {
      label: 'Kg / día',
      data: kpis.value.trend.map((p) => p.kg),
      borderColor: '#8fa3b8',
      backgroundColor: 'rgba(143,163,184,0.25)',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
    },
  ],
}))

const mixData = computed(() => {
  const top = kpis.value.byCutToday.slice(0, 5)
  return {
    labels: top.map((c) => c.name),
    datasets: [
      {
        data: top.map((c) => Math.round(c.kg)),
        backgroundColor: ['#1b2a4a', '#8fa3b8', '#e85d04', '#6b7f94', '#c47a00'],
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#5c6570', maxRotation: 45 } },
    y: { grid: { color: '#ebe6dc' }, ticks: { color: '#5c6570' } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
}

const fleetPct = computed(() =>
  Math.min(100, (kpis.value.today.kg / FLEET_CAPACITY_KG_PER_DAY) * 100),
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
        Indicadores de venta
      </h1>
      <p class="text-muted mt-1">
        Kilos, mix de cortes, canales y crédito
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <KpiCard
        label="Kg hoy"
        :value="formatKg(kpis.today.kg)"
        :hint="`${formatPct(kpis.vsYesterday)} vs ayer`"
      />
      <KpiCard
        label="Kg del mes"
        :value="formatKg(kpis.month.kg)"
        :hint="`${formatPct(kpis.vsLastMonthDay)} vs mismo día mes ant.`"
      />
      <KpiCard
        label="Facturación mes (neto)"
        :value="formatMoney(kpis.month.amount)"
        :hint="`Ticket ${formatMoney(kpis.month.avgPrice)}/kg`"
      />
      <KpiCard
        label="Crédito en alerta"
        :value="String(kpis.alertCount + kpis.blockedCount)"
        :hint="`${kpis.blockedCount} bloqueados · DSO ~${kpis.dso} días`"
        :tone="kpis.alertCount + kpis.blockedCount ? 'alert' : 'ok'"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
        <h2 class="font-display font-semibold text-navy mb-3">Tendencia 30 días (kg)</h2>
        <div class="h-64">
          <DemoChart type="line" :data="lineData" :options="chartOptions" />
        </div>
      </div>
      <div class="rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
        <h2 class="font-display font-semibold text-navy mb-3">Mix del día</h2>
        <div class="h-64">
          <DemoChart type="doughnut" :data="mixData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
        <h2 class="font-display font-semibold text-navy mb-3">Kg por corte (mes)</h2>
        <div class="h-72">
          <DemoChart type="bar" :data="barData" :options="chartOptions" />
        </div>
      </div>

      <div class="rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
        <h2 class="font-display font-semibold text-navy mb-3">Top 5 canales del mes</h2>
        <ul class="space-y-3">
          <li
            v-for="(ch, idx) in kpis.topChannels"
            :key="ch.clientId"
            class="flex items-center gap-3"
          >
            <span
              class="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-xs font-bold text-navy"
            >
              {{ idx + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-navy truncate">{{ ch.name }}</p>
              <p class="text-xs text-muted">Canal</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-semibold text-navy">{{ formatKg(ch.kg) }}</p>
              <p class="text-xs text-muted">{{ formatMoney(ch.amount) }}</p>
            </div>
          </li>
        </ul>

        <div class="mt-6 pt-4 border-t border-cream-dark">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-muted">Utilización crédito global</span>
            <span class="font-semibold text-navy">
              {{ formatNumber(kpis.utilizationGlobal * 100, 0) }}%
            </span>
          </div>
          <div class="h-2 rounded-full bg-cream-dark overflow-hidden">
            <div
              class="h-full rounded-full bg-steel"
              :style="{ width: `${Math.min(100, kpis.utilizationGlobal * 100)}%` }"
            />
          </div>
          <p class="text-xs text-muted mt-2">
            Exposición abierta: {{ formatMoney(kpis.exposure) }} · plazo medio
            {{ formatNumber(kpis.avgCreditDays, 0) }} días
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <KpiCard
        label="Capacidad flota hoy"
        :value="`${formatNumber(fleetPct, 0)}%`"
        :hint="`${formatKg(kpis.today.kg)} / ${formatKg(FLEET_CAPACITY_KG_PER_DAY)} (${FLEET_VEHICLES} vehículos)`"
      />
      <KpiCard
        label="Pedidos confirmados"
        :value="String(kpis.confirmed)"
        tone="ok"
      />
      <KpiCard
        label="Pendientes de despacho"
        :value="String(kpis.pending)"
        :tone="kpis.pending ? 'warn' : 'default'"
      />
    </div>
  </div>
</template>
