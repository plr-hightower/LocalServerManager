import type { ServerSettingsS, CreateServerRequestS, StatusE } from '@hightower/shared';

const BASE = '/api/server';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export const serverService = {
    listServers: async (): Promise<ServerSettingsS[]> => {
        const data = await request<ServerSettingsS[] | null>('/listServers');
        return data ?? [];
    },
    buildServer: (payload: CreateServerRequestS) =>
        request<number>('/buildServer', { method: 'POST', body: JSON.stringify(payload) }),
    setStatus: (name: string, action: StatusE) =>
        request<{ success: boolean }>('/status', { method: 'POST', body: JSON.stringify({ name, action }) }),
};