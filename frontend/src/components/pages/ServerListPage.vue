<template>
    <div class="page">
        <div class="page__header">
            <h1>Servers</h1>
            <button class="btn btn--primary" @click="addServer">+ Create Server</button>
        </div>

        <div v-if="servers.length" class="server-grid">
            <ServerCard
                v-for="server in servers"
                :key="server.core_settings.server_id"
                :server="server"
                @start="onStart"
                @stop="onStop"
                @delete="onDelete"
                @open="onOpen"
            />
        </div>
        <div v-else class="empty-state">No servers yet — click “Create Server”.</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ServerSettingsS, StatusE } from '@hightower/shared';
import ServerCard from '@/components/server/ServerCard.vue';

const servers = ref<ServerSettingsS[]>([]);
let counter = 0;

const statuses: StatusE[] = ['stopped', 'started', 'starting', 'error'];

function addServer() {
    counter++;
    servers.value.push({
        core_settings: {
            server_id: counter,
            name: `test-server-${counter}`,
            game_container: 'minecraft',
            container_id: `container_${counter}`,
            ram_alloc_mb: 2048,
            max_num_players: 5,
            status: statuses[counter % statuses.length],
            host_port: 6000 + counter,
            default_host_port: '25565',
            created_by: 'edoucet',
            created_at: new Date(),
        },
        game_settings: {
            game: 'minecraft',
            EULA: 'TRUE',
            TYPE: 'FABRIC',
            VERSION: 'LATEST',
            MOTD: 'A Minecraft Server',
            MAX_PLAYERS: 5,
            VIEW_DISTANCE: 10,
        },
    });
}

function setStatus(target: ServerSettingsS, status: StatusE) {
    const found = servers.value.find(
        s => s.core_settings.server_id === target.core_settings.server_id
    );
    if (found) found.core_settings.status = status;
}

const onStart = (s: ServerSettingsS) => setStatus(s, 'started');
const onStop  = (s: ServerSettingsS) => setStatus(s, 'stopped');

function onDelete(target: ServerSettingsS) {
    servers.value = servers.value.filter(
        s => s.core_settings.server_id !== target.core_settings.server_id
    );
}

const onOpen = (s: ServerSettingsS) => console.log('open detail for', s.core_settings.name);
</script>