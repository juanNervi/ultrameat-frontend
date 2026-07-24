<script setup lang="ts">
const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const message = ref('')
const error = ref('')
const formOpen = ref(false)

const form = reactive({
  cutId: '',
  date: store.todayIso(),
  kg: 500,
  costPerKg: 300,
  notes: '',
})

const summary = computed(() => store.stockSummary())

const products = computed(() =>
  [...store.data.value.cuts].sort((a, b) => a.name.localeCompare(b.name, 'es')),
)

const recentEntries = computed(() =>
  [...(store.data.value.stockEntries || [])].slice(0, 15),
)

function flash(ok: string | null, err: string | null = null) {
  message.value = ok || ''
  error.value = err || ''
}

function openEntry(cutId?: string) {
  form.cutId = cutId || products.value[0]?.id || ''
  form.date = store.todayIso()
  form.kg = 500
  const cut = store.getCut(form.cutId)
  form.costPerKg = cut?.costPerKg || cut?.defaultPricePerKg || 300
  form.notes = ''
  formOpen.value = true
  nextTick(() => {
    document.getElementById('stock-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

watch(
  () => form.cutId,
  (id) => {
    const cut = store.getCut(id)
    if (cut && formOpen.value) {
      form.costPerKg = cut.costPerKg || Math.round(cut.defaultPricePerKg * 0.75)
    }
  },
)

function saveEntry() {
  const result = store.addStock({
    cutId: form.cutId,
    kg: Number(form.kg),
    costPerKg: Number(form.costPerKg),
    date: form.date,
    notes: form.notes || undefined,
  })
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  const name = store.getCut(form.cutId)?.name || 'producto'
  flash(`Entrada registrada: +${form.kg} kg de ${name}.`)
  formOpen.value = false
}

const estimatedCost = computed(() => form.kg * form.costPerKg)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
          Stock
        </h1>
        <p class="text-muted mt-1">
          Inventario de carne comprada. Al vender se descuenta automáticamente;
          sin stock suficiente no se puede cargar la venta.
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl bg-navy text-white font-semibold px-4 py-2.5 hover:bg-navy-deep transition"
        @click="openEntry()"
      >
        + Entrada de mercadería
      </button>
    </div>

    <p v-if="message" class="text-sm text-ok font-semibold">{{ message }}</p>
    <p v-if="error" class="text-sm text-alert font-semibold">{{ error }}</p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <KpiCard label="Stock total" :value="formatKg(summary.totalKg)" />
      <KpiCard label="Valor inventario (costo)" :value="formatMoney(summary.totalValue)" />
      <KpiCard
        label="Productos con stock bajo"
        :value="String(summary.lowCount)"
        :tone="summary.lowCount ? 'alert' : 'ok'"
        hint="Alerta bajo 200 kg"
      />
    </div>

    <div
      v-if="formOpen"
      id="stock-form"
      class="rounded-2xl border border-navy/25 bg-white p-4 shadow-sm space-y-3"
    >
      <h2 class="font-display font-semibold text-navy">Entrada de mercadería (compra)</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="text-sm sm:col-span-2">
          <span class="text-muted font-semibold">Producto</span>
          <select
            v-model="form.cutId"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }} (stock {{ formatNumber(p.stockKg || 0, 1) }} kg)
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Fecha de compra</span>
          <input
            v-model="form.date"
            type="date"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Kg ingresados</span>
          <input
            v-model.number="form.kg"
            type="number"
            min="0.1"
            step="0.1"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Costo / kg (UYU)</span>
          <input
            v-model.number="form.costPerKg"
            type="number"
            min="0"
            step="1"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Costo total estimado</span>
          <p class="mt-2 font-display font-semibold text-navy">
            {{ formatMoney(estimatedCost) }}
          </p>
        </label>
        <label class="text-sm sm:col-span-2">
          <span class="text-muted font-semibold">Observaciones</span>
          <input
            v-model="form.notes"
            type="text"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            placeholder="Proveedor, lote, contenedor…"
          />
        </label>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-xl bg-navy text-white font-semibold px-4 py-2"
          @click="saveEntry"
        >
          Registrar entrada
        </button>
        <button
          type="button"
          class="rounded-xl border border-cream-dark px-4 py-2 text-muted"
          @click="formOpen = false"
        >
          Cancelar
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-cream-dark">
        <h2 class="font-display font-semibold text-navy">Inventario actual</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-cream text-left text-muted">
            <tr>
              <th class="px-4 py-3 font-semibold">Producto</th>
              <th class="px-4 py-3 font-semibold text-right">Stock (kg)</th>
              <th class="px-4 py-3 font-semibold text-right">Costo / kg</th>
              <th class="px-4 py-3 font-semibold text-right">Valor</th>
              <th class="px-4 py-3 font-semibold text-right">Precio venta</th>
              <th class="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summary.rows"
              :key="row.cut.id"
              class="border-t border-cream-dark"
              :class="row.low ? 'bg-alert-soft/40' : ''"
            >
              <td class="px-4 py-3 font-semibold text-navy">
                {{ row.cut.name }}
                <span
                  v-if="row.low"
                  class="ml-2 text-xs font-semibold text-alert"
                >
                  stock bajo
                </span>
              </td>
              <td class="px-4 py-3 text-right font-semibold">
                {{ formatNumber(row.stockKg, 1) }}
              </td>
              <td class="px-4 py-3 text-right">{{ formatMoney(row.costPerKg) }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(row.stockValue) }}</td>
              <td class="px-4 py-3 text-right text-muted">
                {{ formatMoney(row.cut.defaultPricePerKg) }}
              </td>
              <td class="px-4 py-3 text-right">
                <ActionIcon label="Agregar stock" @click="openEntry(row.cut.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </ActionIcon>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="recentEntries.length"
      class="rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-cream-dark">
        <h2 class="font-display font-semibold text-navy">Últimas entradas</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-cream text-left text-muted">
            <tr>
              <th class="px-4 py-2 font-semibold">Fecha</th>
              <th class="px-4 py-2 font-semibold">Producto</th>
              <th class="px-4 py-2 font-semibold text-right">Kg</th>
              <th class="px-4 py-2 font-semibold text-right">Costo / kg</th>
              <th class="px-4 py-2 font-semibold text-right">Total</th>
              <th class="px-4 py-2 font-semibold">Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in recentEntries"
              :key="e.id"
              class="border-t border-cream-dark"
            >
              <td class="px-4 py-2">{{ e.date }}</td>
              <td class="px-4 py-2 font-semibold text-navy">
                {{ store.getCut(e.cutId)?.name }}
              </td>
              <td class="px-4 py-2 text-right">{{ formatNumber(e.kg, 1) }}</td>
              <td class="px-4 py-2 text-right">{{ formatMoney(e.costPerKg) }}</td>
              <td class="px-4 py-2 text-right">{{ formatMoney(e.kg * e.costPerKg) }}</td>
              <td class="px-4 py-2 text-muted">{{ e.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
