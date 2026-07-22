<script setup lang="ts">
const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const statuses = computed(() => store.allCreditStatuses())
const filter = ref<'todos' | 'alerta' | 'bloqueado'>('todos')

const filtered = computed(() => {
  if (filter.value === 'todos') return statuses.value
  return statuses.value.filter((s) => s.level === filter.value)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
          Canales y crédito
        </h1>
        <p class="text-muted mt-1">
          Cadenas y clientes con límite, uso y disponibilidad. Alerta desde 80%.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="f in [
            { id: 'todos', label: 'Todos' },
            { id: 'alerta', label: 'En alerta' },
            { id: 'bloqueado', label: 'Bloqueados' },
          ]"
          :key="f.id"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-semibold border transition"
          :class="
            filter === f.id
              ? 'bg-navy text-white border-navy'
              : 'bg-white border-cream-dark text-navy'
          "
          @click="filter = f.id as typeof filter"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div
      v-if="statuses.some((s) => s.level !== 'ok')"
      class="rounded-xl border border-alert/30 bg-alert-soft px-4 py-3 text-sm text-navy"
    >
      <strong class="text-alert">Atención comercial:</strong>
      hay clientes cerca o sin crédito. No se puede confirmar venta si el saldo
      disponible no alcanza.
    </div>

    <div class="rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-cream text-left text-muted">
            <tr>
              <th class="px-4 py-3 font-semibold">Cliente</th>
              <th class="px-4 py-3 font-semibold">Canal</th>
              <th class="px-4 py-3 font-semibold">Plazo</th>
              <th class="px-4 py-3 font-semibold text-right">Límite</th>
              <th class="px-4 py-3 font-semibold text-right">Usado</th>
              <th class="px-4 py-3 font-semibold text-right">Disponible</th>
              <th class="px-4 py-3 font-semibold">Uso</th>
              <th class="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtered"
              :key="row.client.id"
              class="border-t border-cream-dark"
              :class="row.level === 'bloqueado' ? 'bg-navy/[0.03]' : ''"
            >
              <td class="px-4 py-3 font-semibold text-navy">{{ row.client.name }}</td>
              <td class="px-4 py-3 text-muted">{{ row.client.channel }}</td>
              <td class="px-4 py-3">{{ row.client.creditDays }} días</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(row.client.creditLimit) }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(row.client.creditUsed) }}</td>
              <td class="px-4 py-3 text-right font-semibold">
                {{ formatMoney(row.available) }}
              </td>
              <td class="px-4 py-3 min-w-[120px]">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded-full bg-cream-dark overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="{
                        'bg-ok': row.level === 'ok',
                        'bg-alert': row.level === 'alerta',
                        'bg-navy': row.level === 'bloqueado',
                      }"
                      :style="{ width: `${Math.min(100, row.utilization * 100)}%` }"
                    />
                  </div>
                  <span class="text-xs w-10 text-right">
                    {{ formatNumber(row.utilization * 100, 0) }}%
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <CreditBadge :level="row.level" compact />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
