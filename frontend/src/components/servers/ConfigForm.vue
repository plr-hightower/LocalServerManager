<script setup lang="ts">
import { ref } from 'vue';
import { useServerStore } from '@/stores/useServerStore';
import { GAME_LIBRARY } from '@rig/shared';
import { validateServerName, validateRAM } from '@/core/utils/validators';

const serverStore = useServerStore();

// Test example, user clicked on minecraft
// later will be a prop passed from LibraryView.vue
const selectedGame = GAME_LIBRARY['minecraft'];

// Data packet
const serverSettings = ref<Record<string, any>>({});

// Initiating packet with default values
selectedGame?.fields.forEach(field => {
    serverSettings.value[field.key] = field.defaultValue;
})

// Function to handle the Mailing of data packet
const submitForm = () => {
    const validName = validateServerName(serverSettings.value.name);
    const validRAM = validateRAM(serverSettings.value.ram);
    if (!validName || !validRAM) {
         alert(`Invalid input: ${!validName ? 'Server name must be between 1 and 30 characters.' : ''} ${!validRAM ? 'RAM must be between 1 and 22 GB.' : ''}`);
        return;
    }
    serverStore.createInstance(serverSettings.value, selectedGame?.gameName || "Unknown Game");
    alert(`Server instance for ${selectedGame?.gameName} created with settings: ${JSON.stringify(serverSettings.value)}`);
};
</script>

<template>
    <div class="config-form">
        <h2>Configure {{ selectedGame?.gameName }}</h2>

        <!-- Vue checks with for loop each field in selected game -->
        <div v-for="field in selectedGame?.fields" :key="field.key" class="field-group">
            <!-- For each field(basically option) it creates a label and a input -->
            <label>{{ field.label }}</label>

            <input 
            v-if="field.type!=='boolean' && field.type!=='select'"
            v-model="serverSettings[field.key]"
            :type="field.type"
            :pla1ceholder="field.placeholder" />

            <input
            v-else-if="field.type==='boolean'"
            v-model="serverSettings[field.key]"
            type="checkbox" />

            <select v-else-if="field.type==='select'" v-model="serverSettings[field.key]">
                <option v-for="option in field.options" :key="option" :value="option">
                    {{ option }}
                </option>
            </select>
        </div>

        <button @click="submitForm">Create Server Instance</button>
        <pre class="debug-view">{{ serverSettings }}</pre>

        <ul>
            <li v-for="instance in serverStore.instances" :key="instance.id">
                <strong>{{ instance.name }}</strong> - Status: <span>{{ instance.status }}</span>
                (ID: {{ instance.id }})
            </li>
        </ul>
    </div>
</template>

<style scoped>
.field-group {
    margin-bottom: 1rem; display: flex; flex-direction: column;
}
.debug-view {
    background: #888686; color: #0f0; padding: 10px; margin-top: 20px; border-radius: 5px;
}
</style>