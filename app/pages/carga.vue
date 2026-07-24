<script setup lang="ts">
import { COMERCIALES } from '~/data/seed'

const store = useDemoStore()
const { session, hydrate } = useSession()

onMounted(() => {
  hydrate()
  store.ensureHydrated()
  if (!form.comercial && session.value?.name) {
    form.comercial = session.value.name
  }
})

const form = reactive({
  date: store.todayIso(),
  clientId: '',
  cutId: '',
  comercial: '',
  kg: 120,
  pricePerKg: 420,
  notes: '',
  status: 'confirmada' as 'confirmada' | 'pendiente',
})

const error = ref('')
const success = ref('')

watch(
  () => store.data.value.clients,
  (clients) => {
    if (!form.clientId && clients[0]) form.clientId = clients[0].id
  },
  { immediate: true },
)

watch(
  () => store.activeCuts(),
  (cuts) => {
    if (!cuts.length) {
      form.cutId = ''
      return
    }
    if (!form.cutId || !cuts.some((c) => c.id === form.cutId)) {
      form.cutId = cuts[0].id
      form.pricePerKg = cuts[0].defaultPricePerKg
    }
  },
  { immediate: true },
)

watch(
  () => form.cutId,
  (id) => {
    const cut = store.getCut(id)
    if (cut) form.pricePerKg = cut.defaultPricePerKg
  },
)

watch(
  () => session.value?.name,
  (name) => {
    if (name && !form.comercial) form.comercial = name
  },
  { immediate: true },
)

const credit = computed(() =>
  form.clientId ? store.creditStatus(form.clientId) : null,
)

const selectedCut = computed(() =>
  form.cutId ? store.getCut(form.cutId) : null,
)

const stockAvailable = computed(() => Number(selectedCut.value?.stockKg) || 0)

const stockOk = computed(() => form.kg > 0 && form.kg <= stockAvailable.value)

const estimated = computed(() => form.kg * form.pricePerKg)

const clientOptions = computed(() =>
  [...store.data.value.clients]
    .map((c) => ({
      ...c,
      label: `${store.getChannel(c.channelId)?.name || 'Canal'} — ${c.name}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es')),
)

const daySales = computed(() => store.salesOn(form.date))

function submit() {
  error.value = ''
  success.value = ''
  if (!form.clientId || !form.cutId || form.kg <= 0) {
    error.value = 'Completá cliente, corte y kilos.'
    return
  }
  if (!form.comercial.trim()) {
    error.value = 'Indicá el nombre del comercial que vendió.'
    return
  }

  const result = store.addSale({
    date: form.date,
    clientId: form.clientId,
    cutId: form.cutId,
    kg: Number(form.kg),
    pricePerKg: Number(form.pricePerKg),
    comercial: form.comercial.trim(),
    notes: form.notes || undefined,
    status: form.status,
  })

  if (!result.ok) {
    error.value = result.reason
    return
  }

  success.value = 'Venta cargada correctamente.'
  form.kg = 120
  form.notes = ''
}

function removeSale(id: string) {
  store.deleteSale(id)
}

function confirmSale(id: string) {
  const result = store.updateSaleStatus(id, 'confirmada')
  if (!result.ok) error.value = result.reason
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
        Carga de ventas
      </h1>
      <p class="text-muted mt-1">
        Registro diario que reemplaza las planillas duplicadas de Excel / Drive.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <form
        class="lg:col-span-2 rounded-2xl border border-cream-dark bg-white p-4 shadow-sm space-y-3"
        @submit.prevent="submit"
      >
        <h2 class="font-display font-semibold text-navy">Nueva venta</h2>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Fecha</span>
          <input
            v-model="form.date"
            type="date"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Cliente / canal</span>
          <select
            v-model="form.clientId"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option
              v-for="c in clientOptions"
              :key="c.id"
              :value="c.id"
            >
              {{ c.label }}{{ c.blocked ? ' (bloqueado)' : '' }}
            </option>
          </select>
        </label>

        <div
          v-if="credit"
          class="rounded-lg border px-3 py-2 text-sm"
          :class="{
            'border-ok/30 bg-ok-soft': credit.level === 'ok',
            'border-alert/40 bg-alert-soft': credit.level === 'alerta',
            'border-navy/30 bg-cream': credit.level === 'bloqueado',
          }"
        >
          <div class="flex items-center justify-between gap-2">
            <CreditBadge :level="credit.level" compact />
            <span>Disponible: {{ formatMoney(credit.available) }}</span>
          </div>
        </div>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Comercial que vendió</span>
          <input
            v-model="form.comercial"
            type="text"
            list="comerciales-list"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            placeholder="Nombre del comercial"
          />
          <datalist id="comerciales-list">
            <option v-for="name in COMERCIALES" :key="name" :value="name" />
          </datalist>
        </label>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Corte</span>
          <select
            v-model="form.cutId"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option v-for="c in store.activeCuts()" :key="c.id" :value="c.id">
              {{ c.name }} ({{ formatNumber(c.stockKg || 0, 1) }} kg)
            </option>
          </select>
        </label>

        <div
          v-if="selectedCut"
          class="rounded-lg border px-3 py-2 text-sm"
          :class="
            stockOk
              ? 'border-ok/30 bg-ok-soft'
              : 'border-alert/40 bg-alert-soft'
          "
        >
          <div class="flex justify-between gap-2">
            <span class="font-semibold" :class="stockOk ? 'text-ok' : 'text-alert'">
              Stock disponible
            </span>
            <span>{{ formatKg(stockAvailable) }}</span>
          </div>
          <p v-if="!stockOk" class="text-xs text-alert mt-1">
            No hay stock suficiente para esta venta.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block text-sm">
            <span class="text-muted font-semibold">Kg</span>
            <input
              v-model.number="form.kg"
              type="number"
              min="1"
              step="0.1"
              class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            />
          </label>
          <label class="block text-sm">
            <span class="text-muted font-semibold">Precio / kg</span>
            <input
              v-model.number="form.pricePerKg"
              type="number"
              min="1"
              class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            />
          </label>
        </div>

        <p class="text-sm text-navy font-semibold">
          Estimado: {{ formatMoney(estimated) }}
        </p>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Estado</span>
          <select
            v-model="form.status"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option value="confirmada">Confirmada</option>
            <option value="pendiente">Pendiente de despacho</option>
          </select>
        </label>

        <label class="block text-sm">
          <span class="text-muted font-semibold">Observaciones</span>
          <textarea
            v-model="form.notes"
            rows="2"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            placeholder="Opcional"
          />
        </label>

        <p v-if="error" class="text-sm text-alert font-semibold">{{ error }}</p>
        <p v-if="success" class="text-sm text-ok font-semibold">{{ success }}</p>

        <button
          type="submit"
          class="w-full rounded-xl bg-navy text-white font-semibold py-2.5 hover:bg-navy-deep transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="
            (credit?.level === 'bloqueado' && form.status === 'confirmada') ||
            !stockOk
          "
        >
          Guardar venta
        </button>
        <p
          v-if="credit?.level === 'bloqueado'"
          class="text-xs text-alert"
        >
          Cliente bloqueado: solo podés cargar como pendiente o elegir otro canal.
        </p>
      </form>

      <div class="lg:col-span-3 rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b border-cream-dark flex justify-between items-center">
          <h2 class="font-display font-semibold text-navy">
            Ventas del {{ form.date }}
          </h2>
          <span class="text-sm text-muted">{{ daySales.length }} registros</span>
        </div>
        <div class="overflow-x-auto max-h-[560px] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-cream text-left text-muted sticky top-0">
              <tr>
                <th class="px-3 py-2">Cliente</th>
                <th class="px-3 py-2">Comercial</th>
                <th class="px-3 py-2">Corte</th>
                <th class="px-3 py-2 text-right">Kg</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2">Estado</th>
                <th class="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in daySales"
                :key="s.id"
                class="border-t border-cream-dark"
              >
                <td class="px-3 py-2">
                  <span class="block">{{ store.getClient(s.clientId)?.name }}</span>
                  <span class="text-xs text-muted">
                    {{ store.getChannel(store.getClient(s.clientId)?.channelId || '')?.name }}
                  </span>
                </td>
                <td class="px-3 py-2">{{ s.comercial || '—' }}</td>
                <td class="px-3 py-2">{{ store.getCut(s.cutId)?.name }}</td>
                <td class="px-3 py-2 text-right">{{ formatNumber(s.kg, 1) }}</td>
                <td class="px-3 py-2 text-right">
                  {{ formatMoney(s.kg * s.pricePerKg) }}
                </td>
                <td class="px-3 py-2">
                  <span
                    class="text-xs font-semibold rounded-full px-2 py-0.5"
                    :class="
                      s.status === 'confirmada'
                        ? 'bg-ok-soft text-ok'
                        : 'bg-warn-soft text-warn'
                    "
                  >
                    {{ s.status }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-0.5 justify-end">
                    <ActionIcon
                      v-if="s.status === 'pendiente'"
                      label="Confirmar venta"
                      tone="ok"
                      @click="confirmSale(s.id)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </ActionIcon>
                    <ActionIcon
                      label="Borrar venta"
                      tone="alert"
                      @click="removeSale(s.id)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </ActionIcon>
                  </div>
                </td>
              </tr>
              <tr v-if="!daySales.length">
                <td colspan="7" class="px-3 py-8 text-center text-muted">
                  Sin ventas para esta fecha.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
