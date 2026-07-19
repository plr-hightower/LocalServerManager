import { defineStore } from 'pinia';
import type { ServerSettingsS } from '@hightower/shared';
import { api } from '@/services/http';

export const useWorldStore = defineStore('world', () => {
    async function downloadWorld(server: ServerSettingsS) {
        const { data } = await api.post<Blob>('/world/download', {
            name: server.core_settings.name,
            created_by: server.core_settings.created_by,
        }, { responseType: 'blob' });

        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${server.core_settings.name}.zip`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return { downloadWorld };
});
