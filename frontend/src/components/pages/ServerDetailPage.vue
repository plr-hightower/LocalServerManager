<template>
    <div class="page" v-if="server">
        <div class="page__header">
            <h1>{{ server.core_settings.name }}</h1>
            <span class="badge" :class="`badge--${server.core_settings.status}`">{{ server.core_settings.status }}</span>
        </div>

        <div class="server-card">
            <div class="server-card__body">
                <div class="server-card__actions actions-row">
                    <ServerControls :server="server" show-download />
                    <RouterLink class="btn btn--sm btn--accent" :to="`/servers/${server.core_settings.server_id}/files`">
                        Manage Files
                    </RouterLink>
                    <button v-if="!recreating" class="btn btn--sm btn--ghost" @click="recreating = true">
                        Apply Settings
                    </button>
                    <button v-if="!confirming" class="btn btn--sm btn--danger" @click="confirming = true">
                        Delete Server
                    </button>
                </div>

                <form v-if="recreating" class="server-card__actions delete-confirm" @submit.prevent="onRecreate">
                    <input class="input" type="password" v-model="recreatePassword" placeholder="Manager password" autocomplete="off" />
                    <button class="btn btn--sm btn--accent" type="submit" :disabled="applying || !recreatePassword">
                        {{ applying ? 'Rebuilding…' : 'Rebuild container' }}
                    </button>
                    <button class="btn btn--sm btn--ghost" type="button" @click="cancelRecreate">Cancel</button>
                </form>
                <p v-if="recreating" class="hint">
                    Rebuilds the container so changed settings take effect. The world is kept and the
                    server is left stopped.
                </p>
                <p v-if="recreateError" class="field-error">{{ recreateError }}</p>

                <form v-if="confirming" class="server-card__actions delete-confirm" @submit.prevent="onDelete">
                    <input class="input" type="password" v-model="password" placeholder="Manager password" autocomplete="off" />
                    <button class="btn btn--sm btn--danger" type="submit" :disabled="deleting || !password">
                        {{ deleting ? 'Deleting…' : 'Confirm delete' }}
                    </button>
                    <button class="btn btn--sm btn--ghost" type="button" @click="cancelDelete">Cancel</button>
                </form>
                <p v-if="deleteError" class="field-error">{{ deleteError }}</p>

                <ServerStats :stats="stats" />

                <div class="server-card__meta">
                    <div><span class="label">Game</span><span class="mono">{{ server.core_settings.game_container }}</span></div>
                    <div><span class="label">Port</span><span class="mono">{{ server.core_settings.host_port ?? '-' }}</span></div>
                    <div><span class="label">Max Players</span><span>{{ server.core_settings.max_num_players }}</span></div>
                    <div><span class="label">RAM</span><span>{{ server.core_settings.ram_alloc_mb / 1024 }} GB</span></div>
                </div>

                <hr />
                <!-- read-only game settings via the same composable; hidden ones are omitted -->
                <div v-for="field in visibleFields" :key="field.key" class="form-field">
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerStore } from '@/stores/serverStore';
import { useServerForm } from '@/composables/useServerForm';
import { useHealthCheck } from '@/composables/useHealthCheck';
import ServerControls from '@/components/server/ServerControls.vue';
import ServerStats from '@/components/server/ServerStats.vue';

const route = useRoute();
const router = useRouter();
const store = useServerStore();

onMounted(() => { if (!store.servers.length) store.fetchServers(); });

const server = computed(() => store.getById(Number(route.params.id)));

const { fields, model } = useServerForm(
    () => server.value?.core_settings.game_container ?? 'minecraft',
    { initial: () => server.value?.game_settings, readonly: true },
);

// hidden settings are omitted; legacy servers (no env_visibility) fall back to per-field defaults
const visibleFields = computed(() => {
    const vis = server.value?.core_settings.env_visibility;
    return fields.value.filter(f => vis?.[f.key] ?? f.visibility);
});

const { stats } = useHealthCheck(server);

const confirming = ref(false);
const password = ref('');
const deleting = ref(false);
const deleteError = ref<string | null>(null);

function cancelDelete() {
    confirming.value = false;
    password.value = '';
    deleteError.value = null;
}

const recreating = ref(false);
const recreatePassword = ref('');
const applying = ref(false);
const recreateError = ref<string | null>(null);

function cancelRecreate() {
    recreating.value = false;
    recreatePassword.value = '';
    recreateError.value = null;
}

async function onRecreate() {
    if (!server.value) return;
    applying.value = true;
    recreateError.value = null;
    try {
        await store.recreate(server.value, recreatePassword.value);
        cancelRecreate();
    } catch (e) {
        recreateError.value = e instanceof Error ? e.message : 'Failed to rebuild container';
    } finally {
        applying.value = false;
    }
}

async function onDelete() {
    if (!server.value) return;
    deleting.value = true;
    deleteError.value = null;
    try {
        await store.remove(server.value, password.value);
        router.push('/serverList');
    } catch (e) {
        deleteError.value = e instanceof Error ? e.message : 'Failed to delete server';
        deleting.value = false;
    }
}
</script>

<style scoped>
.actions-row {
    align-items: center;
    margin-bottom: var(--gap-md);
}
.delete-confirm {
    align-items: center;
    margin-bottom: var(--gap-md);
}
.delete-confirm .input {
    max-width: 220px;
}
.hint {
    color: var(--fg-muted, #888);
    font-size: 0.85rem;
    margin-bottom: var(--gap-md);
}
</style>
