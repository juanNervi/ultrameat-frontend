<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { session, hydrate, logout } = useSession()
const store = useDemoStore()

onMounted(() => {
  hydrate()
  store.ensureHydrated()
})

const kpis = computed(() => store.dashboardKpis())
const alertTotal = computed(() => kpis.value.alertCount + kpis.value.blockedCount)

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/canales', label: 'Canales y crédito' },
  { to: '/carga', label: 'Carga de ventas' },
  { to: '/exportacion', label: 'Exportación contable' },
]

const mobileOpen = ref(false)

function onLogout() {
  logout()
  router.push('/')
}

function resetDemo() {
  if (confirm('¿Restablecer datos de la demo al estado inicial?')) {
    store.resetDemo()
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream flex">
    <aside class="hidden md:flex w-60 flex-col bg-navy text-white shrink-0">
      <div class="px-4 py-5 border-b border-white/10">
        <div class="rounded-lg bg-cream px-3 py-2.5">
          <img
            :src="withBase('/logo-ultra-meat.svg')"
            alt="Ultra Meat"
            class="h-9 w-auto object-contain"
          />
        </div>
        <p class="text-steel text-xs mt-2 tracking-wide">TERMILCO SAS</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="block rounded-lg px-3 py-2.5 text-sm font-medium transition"
          :class="
            route.path === item.to
              ? 'bg-white/15 text-white'
              : 'text-steel hover:bg-white/10 hover:text-white'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-4 py-4 border-t border-white/10 text-xs text-steel space-y-1">
        <p>Flota: 7 vehículos</p>
        <p>Demo · datos locales</p>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white/80 border-b border-cream-dark px-4 py-3 flex items-center gap-3 sticky top-0 z-20 backdrop-blur">
        <button
          type="button"
          class="md:hidden rounded-lg border border-cream-dark px-2 py-1 text-navy"
          @click="mobileOpen = !mobileOpen"
        >
          Menú
        </button>

        <div class="min-w-0 flex-1">
          <p class="font-display font-semibold text-navy truncate">
            {{ session?.name || 'Usuario' }}
          </p>
          <p class="text-xs text-muted">
            {{ kpis.todayIso }} · indicadores al día
          </p>
        </div>

        <NuxtLink
          to="/canales"
          class="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
          :class="alertTotal ? 'bg-alert-soft text-alert' : 'bg-ok-soft text-ok'"
        >
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="alertTotal ? 'bg-alert' : 'bg-ok'"
          />
          {{ alertTotal }} alertas crédito
        </NuxtLink>

        <button
          type="button"
          class="text-xs text-muted hover:text-navy underline"
          @click="resetDemo"
        >
          Reset
        </button>
        <button
          type="button"
          class="text-xs text-muted hover:text-alert"
          @click="onLogout"
        >
          Salir
        </button>
      </header>

      <div
        v-if="mobileOpen"
        class="md:hidden bg-navy text-white px-3 py-2 space-y-1"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="block rounded-lg px-3 py-2 text-sm"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </div>

      <main class="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
