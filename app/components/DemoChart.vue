<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

defineProps<{
  type: 'bar' | 'line' | 'doughnut'
  data: unknown
  options?: unknown
}>()
</script>

<template>
  <ClientOnly>
    <Bar v-if="type === 'bar'" :data="data as any" :options="(options as any) || {}" />
    <Line v-else-if="type === 'line'" :data="data as any" :options="(options as any) || {}" />
    <Doughnut v-else :data="data as any" :options="(options as any) || {}" />
    <template #fallback>
      <div class="h-64 flex items-center justify-center text-muted text-sm">
        Cargando gráfico…
      </div>
    </template>
  </ClientOnly>
</template>
