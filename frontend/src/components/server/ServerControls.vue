<template>
    <div class="server-card__actions">
        <button v-if="!isRunning" class="btn btn--primary btn--sm" :disabled="pending" @click="start">
            {{ pending ? '…' : 'Start' }}
        </button>
        <button v-else class="btn btn--ghost btn--sm" :disabled="pending" @click="stop">
            {{ pending ? '…' : 'Stop' }}
        </button>
        <button
            v-if="showDownload && canDownload"
            class="btn btn--accent btn--sm"
            :disabled="downloadPending"
            @click="download"
        >
            {{ downloadPending ? '…' : 'Download World Files' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ServerSettingsS } from '@hightower/shared';
import { useServerStatus } from '@/composables/useServerStatus';
import { useWorldManager } from '@/composables/useWorldManager';

const props = defineProps<{ server: ServerSettingsS; showDownload?: boolean }>();
const { start, stop, pending } = useServerStatus(() => props.server);
const { download, pending: downloadPending } = useWorldManager(() => props.server);

const isRunning = computed(() =>
    ['started', 'starting'].includes(props.server.core_settings.status),
);

const canDownload = computed(() => props.server.core_settings.status === 'stopped');
</script>
