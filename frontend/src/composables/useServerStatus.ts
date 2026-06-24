import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import type { ServerSettingsS, StatusE } from '@hightower/shared';
import { useServerStore } from '@/stores/serverStore';

export function useServerStatus(server: MaybeRefOrGetter<ServerSettingsS>) {
    const store = useServerStore();
    const pending = ref(false);

    async function change(action: StatusE) {
        pending.value = true;
        try {
            await store.changeStatus(toValue(server), action);
        } finally {
            pending.value = false;
        }
    }

    return {
        pending,
        start: () => change('started'),
        stop:  () => change('stopped'),
    };
}
