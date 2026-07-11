<template>
    <div class="server-card__actions">
        <button v-if="!isRunning" class="btn btn--primary btn--sm" :disabled="pending" @click="start">
            {{ pending ? '…' : 'Start' }}
        </button>
        <button v-else class="btn btn--ghost btn--sm" :disabled="pending" @click="stop">
            {{ pending ? '…' : 'Stop' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ServerSettingsS } from '@hightower/shared';
import { useServerStatus } from '@/composables/useServerStatus';

const props = defineProps<{ server: ServerSettingsS }>();
const { start, stop, pending } = useServerStatus(() => props.server);

const isRunning = computed(() =>
    ['started', 'starting'].includes(props.server.core_settings.status),
);
</script>
