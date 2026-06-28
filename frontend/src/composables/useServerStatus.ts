import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import { StatusEnum, type ServerSettingsS, type StatusE } from '@hightower/shared';
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
        start: () => change(StatusEnum.enum.started),
        stop:  () => change(StatusEnum.enum.stopped),
    };
}
