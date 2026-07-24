<script setup lang="ts">
import type { Cut } from '~/types'

const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const message = ref('')
const error = ref('')
const formOpen = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  defaultPricePerKg: 400,
  active: true,
})

const products = computed(() =>
  [...store.data.value.cuts].sort((a, b) => a.name.localeCompare(b.name, 'es')),
)

function flash(ok: string | null, err: string | null = null) {
  message.value = ok || ''
  error.value = err || ''
}

function openNew() {
  editingId.value = null
  form.name = ''
  form.defaultPricePerKg = 400
  form.active = true
  formOpen.value = true
  nextTick(() => {
    document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function openEdit(cut: Cut) {
  editingId.value = cut.id
  form.name = cut.name
  form.defaultPricePerKg = cut.defaultPricePerKg
  form.active = cut.active !== false
  formOpen.value = true
  nextTick(() => {
    document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function save() {
  if (editingId.value) {
    const result = store.updateCut(editingId.value, { ...form })
    if (!result.ok) {
      flash(null, result.reason)
      return
    }
    flash('Producto actualizado.')
  } else {
    const result = store.addCut({ ...form })
    if (!result.ok) {
      flash(null, result.reason)
      return
    }
    flash(`Producto “${result.cut.name}” creado.`)
  }
  formOpen.value = false
}

function remove(cut: Cut) {
  if (!confirm(`¿Borrar el producto “${cut.name}”?`)) return
  const result = store.deleteCut(cut.id)
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  flash('Producto eliminado.')
}

function toggleActive(cut: Cut) {
  store.updateCut(cut.id, { active: cut.active === false })
  flash(cut.active === false ? 'Producto activado.' : 'Producto desactivado.')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
          Productos
        </h1>
        <p class="text-muted mt-1">
          Cortes y productos que vendés. Alimentan el dropdown de la carga de ventas.
        </p>
      </div>
      <button
        type="button"
        class="rounded-xl bg-navy text-white font-semibold px-4 py-2.5 hover:bg-navy-deep transition"
        @click="openNew"
      >
        + Nuevo producto
      </button>
    </div>

    <p v-if="message" class="text-sm text-ok font-semibold">{{ message }}</p>
    <p v-if="error" class="text-sm text-alert font-semibold">{{ error }}</p>

    <div
      v-if="formOpen"
      id="product-form"
      class="rounded-2xl border border-navy/25 bg-white p-4 shadow-sm space-y-3"
    >
      <h2 class="font-display font-semibold text-navy">
        {{ editingId ? 'Editar producto' : 'Nuevo producto' }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label class="text-sm sm:col-span-2">
          <span class="text-muted font-semibold">Nombre</span>
          <input
            v-model="form.name"
            type="text"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            placeholder="Ej. Asado, Pulpón, Vacío…"
            @keyup.enter="save"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Precio / kg (UYU)</span>
          <input
            v-model.number="form.defaultPricePerKg"
            type="number"
            min="0"
            step="10"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm flex items-center gap-2 sm:col-span-3">
          <input v-model="form.active" type="checkbox" class="rounded" />
          <span class="font-semibold text-navy">Activo (aparece en carga de ventas)</span>
        </label>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-xl bg-navy text-white font-semibold px-4 py-2"
          @click="save"
        >
          Guardar
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
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-cream text-left text-muted">
            <tr>
              <th class="px-4 py-3 font-semibold">Producto</th>
              <th class="px-4 py-3 font-semibold text-right">Precio / kg</th>
              <th class="px-4 py-3 font-semibold">Estado</th>
              <th class="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cut in products"
              :key="cut.id"
              class="border-t border-cream-dark"
            >
              <td class="px-4 py-3 font-semibold text-navy">{{ cut.name }}</td>
              <td class="px-4 py-3 text-right">
                {{ formatMoney(cut.defaultPricePerKg) }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-xs font-semibold rounded-full px-2 py-0.5"
                  :class="
                    cut.active !== false
                      ? 'bg-ok-soft text-ok'
                      : 'bg-cream-dark text-muted'
                  "
                >
                  {{ cut.active !== false ? 'activo' : 'inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-0.5 justify-end">
                  <ActionIcon label="Editar producto" @click="openEdit(cut)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.875 4.5" />
                    </svg>
                  </ActionIcon>
                  <ActionIcon
                    :label="cut.active !== false ? 'Desactivar' : 'Activar'"
                    :tone="cut.active !== false ? 'alert' : 'ok'"
                    @click="toggleActive(cut)"
                  >
                    <svg
                      v-if="cut.active !== false"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m13.542 13.542L21 21" />
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </ActionIcon>
                  <ActionIcon label="Borrar producto" tone="alert" @click="remove(cut)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </ActionIcon>
                </div>
              </td>
            </tr>
            <tr v-if="!products.length">
              <td colspan="4" class="px-4 py-10 text-center text-muted">
                Todavía no hay productos.
                <button type="button" class="underline text-navy ml-1" @click="openNew">
                  Crear el primero
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
