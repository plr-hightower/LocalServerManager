<script setup lang="ts">
import { computed } from 'vue';
import type { ServerInstance } from '@rig/shared';
import { STATUS_CONFIG } from '@/core/constants/statusConfig';

const props = defineProps<
    { instance: ServerInstance }
>();

const emits = defineEmits<{ 
    (e: 'actions', id: string, action: "start" | "stop" | "restart") : string 
    (e: 'select', id: string) : string
}>();

const statusUI = computed(() => {
    return STATUS_CONFIG[props.instance.status] || { color: 'gray', label: 'Unknown' }
})
const isRunning = computed(() => props.instance.status === 'running');
const isChangingState = computed(() => ['starting', 'stopping', 'restarting'].includes(props.instance.status));
</script>

<template>
    <div class="server-card" :class="{ 'is-active': isRunning }">
        <div class="card-header">
            <span class="game-badge">{{  instance.gameId }}</span>
        </div>

        <div class="card-body">
            <h3>{{ instance.name }}</h3>
            <div class="status">
                <span class="dot" :style="{ backgroundColor: statusUI.color }"></span>
                <span class="status-text">{{ statusUI.label }}</span>
            </div>
            <p class="specs">{{ instance.settings.memory }}MB RAM / Port {{ instance.port }}</p>
        </div>

        <div class="card-actions">
            <button v-if="!isRunning" class="btn-start" :disabled="isChangingState" 
            @click="emits('actions', instance.id, 'start')"
            >Start Server</button>

            <button v-else class="btn-stop" :disabled="isChangingState" 
            @click="emits('actions', instance.id, 'stop')"
            >Stop Server</button>
        </div>
    </div>
</template>

<style scoped>
.server-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6vw;
    padding: 1.5rem;
    transition: transform 0.2s, border-color 0.2s;
}
.server-card:hover {
    border-color: #475569;
    transform: translateY(-2px)
}
.is-active {
    border-left: 4px solid #10b981
}
.dot {
    display: inline-block;
    width: 2vw;
    height: 2vh;
    border-radius: 50%;
    margin-right: 8px;
    box-shadow: 0 0 8px v-bind('statusUI.color');
}
.card-actions {
    width: 100%;
    padding: 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.2s
}
.btn-start { background: #10b981; color: #064e3b}
.btn-stop { background: #ef4444; color: #fff}
.btn-start:disabled { opacity: 0.5; cursor: not-allowed; }
</style>