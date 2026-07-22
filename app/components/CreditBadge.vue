<script setup lang="ts">
defineProps<{
  level: 'ok' | 'alerta' | 'bloqueado'
  compact?: boolean
}>()

const labels = {
  ok: 'OK',
  alerta: 'Alerta',
  bloqueado: 'Bloqueado',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full font-semibold"
    :class="[
      compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
      level === 'ok' && 'bg-ok-soft text-ok',
      level === 'alerta' && 'bg-alert-soft text-alert',
      level === 'bloqueado' && 'bg-navy text-white',
    ]"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="level === 'ok' ? 'bg-ok' : 'bg-alert'"
    />
    {{ labels[level] }}
  </span>
</template>
