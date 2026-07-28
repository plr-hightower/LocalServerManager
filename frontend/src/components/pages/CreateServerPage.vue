<template>
    <div class="page">
        <div class="page__header">
            <h1>Create Server</h1>
        </div>

        <form class="server-card" @submit.prevent="submit">
            <div class="server-card__body">
                <div class="form-section">
                    <h2 class="form-section__title">Server Details</h2>
                    <div class="form-grid">
                        <div class="form-field">
                            <label class="label">Server name</label>
                            <input class="input" v-model="core.name" required />
                        </div>
                        <div class="form-field">
                            <label class="label">Game</label>
                            <select class="select" v-model="core.game_container">
                                <option v-for="g in games" :key="g" :value="g">{{ g }}</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="label">RAM</label>
                            <select class="select" v-model.number="core.ram_alloc_mb">
                                <option v-for="r in ramOptions" :key="r" :value="r">{{ r / 1024 }} GB</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label class="label">Max players</label>
                            <input type="number" class="input" min="1" max="10" v-model.number="core.max_num_players" />
                        </div>
                        <div class="form-field">
                            <label class="label">Created by</label>
                            <input class="input" v-model="core.created_by" />
                        </div>
                        <div class="form-field">
                            <label class="label">Manager password <span class="mono">(optional, min 4 characters)</span></label>
                            <input class="input" type="password" minlength="4" v-model="core.manager_password" autocomplete="new-password" />
                        </div>
                        <div class="form-field">
                            <label class="label">Admin password </label>
                            <input class="input" type="password" v-model="adminPassword" autocomplete="off" />
                        </div>
                    </div>
                </div>

                <div class="form-section" v-for="group in groupedFields" :key="group.type">
                    <div class="form-grid">
                        <div v-for="field in group.items" :key="field.key" class="form-field">
                            <div class="field-head">
                                <label v-if="field.type === 'boolean'" class="checkbox-field">
                                    <input type="checkbox" class="checkbox" v-model="model[field.key]" />
                                    <span class="label">{{ prettyLabel(field.key) }}</span>
                                </label>
                                <label v-else class="label">{{ prettyLabel(field.key) }}</label>
                                <button type="button" class="eye-btn" :class="{ 'eye-btn--off': !visibility[field.key] }"
                                    :title="visibilityTip(field.key)" :aria-pressed="visibility[field.key]"
                                    @click="visibility[field.key] = !visibility[field.key]">
                                    <svg v-if="visibility[field.key]" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path
                                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                </button>
                            </div>
                            <template v-if="field.type !== 'boolean'">
                                <select v-if="field.type === 'select'" class="select" v-model="model[field.key]"
                                    @blur="validateField(field.key)">
                                    <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                                </select>
                                <input v-else-if="field.type === 'number'" type="number" class="input" :min="field.min"
                                    :max="field.max" v-model.number="model[field.key]" @blur="validateField(field.key)" />
                                <input v-else class="input" :maxlength="field.maxLength" v-model="model[field.key]"
                                    @blur="validateField(field.key)" />
                            </template>
                        </div>
                    </div>
                </div>

                <div class="server-card__actions">
                    <button type="submit" class="btn btn--primary" :disabled="submitting">
                        {{ submitting ? 'Creating…' : 'Create' }}
                    </button>
                    <button type="button" class="btn btn--ghost" @click="router.push('/serverList')">Cancel</button>
                </div>
                <p v-if="error" class="field-error">{{ error }}</p>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { GameEnum, RamAllocMbEnum, type GameE, type RamAllocMbE, type CreateServerRequestS } from '@hightower/shared';
import { useServerStore } from '@/stores/serverStore';
import { useServerForm, type FormField } from '@/composables/useServerForm';

const GROUP_ORDER: FormField['type'][] = ['select', 'number', 'boolean', 'text'];

const router = useRouter();
const store = useServerStore();

const games = GameEnum.options;
const ramOptions = RamAllocMbEnum.values;

const core = reactive({
    name: '',
    game_container: 'minecraft' as GameE,
    ram_alloc_mb: 2048 as RamAllocMbE,
    max_num_players: 5,
    created_by: 'unknown user',
    manager_password: '',
});

const adminPassword = ref('');

const { fields, model, visibility, validateField } = useServerForm(() => core.game_container );

const groupedFields = computed(() => GROUP_ORDER
    .map(type => ({ type, items: fields.value.filter(f => f.type === type) }))
    .filter(g => g.items.length > 0));

const submitting = ref(false);
const error = ref<string | null>(null);

function prettyLabel(key: string) {
    return key.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function visibilityTip(key: string) {
    return visibility.value[key]
        ? 'Visible, shows on the server\'s detail page. Click to hide.'
        : 'Hidden, won\'t appear on the server\'s detail page. Click to show.';
}

async function submit() {
    submitting.value = true;
    error.value = null;
    try {
        const payload: CreateServerRequestS = {
            core_settings: { ...core, manager_password: core.manager_password || undefined, env_visibility: { ...visibility.value } },
            game_settings: { ...model.value } as CreateServerRequestS['game_settings'], // derive the hidden field
            admin_password: adminPassword.value || undefined,
        };
        await store.create(payload);
        router.push('/serverList');
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to create server';
    } finally {
        submitting.value = false;
    }
}
</script>

<style scoped>
.field-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-sm);
}
.eye-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--accent, #5b9dd9);
    opacity: 0.9;
}
.eye-btn:hover {
    opacity: 1;
}
.eye-btn--off {
    color: var(--text-muted, #8a8f98);
}
</style>