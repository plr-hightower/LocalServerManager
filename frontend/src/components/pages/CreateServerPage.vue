<template>
    <div class="page">
        <div class="page__header">
            <h1>Create Server</h1>
        </div>

        <form class="server-card" @submit.prevent="submit">
            <div class="server-card__body">
                <!-- core settings: same for every game -->
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

                <!-- dynamic game settings, derived from the schema -->
                <hr />
                <div v-for="field in fields" :key="field.key" class="form-field">
                    <template v-if="field.type !== 'fixed'">
                        <label class="label">{{ field.key }}</label>
                        <select v-if="field.type === 'select'" class="select" v-model="model[field.key]">
                            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                        </select>
                        <input v-else-if="field.type === 'number'" type="number" class="input" :min="field.min"
                            :max="field.max" v-model.number="model[field.key]" />
                        <input v-else class="input" :maxlength="field.maxLength" v-model="model[field.key]" />
                    </template>
                </div>

                <div class="server-card__actions">
                    <!-- <button type="submit" class="btn btn--primary" :disabled="submitting">
                        {{ submitting ? 'Creating…' : 'Create' }}
                    </button>
                    <button type="button" class="btn btn--ghost" @click="router.push('/serverList')">Cancel</button> -->
                    Create Server Is Disabled
                </div>
                <p v-if="error" class="field-error">{{ error }}</p>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { GameEnum, RamAllocMbEnum, type GameE, type RamAllocMbE, type CreateServerRequestS } from '@hightower/shared';
import { useServerStore } from '@/stores/serverStore';
import { useServerForm } from '@/composables/useServerForm';

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
});

const { fields, model } = useServerForm(() => core.game_container );

const submitting = ref(false);
const error = ref<string | null>(null);

async function submit() {
    submitting.value = true;
    error.value = null;
    try {
        const payload = {
            core_settings: { ...core },
            game_settings: { ...model.value}, // derive the hidden field
        } as CreateServerRequestS;
        await store.create(payload);
        router.push('/serverList');
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to create server';
    } finally {
        submitting.value = false;
    }
}
</script>