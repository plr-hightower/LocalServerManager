<template>
    <div class="page" v-if="server">
        <div class="page__header">
            <h1>{{ server.core_settings.name }} Files</h1>
            <span class="badge" :class="`badge--${server.core_settings.status}`">{{ server.core_settings.status }}</span>
        </div>

        <RouterLink class="nav__link" :to="`/servers/${server.core_settings.server_id}`">← Back to server</RouterLink>

        <div class="server-card">
            <div class="server-card__body">
                <div v-if="!fm.unlocked.value" class="form-section">
                    <h2 class="form-section__title">Enter manager password</h2>
                    <form class="form-field" @submit.prevent="fm.refresh()">
                        <input
                            class="input"
                            type="password"
                            v-model="fm.password.value"
                            placeholder="Password"
                            autocomplete="off"
                        />
                        <button class="btn btn--primary" type="submit" :disabled="fm.loading.value || !fm.password.value">
                            {{ fm.loading.value ? '…' : 'Unlock' }}
                        </button>
                    </form>
                    <p v-if="fm.error.value" class="field-error">{{ fm.error.value }}</p>
                </div>

                <template v-else>
                    <p v-if="!canModify" class="field-error">
                        Server is {{ server.core_settings.status }}. Stop it to upload or delete files.
                    </p>

                    <div class="breadcrumb">
                        <button class="btn btn--sm" :disabled="fm.atRoot.value" @click="fm.goTo(-1)">volumes</button>
                        <template v-for="(seg, i) in fm.segments.value" :key="i">
                            <span class="breadcrumb__sep">/</span>
                            <button class="btn btn--sm" @click="fm.goTo(i)">{{ seg }}</button>
                        </template>
                    </div>

                    <table class="table">
                        <tbody>
                            <tr v-if="!fm.atRoot.value" class="table__row--clickable" @click="fm.goUp()">
                                <td class="mono">..</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr
                                v-for="entry in fm.entries.value"
                                :key="entry.name"
                                :class="{ 'table__row--clickable': entry.type === 'dir' }"
                                @click="entry.type === 'dir' && fm.open(entry.name)"
                            >
                                <td class="mono">{{ entry.type === 'dir' ? '📁' : '📄' }} {{ entry.name }}</td>
                                <td>{{ entry.type === 'dir' ? '' : formatSize(entry.size) }}</td>
                                <td class="server-card__actions">
                                    <button class="btn btn--sm" @click.stop="download(entry)">
                                        Download
                                    </button>
                                    <button
                                        v-if="!fm.atRoot.value"
                                        class="btn btn--danger btn--sm"
                                        :disabled="!canModify || fm.loading.value"
                                        @click.stop="confirmDelete(entry.name)"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!fm.entries.value.length">
                                <td class="empty-state">Empty</td>
                            </tr>
                        </tbody>
                    </table>

                    <hr />

                    <div v-if="!fm.atRoot.value" class="form-section">
                        <h2 class="form-section__title">Upload to /{{ fm.cwd.value }}</h2>
                        <div class="server-card__actions">
                            <select class="input" v-model="uploadMode" :disabled="!canModify">
                                <option value="files">Files</option>
                                <option value="folder">Folder</option>
                            </select>
                            <input
                                ref="fileInput"
                                :key="uploadMode"
                                class="input"
                                type="file"
                                multiple
                                :webkitdirectory="uploadMode === 'folder'"
                                :disabled="!canModify"
                            />
                            <button
                                class="btn btn--primary btn--sm"
                                :disabled="!canModify || fm.loading.value"
                                @click="submitUpload"
                            >
                                {{ fm.loading.value ? 'Uploading…' : 'Upload' }}
                            </button>
                        </div>
                    </div>

                    <p v-if="fm.error.value" class="field-error">{{ fm.error.value }}</p>
                </template>
            </div>
        </div>
    </div>
    <div v-else class="empty-state">Server not found.</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { FileEntryS } from '@hightower/shared';
import { useRoute } from 'vue-router';
import { useServerStore } from '@/stores/serverStore';
import { useFileManager } from '@/composables/useFileManager';

const route = useRoute();
const store = useServerStore();

onMounted(() => { if (!store.servers.length) store.fetchServers(); });

const server = computed(() => store.getById(Number(route.params.id)));
const canModify = computed(() => server.value?.core_settings.status === 'stopped');

const fm = useFileManager(() => server.value!);

const fileInput = ref<HTMLInputElement | null>(null);
const uploadMode = ref<'files' | 'folder'>('files');

function volIndexOf(name: string): number {
    return Number(/^vol(\d+)$/.exec(name)?.[1] ?? 0);
}

function download(entry: FileEntryS) {
    if (fm.atRoot.value) fm.downloadVolume(volIndexOf(entry.name));
    else fm.downloadEntry(entry);
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

async function submitUpload() {
    const files = Array.from(fileInput.value?.files ?? []);
    if (!files.length) return;
    await fm.upload(files);
    if (fileInput.value) fileInput.value.value = '';
}

function confirmDelete(name: string) {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) fm.remove(name);
}
</script>

<style scoped>
.breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
}
.breadcrumb__sep {
    opacity: 0.5;
}
</style>
