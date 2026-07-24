<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    tone?: 'navy' | 'alert' | 'ok' | 'muted'
  }>(),
  { tone: 'navy' },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    type="button"
    :title="label"
    :aria-label="label"
    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition hover:bg-cream-dark/70"
    :class="{
      'text-navy': tone === 'navy',
      'text-alert': tone === 'alert',
      'text-ok': tone === 'ok',
      'text-muted': tone === 'muted',
    }"
    @click.stop="emit('click', $event)"
  >
    <slot />
  </button>
</template>
