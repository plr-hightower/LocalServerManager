import { defineStore } from 'pinia';
import type { ServerSettingsS } from '@hightower/shared';
import { api } from '@/services/http';

export const useWorldStore = defineStore('world', () => {
    // A real GET link, not an axios/blob fetch — lets the browser handle the
    // download itself (shows up in its download manager with real progress),
    // instead of buffering the whole archive in memory before saving it.
    function downloadWorld(server: ServerSettingsS) {
        const url = api.getUri({
            url: '/world/download',
            params: {
                name: server.core_settings.name,
                created_by: server.core_settings.created_by,
            },
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = `${server.core_settings.name}.zip`;
        link.click();
    }

    return { downloadWorld };
});
