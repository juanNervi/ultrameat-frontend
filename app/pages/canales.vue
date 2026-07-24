<script setup lang="ts">
import type { Client } from '~/types'
import { CREDIT_DAYS_OPTIONS } from '~/types'

const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const filter = ref<'todos' | 'alerta' | 'bloqueado'>('todos')
/** false = cerrado; ausente/true = abierto (por defecto desplegado) */
const expanded = ref<Record<string, boolean>>({})
const message = ref('')
const error = ref('')

const newChannelName = ref('')
const editingChannelId = ref<string | null>(null)
const editingChannelName = ref('')

const clientFormOpen = ref(false)
const editingClientId = ref<string | null>(null)
const clientForm = reactive({
  channelId: '',
  name: '',
  rut: '',
  creditLimit: 500_000,
  creditUsed: 0,
  creditDays: 30 as 15 | 30 | 45,
  blocked: false,
})

const channels = computed(() =>
  [...store.data.value.channels].sort((a, b) => a.name.localeCompare(b.name, 'es')),
)

function isExpanded(id: string) {
  return expanded.value[id] !== false
}

function flash(ok: string | null, err: string | null = null) {
  message.value = ok || ''
  error.value = err || ''
}

function channelSummary(channelId: string) {
  const clients = store.clientsByChannel(channelId)
  const statuses = clients.map((c) => store.creditStatus(c.id)!).filter(Boolean)
  const limit = clients.reduce((a, c) => a + c.creditLimit, 0)
  const used = clients.reduce((a, c) => a + c.creditUsed, 0)
  const alerts = statuses.filter((s) => s.level === 'alerta').length
  const blocked = statuses.filter((s) => s.level === 'bloqueado').length
  return { clients, limit, used, available: Math.max(0, limit - used), alerts, blocked }
}

function visibleClients(channelId: string) {
  const clients = store.clientsByChannel(channelId)
  if (filter.value === 'todos') return clients
  return clients.filter((c) => {
    const s = store.creditStatus(c.id)
    return s?.level === filter.value
  })
}

function channelMatchesFilter(channelId: string) {
  if (filter.value === 'todos') return true
  return visibleClients(channelId).length > 0
}

const filteredChannels = computed(() =>
  channels.value.filter((ch) => channelMatchesFilter(ch.id)),
)

function toggle(id: string) {
  expanded.value[id] = !isExpanded(id)
}

function createChannel() {
  const result = store.addChannel(newChannelName.value)
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  newChannelName.value = ''
  expanded.value[result.channel.id] = true
  flash(`Canal “${result.channel.name}” creado.`)
}

function startEditChannel(id: string, name: string) {
  editingChannelId.value = id
  editingChannelName.value = name
}

function saveChannel() {
  if (!editingChannelId.value) return
  const result = store.updateChannel(editingChannelId.value, editingChannelName.value)
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  editingChannelId.value = null
  flash('Canal actualizado.')
}

function removeChannel(id: string, name: string) {
  if (!confirm(`¿Borrar el canal “${name}”?`)) return
  const result = store.deleteChannel(id)
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  flash('Canal eliminado.')
}

function openNewClient(channelId: string) {
  editingClientId.value = null
  clientForm.channelId = channelId
  clientForm.name = ''
  clientForm.rut = ''
  clientForm.creditLimit = 500_000
  clientForm.creditUsed = 0
  clientForm.creditDays = 30
  clientForm.blocked = false
  clientFormOpen.value = true
  expanded.value[channelId] = true
  nextTick(() => {
    document.getElementById(`client-form-${channelId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  })
}

function openEditClient(client: Client) {
  editingClientId.value = client.id
  clientForm.channelId = client.channelId
  clientForm.name = client.name
  clientForm.rut = client.rut
  clientForm.creditLimit = client.creditLimit
  clientForm.creditUsed = client.creditUsed
  clientForm.creditDays = client.creditDays
  clientForm.blocked = client.blocked
  clientFormOpen.value = true
  expanded.value[client.channelId] = true
  nextTick(() => {
    document.getElementById(`client-form-${client.channelId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  })
}

function saveClient() {
  if (editingClientId.value) {
    const result = store.updateClient(editingClientId.value, { ...clientForm })
    if (!result.ok) {
      flash(null, result.reason)
      return
    }
    flash('Cliente actualizado.')
  } else {
    const result = store.addClient({ ...clientForm })
    if (!result.ok) {
      flash(null, result.reason)
      return
    }
    flash(`Cliente “${result.client.name}” agregado.`)
  }
  clientFormOpen.value = false
}

function removeClient(id: string, name: string) {
  if (!confirm(`¿Borrar el cliente “${name}”?`)) return
  const result = store.deleteClient(id)
  if (!result.ok) {
    flash(null, result.reason)
    return
  }
  flash('Cliente eliminado.')
}

function toggleBlocked(client: Client) {
  store.updateClient(client.id, { blocked: !client.blocked })
  flash(client.blocked ? 'Cliente desbloqueado.' : 'Cliente bloqueado.')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-bold text-navy">
          Canales y clientes
        </h1>
        <p class="text-muted mt-1">
          Un canal agrupa sucursales/clientes (ej. Grupo Disco → Malvín, Pocitos…).
          Cada cliente tiene plazo, límite y bloqueo.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
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

    <p v-if="message" class="text-sm text-ok font-semibold">{{ message }}</p>
    <p v-if="error" class="text-sm text-alert font-semibold">{{ error }}</p>

    <div class="rounded-2xl border border-cream-dark bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-2">
      <input
        v-model="newChannelName"
        type="text"
        placeholder="Nuevo canal (ej. Grupo Disco)"
        class="flex-1 rounded-lg border border-cream-dark bg-cream px-3 py-2"
        @keyup.enter="createChannel"
      />
      <button
        type="button"
        class="rounded-xl bg-navy text-white font-semibold px-4 py-2 hover:bg-navy-deep transition"
        @click="createChannel"
      >
        Agregar canal
      </button>
    </div>

    <!-- formulario de cliente se muestra dentro de cada canal -->

    <div class="space-y-3">
      <div
        v-for="ch in filteredChannels"
        :key="ch.id"
        class="rounded-2xl border border-cream-dark bg-white shadow-sm overflow-hidden"
      >
        <div class="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 bg-cream/60">
          <button
            type="button"
            class="text-left flex-1 min-w-0"
            @click="toggle(ch.id)"
          >
            <div class="flex items-center gap-2">
              <span class="text-muted text-xs w-4">{{ isExpanded(ch.id) ? '▼' : '▶' }}</span>
              <template v-if="editingChannelId === ch.id">
                <input
                  v-model="editingChannelName"
                  type="text"
                  class="rounded-lg border border-cream-dark px-2 py-1 font-display font-semibold text-navy"
                  @click.stop
                  @keyup.enter="saveChannel"
                />
              </template>
              <template v-else>
                <span class="font-display font-semibold text-navy truncate">
                  {{ ch.name }}
                </span>
              </template>
            </div>
            <p class="text-xs text-muted mt-1 ml-6">
              {{ channelSummary(ch.id).clients.length }} clientes ·
              límite {{ formatMoney(channelSummary(ch.id).limit) }} ·
              disponible {{ formatMoney(channelSummary(ch.id).available) }}
              <span v-if="channelSummary(ch.id).alerts" class="text-alert">
                · {{ channelSummary(ch.id).alerts }} alerta(s)
              </span>
              <span v-if="channelSummary(ch.id).blocked" class="text-alert">
                · {{ channelSummary(ch.id).blocked }} bloqueado(s)
              </span>
            </p>
          </button>

          <div class="flex items-center gap-1 sm:justify-end shrink-0">
            <template v-if="editingChannelId === ch.id">
              <ActionIcon label="Guardar" tone="ok" @click="saveChannel">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </ActionIcon>
              <ActionIcon label="Cancelar" tone="muted" @click="editingChannelId = null">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </ActionIcon>
            </template>
            <template v-else>
              <ActionIcon label="Renombrar canal" @click="startEditChannel(ch.id, ch.name)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.875 4.5" />
                </svg>
              </ActionIcon>
              <ActionIcon label="Agregar cliente" @click="openNewClient(ch.id)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </ActionIcon>
              <ActionIcon label="Borrar canal" tone="alert" @click="removeChannel(ch.id, ch.name)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </ActionIcon>
            </template>
          </div>
        </div>

        <div v-if="isExpanded(ch.id)" class="border-t border-cream-dark">
          <div
            v-if="clientFormOpen && clientForm.channelId === ch.id"
            :id="`client-form-${ch.id}`"
            class="m-3 rounded-xl border border-navy/25 bg-cream/50 p-4 space-y-3"
          >
            <h2 class="font-display font-semibold text-navy">
              {{ editingClientId ? 'Editar cliente' : 'Nuevo cliente' }}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="text-sm sm:col-span-2">
                <span class="text-muted font-semibold">Nombre</span>
                <input
                  v-model="clientForm.name"
                  type="text"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2"
                  placeholder="Disco Sucursal Malvín"
                />
              </label>
              <label class="text-sm">
                <span class="text-muted font-semibold">RUT</span>
                <input
                  v-model="clientForm.rut"
                  type="text"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2"
                />
              </label>
              <label class="text-sm">
                <span class="text-muted font-semibold">Plazo (días)</span>
                <select
                  v-model.number="clientForm.creditDays"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2"
                >
                  <option v-for="d in CREDIT_DAYS_OPTIONS" :key="d" :value="d">
                    {{ d }} días
                  </option>
                </select>
              </label>
              <label class="text-sm">
                <span class="text-muted font-semibold">Límite de crédito</span>
                <input
                  v-model.number="clientForm.creditLimit"
                  type="number"
                  min="0"
                  step="1000"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2"
                />
              </label>
              <label class="text-sm">
                <span class="text-muted font-semibold">Crédito usado</span>
                <input
                  v-model.number="clientForm.creditUsed"
                  type="number"
                  min="0"
                  step="1000"
                  class="mt-1 w-full rounded-lg border border-cream-dark bg-white px-3 py-2"
                />
              </label>
              <label class="text-sm flex items-center gap-2 sm:col-span-2">
                <input v-model="clientForm.blocked" type="checkbox" class="rounded" />
                <span class="font-semibold text-navy">Bloqueado (no vender)</span>
              </label>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-xl bg-navy text-white font-semibold px-4 py-2"
                @click="saveClient"
              >
                Guardar
              </button>
              <button
                type="button"
                class="rounded-xl border border-cream-dark px-4 py-2 text-muted bg-white"
                @click="clientFormOpen = false"
              >
                Cancelar
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-cream text-left text-muted">
              <tr>
                <th class="px-4 py-2 font-semibold">Cliente</th>
                <th class="px-4 py-2 font-semibold">RUT</th>
                <th class="px-4 py-2 font-semibold">Plazo</th>
                <th class="px-4 py-2 font-semibold text-right">Límite</th>
                <th class="px-4 py-2 font-semibold text-right">Usado</th>
                <th class="px-4 py-2 font-semibold text-right">Disponible</th>
                <th class="px-4 py-2 font-semibold">Estado</th>
                <th class="px-4 py-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="client in visibleClients(ch.id)"
                :key="client.id"
                class="border-t border-cream-dark"
              >
                <td class="px-4 py-2 font-semibold text-navy">{{ client.name }}</td>
                <td class="px-4 py-2 text-muted">{{ client.rut || '—' }}</td>
                <td class="px-4 py-2">{{ client.creditDays }} días</td>
                <td class="px-4 py-2 text-right">{{ formatMoney(client.creditLimit) }}</td>
                <td class="px-4 py-2 text-right">{{ formatMoney(client.creditUsed) }}</td>
                <td class="px-4 py-2 text-right font-semibold">
                  {{ formatMoney(store.creditStatus(client.id)?.available ?? 0) }}
                </td>
                <td class="px-4 py-2">
                  <CreditBadge :level="store.creditStatus(client.id)?.level || 'ok'" compact />
                </td>
                <td class="px-4 py-2 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-0.5">
                    <ActionIcon label="Editar cliente" @click="openEditClient(client)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125L16.875 4.5" />
                      </svg>
                    </ActionIcon>
                    <ActionIcon
                      :label="client.blocked ? 'Desbloquear cliente' : 'Bloquear cliente'"
                      :tone="client.blocked ? 'ok' : 'alert'"
                      @click="toggleBlocked(client)"
                    >
                      <svg
                        v-if="client.blocked"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </ActionIcon>
                    <ActionIcon label="Borrar cliente" tone="alert" @click="removeClient(client.id, client.name)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </ActionIcon>
                  </div>
                </td>
              </tr>
              <tr v-if="!visibleClients(ch.id).length && !(clientFormOpen && clientForm.channelId === ch.id)">
                <td colspan="8" class="px-4 py-6 text-center text-muted">
                  Sin clientes
                  {{ filter === 'todos' ? 'en este canal' : 'con este filtro' }}.
                  <button
                    v-if="filter === 'todos'"
                    type="button"
                    class="underline text-navy ml-1"
                    @click="openNewClient(ch.id)"
                  >
                    Agregar uno
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <p v-if="!filteredChannels.length" class="text-center text-muted py-8">
        No hay canales para mostrar.
      </p>
    </div>
  </div>
</template>
