import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import type { ServerSettingsS } from '@hightower/shared';
import { useWorldStore } from '@/stores/worldStore';

export function useWorldManager(server: MaybeRefOrGetter<ServerSettingsS>) {
    const store = useWorldStore();
    const pending = ref(false);

    async function download() {
        pending.value = true;
        try {
            await store.downloadWorld(toValue(server));
        } finally {
            pending.value = false;
        }
    }

    return { pending, download };
}
