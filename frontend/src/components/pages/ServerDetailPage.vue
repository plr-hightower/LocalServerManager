<template>
    <div class="page" v-if="server">
        <div class="page__header">
            <h1>{{ server.core_settings.name }}</h1>
            <span class="badge" :class="`badge--${server.core_settings.status}`">{{ server.core_settings.status }}</span>
        </div>

        <div class="server-card">
            <div class="server-card__body">
                <ServerControls :server="server" />
                <ServerStats :stats="stats" />

                <div class="server-card__meta">
                    <div><span class="label">Game</span><span class="mono">{{ server.core_settings.game_container }}</span></div>
                    <div><span class="label">Port</span><span class="mono">{{ server.core_settings.host_port ?? '—' }}</span></div>
                    <div><span class="label">Max Players</span><span>{{ server.core_settings.max_num_players }}</span></div>
                    <div><span class="label">RAM</span><span>{{ server.core_settings.ram_alloc_mb / 1024 }} GB</span></div>
                </div>

                <hr />
                <!-- read-only game settings via the same composable -->
                <div v-for="field in fields" :key="field.key" class="form-field">
                    <template v-if="field.type !== 'fixed'">
                        <label class="label">{{ field.key }}</label>
                        <input class="input" :value="model[field.key]" disabled />
                    </template>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="empty-state">Server not found.</div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useServerStore } from '@/stores/serverStore';
import { useServerForm } from '@/composables/useServerForm';
import { useHealthCheck } from '@/composables/useHealthCheck';
import ServerControls from '@/components/server/ServerControls.vue';
import ServerStats from '@/components/server/ServerStats.vue';

const route = useRoute();
const store = useServerStore();

onMounted(() => { if (!store.servers.length) store.fetchServers(); });

const server = computed(() => store.getById(Number(route.params.id)));

const { fields, model } = useServerForm(
    () => server.value?.core_settings.game_container ?? 'minecraft',
    { initial: () => server.value?.game_settings, readonly: true },
);

const { stats } = useHealthCheck(server);
</script>
