<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'alert' | 'ok' | 'warn'
}>()
</script>

<template>
  <div
    class="rounded-2xl border bg-white p-4 shadow-sm"
    :class="{
      'border-cream-dark': !tone || tone === 'default',
      'border-alert/40 bg-alert-soft': tone === 'alert',
      'border-ok/30 bg-ok-soft': tone === 'ok',
      'border-warn/40 bg-warn-soft': tone === 'warn',
    }"
  >
    <p class="text-xs uppercase tracking-wide text-muted font-semibold">{{ label }}</p>
    <p class="font-display text-2xl font-bold text-navy mt-1">{{ value }}</p>
    <p v-if="hint" class="text-sm text-muted mt-1">{{ hint }}</p>
  </div>
</template>
