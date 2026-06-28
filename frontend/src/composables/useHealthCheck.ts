import { ref, onMounted, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue';
import type { ContainerStatS, ServerSettingsS } from '@hightower/shared';
import { serverService } from '@/services/serverService';

const POLL_MS = 1000;

export function useHealthCheck(server: MaybeRefOrGetter<ServerSettingsS | undefined>) {
    const stats = ref<ContainerStatS | null>(null);
    let timer: ReturnType<typeof setInterval> | null = null;

    async function refresh() {
        const s = toValue(server);
        if (!s) return;
        try {
            const health = await serverService.healthCheck();
            stats.value = health.containers.find(c => c.name === s.core_settings.name) ?? null;
        } catch {
            stats.value = null;
        }
    }

    onMounted(() => {
        refresh();
        timer = setInterval(refresh, POLL_MS);
    });

    onUnmounted(() => {
        if (timer) clearInterval(timer);
    });

    return { stats, refresh };
}
