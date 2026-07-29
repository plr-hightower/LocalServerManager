import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ServerSettingsS, StatusE, CreateServerRequestS, HealthCheckResponseS } from '@hightower/shared';
import { api } from '@/services/http';

export const useServerStore = defineStore('servers', () => {
    // States
    const servers = ref<ServerSettingsS[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Getters
    const getById = (id: number) => servers.value.find(s => s.core_settings.server_id === id);
    const getByName = (name: string) => servers.value.find(s => s.core_settings.name === name);

    const total = computed(() => servers.value.length);
    const running = computed(() =>
        servers.value.filter(s => ['started', 'starting'].includes(s.core_settings.status)).length
    );

    // Dashboard overview, ex. { started: 3, stopped: 1, error: 1 }
    const statusCounts = computed(() => {
        const counts: Record<string, number> = {};
        for (const s of servers.value) {
            const st = s.core_settings.status;
            counts[st] = (counts[st] ?? 0) + 1;
        }
        return counts;
    });

    // servers the user has hidden from view (UI-only , NOT deleted on the backend)
    const hiddenIds = ref(new Set<number>());

    const visibleServers = computed(() =>
        servers.value.filter(s => !hiddenIds.value.has(s.core_settings.server_id!)),
    );

    // remove the card from the list without touching the server or its files
    function dismiss(server: ServerSettingsS) {
        hiddenIds.value.add(server.core_settings.server_id!);
    }

    // Actions
    async function fetchServers() {
        loading.value = true;
        error.value = null;
        try {
            const { data } = await api.get<ServerSettingsS[] | null>('/server/listServers');
            servers.value = data ?? []; // null → []
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to load servers';
        } finally {
            loading.value = false;
        }
    }

    // each mutation re-mirrors the DB afterwards (DB = source of truth)
    async function create(payload: CreateServerRequestS) {
        await api.post<number>('/server/buildServer', payload);
        await fetchServers();
    }

    // deletes the server + container for real (gated by the server's manager password)
    async function remove(server: ServerSettingsS, password: string) {
        await api.post('/server/deleteServer', {
            name: server.core_settings.name,
            created_by: server.core_settings.created_by,
            password,
        });
        await fetchServers();
    }

    // replaces the container so changed settings apply , world volume is kept
    async function recreate(server: ServerSettingsS, password: string) {
        await api.post('/server/recreateServer', {
            name: server.core_settings.name,
            password,
        });
        await fetchServers();
    }

    async function changeStatus(server: ServerSettingsS, action: StatusE) {
        await api.post<{ success: boolean }>('/server/status', {
            name: server.core_settings.name,
            action,
        });
        await fetchServers();
    }

    // health is transient/per-container, so the action returns it rather than storing it
    async function fetchHealth(): Promise<HealthCheckResponseS> {
        const { data } = await api.get<HealthCheckResponseS>('/server/healthCheck');
        return data;
    }

    return {
        servers,
        loading,
        error,
        getById,
        getByName,
        total,
        running,
        statusCounts,
        fetchServers,
        create,
        remove,
        recreate,
        changeStatus,
        fetchHealth,
        visibleServers,
        dismiss,
    };
});
