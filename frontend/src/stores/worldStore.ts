import { defineStore } from 'pinia';
import type { ServerSettingsS } from '@hightower/shared';
import { api } from '@/services/http';

export type DownloadTarget = { vol?: number; path?: string; isDir?: boolean };

export function downloadFilename(serverName: string, { vol, path, isDir }: DownloadTarget): string {
    if (path !== undefined) {
        const name = path.split('/').pop() || 'download';
        return isDir ? `${name}.zip` : name;
    }
    if (vol !== undefined) return `${serverName}_vol${vol}.zip`;
    return `${serverName}.zip`;
}

export const useWorldStore = defineStore('world', () => {
    // A real GET link, not an axios/blob fetch , lets the browser handle the
    // download itself (shows up in its download manager with real progress),
    // instead of buffering the whole archive in memory before saving it.
    function downloadWorld(server: ServerSettingsS, target: DownloadTarget = {}) {
        const { vol, path } = target;

        const url = api.getUri({
            url: '/world/download',
            params: {
                name: server.core_settings.name,
                created_by: server.core_settings.created_by,
                ...(vol !== undefined ? { vol } : {}),
                ...(path !== undefined ? { path } : {}),
            },
        });

        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFilename(server.core_settings.name, target);
        link.click();
    }

    return { downloadWorld };
});
