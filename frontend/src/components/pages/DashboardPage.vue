<template>
    <div class="dashboard">
        <h1>Dashboard</h1>

        <section class="logs">
            <div class="tabs">
                <button
                    :class="{ active: activeTab === 'dozzle' }"
                    @click="activeTab = 'dozzle'"
                >
                    Live Logs
                </button>
                <button
                    :class="{ active: activeTab === 'seq' }"
                    @click="activeTab = 'seq'"
                >
                    Log History
                </button>
            </div>

            <iframe
                v-if="activeTab === 'dozzle'"
                src="/dozzle/"
                class="log-frame"
                title="Dozzle live container logs"
            />
            <iframe
                v-if="activeTab === 'seq'"
                src="/seq/"
                class="log-frame"
                title="Seq structured log history"
            />
        </section>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'

    type LogTab = 'dozzle' | 'seq'

    const activeTab = ref<LogTab>('dozzle')
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
    gap: 16px;
}

.logs {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.tabs button {
    padding: 6px 16px;
    border-radius: 4px;
    border: 1px solid #444;
    background: transparent;
    color: inherit;
    cursor: pointer;
}

.tabs button.active {
    background: #444;
}

.log-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
}
</style>