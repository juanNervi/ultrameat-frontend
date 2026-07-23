<script setup lang="ts">
import type { Client } from '~/types'
import { CREDIT_DAYS_OPTIONS } from '~/types'

const store = useDemoStore()
onMounted(() => store.ensureHydrated())

const filter = ref<'todos' | 'alerta' | 'bloqueado'>('todos')
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
  expanded.value[id] = !expanded.value[id]
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

    <!-- Client form modal -->
    <div
      v-if="clientFormOpen"
      class="rounded-2xl border border-navy/20 bg-white p-4 shadow-sm space-y-3"
    >
      <h2 class="font-display font-semibold text-navy">
        {{ editingClientId ? 'Editar cliente' : 'Nuevo cliente' }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="text-sm sm:col-span-2">
          <span class="text-muted font-semibold">Canal</span>
          <select
            v-model="clientForm.channelId"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option v-for="ch in channels" :key="ch.id" :value="ch.id">
              {{ ch.name }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Nombre</span>
          <input
            v-model="clientForm.name"
            type="text"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            placeholder="Disco Sucursal Malvín"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">RUT</span>
          <input
            v-model="clientForm.rut"
            type="text"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Límite de crédito</span>
          <input
            v-model.number="clientForm.creditLimit"
            type="number"
            min="0"
            step="1000"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Crédito usado</span>
          <input
            v-model.number="clientForm.creditUsed"
            type="number"
            min="0"
            step="1000"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="text-muted font-semibold">Plazo (días)</span>
          <select
            v-model.number="clientForm.creditDays"
            class="mt-1 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
          >
            <option v-for="d in CREDIT_DAYS_OPTIONS" :key="d" :value="d">
              {{ d }} días
            </option>
          </select>
        </label>
        <label class="text-sm flex items-end gap-2 pb-2">
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
          class="rounded-xl border border-cream-dark px-4 py-2 text-muted"
          @click="clientFormOpen = false"
        >
          Cancelar
        </button>
      </div>
    </div>

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
              <span class="text-muted text-xs w-4">{{ expanded[ch.id] ? '▼' : '▶' }}</span>
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

          <div class="flex flex-wrap gap-2 sm:justify-end">
            <template v-if="editingChannelId === ch.id">
              <button type="button" class="text-xs font-semibold text-ok underline" @click="saveChannel">
                Guardar
              </button>
              <button
                type="button"
                class="text-xs text-muted underline"
                @click="editingChannelId = null"
              >
                Cancelar
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="text-xs font-semibold text-navy underline"
                @click="startEditChannel(ch.id, ch.name)"
              >
                Renombrar
              </button>
              <button
                type="button"
                class="text-xs font-semibold text-navy underline"
                @click="openNewClient(ch.id)"
              >
                + Cliente
              </button>
              <button
                type="button"
                class="text-xs text-alert underline"
                @click="removeChannel(ch.id, ch.name)"
              >
                Borrar canal
              </button>
            </template>
          </div>
        </div>

        <div v-if="expanded[ch.id]" class="overflow-x-auto border-t border-cream-dark">
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
                <td class="px-4 py-2 text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    class="text-xs text-navy underline"
                    @click="openEditClient(client)"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="text-xs underline"
                    :class="client.blocked ? 'text-ok' : 'text-alert'"
                    @click="toggleBlocked(client)"
                  >
                    {{ client.blocked ? 'Desbloquear' : 'Bloquear' }}
                  </button>
                  <button
                    type="button"
                    class="text-xs text-alert underline"
                    @click="removeClient(client.id, client.name)"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
              <tr v-if="!visibleClients(ch.id).length">
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

      <p v-if="!filteredChannels.length" class="text-center text-muted py-8">
        No hay canales para mostrar.
      </p>
    </div>
  </div>
</template>
