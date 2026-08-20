import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { ServerSettingsS, FileEntryS } from '@hightower/shared';
import { useFileStore } from '@/stores/fileStore';
import { useWorldStore } from '@/stores/worldStore';

export function useFileManager(server: MaybeRefOrGetter<ServerSettingsS>) {
    const store = useFileStore();
    const worldStore = useWorldStore();

    const password = ref('');
    const cwd = ref('');
    const entries = ref<FileEntryS[]>([]);
    const unlocked = ref(false);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const segments = computed(() => cwd.value.split('/').filter(Boolean));
    const atRoot = computed(() => segments.value.length === 0);

    async function refresh() {
        loading.value = true;
        error.value = null;
        try {
            const res = await store.list(toValue(server), cwd.value, password.value);
            entries.value = res.entries;
            unlocked.value = true;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to list files';
            if (!unlocked.value) entries.value = [];
        } finally {
            loading.value = false;
        }
    }

    function open(name: string) {
        cwd.value = cwd.value ? `${cwd.value}/${name}` : name;
        refresh();
    }

    function goUp() {
        cwd.value = segments.value.slice(0, -1).join('/');
        refresh();
    }

    function goTo(index: number) {
        cwd.value = segments.value.slice(0, index + 1).join('/');
        refresh();
    }

    async function remove(name: string) {
        const path = cwd.value ? `${cwd.value}/${name}` : name;
        loading.value = true;
        error.value = null;
        try {
            await store.remove(toValue(server), path, password.value);
            await refresh();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to delete';
            loading.value = false;
        }
    }

    async function upload(files: File[]) {
        if (!files.length) return;
        loading.value = true;
        error.value = null;
        try {
            await store.upload(toValue(server), cwd.value, files, password.value);
            await refresh();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to upload';
            loading.value = false;
        }
    }

    function downloadVolume(volIndex: number) {
        worldStore.downloadWorld(toValue(server), { vol: volIndex });
    }

    function downloadEntry(entry: FileEntryS) {
        const path = cwd.value ? `${cwd.value}/${entry.name}` : entry.name;
        worldStore.downloadWorld(toValue(server), { path, isDir: entry.type === 'dir' });
    }

    return {
        password, cwd, entries, unlocked, loading, error,
        segments, atRoot,
        refresh, open, goUp, goTo, remove, upload, downloadVolume, downloadEntry,
    };
}
