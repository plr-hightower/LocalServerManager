<template>
    <div class="page">
        <div class="page__header">
            <h1>Servers</h1>
            <button class="btn btn--primary" @click="router.push('/createServer')">
                + Create Server
            </button>
        </div>

        <div v-if="store.loading" class="loading"><div class="spinner"></div></div>

        <div v-else-if="store.error" class="empty-state">{{ store.error }}</div>

        <div v-else-if="store.servers.length" class="server-grid">
            <ServerCard
                v-for="server in store.visibleServers"
                :key="server.core_settings.server_id"
                :server="server"
                @delete="store.dismiss"
                @open="goToDetail"
            />
        </div>

        <div v-else class="empty-state">No servers yet — click “Create Server”.</div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useServerStore } from '@/stores/serverStore';
import type { ServerSettingsS } from '@hightower/shared';
import ServerCard from '@/components/server/ServerCard.vue';

const router = useRouter();
const store = useServerStore();

onMounted(store.fetchServers); // populate from the DB on entry

function goToDetail(server: ServerSettingsS) {
    router.push(`/servers/${server.core_settings.server_id}`);
}
</script>