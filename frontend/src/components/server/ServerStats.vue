<template>
    <div class="server-stats">
        <template v-if="stats">
            <div class="stat-line">
                <span class="label">CPU</span>
                <div class="meter"><div class="meter__fill" :style="{ width: cpu + '%' }" /></div>
                <span class="mono">{{ cpu }}%</span>
            </div>
            <div class="stat-line">
                <span class="label">RAM</span>
                <div class="meter"><div class="meter__fill" :style="{ width: mem + '%' }" /></div>
                <span class="mono">{{ Math.round(stats.memoryUsageMb) }} / {{ Math.round(stats.memoryLimitMb) }} MB</span>
            </div>
        </template>
        <div v-else class="empty-state">No live stats (server stopped).</div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContainerStatS } from '@hightower/shared';

const props = defineProps<{ stats: ContainerStatS | null }>();
const cpu = computed(() => Math.round(props.stats?.cpuUsagePercent ?? 0));
const mem = computed(() => Math.round(props.stats?.memoryUsagePercent ?? 0));
</script>
