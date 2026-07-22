<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { login } = useSession()
const name = ref('María')
const router = useRouter()

function enter() {
  login(name.value)
  router.push('/dashboard')
}
</script>

<template>
  <div class="pattern-meat min-h-screen flex flex-col">
    <header class="px-6 pt-8 pb-4 max-w-5xl mx-auto w-full">
      <p class="text-steel-dark text-sm tracking-wide uppercase">Demo comercial</p>
    </header>

    <main class="flex-1 flex items-center justify-center px-4 pb-16">
      <div class="w-full max-w-xl">
        <div class="text-center mb-8">
          <img
            :src="withBase('/logo-ultra-meat.svg')"
            alt="Ultra Meat"
            class="mx-auto h-16 md:h-20 w-auto mb-5"
          />
          <p class="text-muted max-w-md mx-auto leading-relaxed">
            Empresa enfocada en la importación de carnes de primera calidad.
            Consolidá ventas, crédito y reportes contables en un solo lugar.
          </p>
        </div>

        <div class="bg-white/90 border border-cream-dark rounded-2xl p-6 shadow-sm">
          <label class="block text-sm font-semibold text-navy mb-1" for="nombre">
            Tu nombre
          </label>
          <input
            id="nombre"
            v-model="name"
            type="text"
            class="w-full rounded-lg border border-cream-dark bg-cream px-3 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-steel"
            placeholder="Nombre para la demo"
            @keyup.enter="enter"
          />

          <button
            type="button"
            class="w-full rounded-xl bg-alert text-white font-semibold py-3 hover:brightness-110 transition"
            @click="enter"
          >
            Entrar a la demo
          </button>
        </div>

        <p class="text-center text-xs text-muted mt-6">
          Datos mock · persistencia local · TERMILCO SAS · Canelones, Uruguay
        </p>
      </div>
    </main>
  </div>
</template>
