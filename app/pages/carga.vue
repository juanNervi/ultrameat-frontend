<script setup lang="ts">
const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const form = reactive({
  date: store.todayIso(),
  clientId: '',
  cutId: '',
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
  () => store.data.value.cuts,
  (cuts) => {
    if (!form.cutId && cuts[0]) {
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

const credit = computed(() =>
  form.clientId ? store.creditStatus(form.clientId) : null,
)

const estimated = computed(() => form.kg * form.pricePerKg)

const daySales = computed(() => store.salesOn(form.date))

function submit() {
  error.value = ''
  success.value = ''
  if (!form.clientId || !form.cutId || form.kg <= 0) {
    error.value = 'Completá cliente, corte y kilos.'
    return
  }

  const result = store.addSale({
    date: form.date,
    clientId: form.clientId,
    cutId: form.cutId,
    kg: Number(form.kg),
    pricePerKg: Number(form.pricePerKg),
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
              v-for="c in store.data.value.clients"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
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
          <span class="text-muted font-semibold">Corte</span>
          <select
            v-model="form.cutId"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option v-for="c in store.data.value.cuts" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </label>

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
          class="w-full rounded-xl bg-navy text-white font-semibold py-2.5 hover:bg-navy-deep transition"
          :disabled="credit?.level === 'bloqueado' && form.status === 'confirmada'"
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
                <td class="px-3 py-2">{{ store.getClient(s.clientId)?.name }}</td>
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
                <td class="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                  <button
                    v-if="s.status === 'pendiente'"
                    type="button"
                    class="text-xs text-navy underline"
                    @click="confirmSale(s.id)"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    class="text-xs text-alert underline"
                    @click="removeSale(s.id)"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
              <tr v-if="!daySales.length">
                <td colspan="6" class="px-3 py-8 text-center text-muted">
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
