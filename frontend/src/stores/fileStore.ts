import { defineStore } from 'pinia';
import type { ServerSettingsS, FileListResponseS } from '@hightower/shared';
import { api } from '@/services/http';

export const useFileStore = defineStore('files', () => {
    async function list(server: ServerSettingsS, path: string, password: string): Promise<FileListResponseS> {
        const { data } = await api.post<FileListResponseS>('/files/list', {
            name: server.core_settings.name,
            created_by: server.core_settings.created_by,
            path,
            password,
        });
        return data;
    }

    async function remove(server: ServerSettingsS, path: string, password: string): Promise<void> {
        await api.post('/files/delete', {
            name: server.core_settings.name,
            created_by: server.core_settings.created_by,
            path,
            password,
        });
    }

    async function upload(server: ServerSettingsS, path: string, files: File[], password: string): Promise<void> {
        const form = new FormData();
        form.append('name', server.core_settings.name);
        form.append('created_by', server.core_settings.created_by);
        form.append('path', path);
        form.append('password', password);
        for (const file of files) form.append('files', file);

        await api.post('/files/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }

    return { list, remove, upload };
});
