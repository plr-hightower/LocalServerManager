<template>
    <div class="server-card">
        <div class="server-card__header">
            <h2>{{ server.core_settings.name }}</h2>
            <span class="badge" :class="`badge--${server.core_settings.status}`">
                {{ server.core_settings.status }}
            </span><h2></h2>
        </div>

         <div class="server-card__body">
            <div class="server-card__meta">
                <div>
                    <span class="label">Game</span>
                    <span class="mono">{{ server.core_settings.game_container }}</span>
                </div>
                <div>
                    <span class="label">Port</span>
                    <span class="mono">{{ server.core_settings.host_port ?? '—' }}</span>
                </div>
                <div>
                    <span class="label">Players</span>
                    <span>{{ server.core_settings.max_num_players }}</span>
                </div>
                <div>
                    <span class="label">RAM</span>
                    <span>{{ ramGb }} GB</span>
                </div>
            </div>

            <div class="server-card__actions">
                <button
                    v-if="!isRunning"
                    class="btn btn--primary btn--sm"
                    @click="emit('start', server)"
                >Start</button>
                <button
                    v-else
                    class="btn btn--ghost btn--sm"
                    @click="emit('stop', server)"
                >Stop</button>

                <button class="btn btn--ghost btn--sm" @click="emit('open', server)">Details</button>
                <button class="btn btn--danger btn--sm" @click="emit('delete', server)">Delete</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerSettingsS } from '@hightower/shared';

const props = defineProps<{
    server: ServerSettingsS
}>()

const emit = defineEmits<{
    start: [server: ServerSettingsS],
    stop: [server: ServerSettingsS],
    open: [server: ServerSettingsS],
    delete: [server: ServerSettingsS]
}>();

const isRunning = computed(() => ['started', 'starting'].includes(props.server.core_settings.status));
const ramGb = computed(() => (props.server.core_settings.ram_alloc_mb / 1024).toFixed(2));
</script>