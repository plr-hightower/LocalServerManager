<template>
    <div class="page">
        <div class="page__header">
            <h1>Servers</h1>
            <button class="btn btn--primary" @click="router.push('/createServer')">
                + Create Server
            </button>
        </div>

        <div v-if="serverStore.loading" class="loading"><div class="spinner"></div></div>

        <div v-else-if="serverStore.error" class="empty-state">{{ serverStore.error }}</div>

        <div v-else-if="serverStore.servers.length" class="server-grid">
            <ServerCard
                v-for="server in serverStore.visibleServers"
                :key="server.core_settings.server_id"
                :server="server"
                @open="goToDetail"
            />
        </div>

        <div v-else class="empty-state">No servers yet, click “Create Server”.</div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { ServerSettingsS } from '@hightower/shared';
import ServerCard from '@/components/server/ServerCard.vue';
import { useServerStore } from '@/stores/serverStore';

const router = useRouter();
const serverStore = useServerStore();

onMounted(serverStore.fetchServers); // populate from the DB on entry

function goToDetail(server: ServerSettingsS) {
    router.push(`/servers/${server.core_settings.server_id}`);
}
</script>