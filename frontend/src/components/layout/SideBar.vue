<script setup lang="ts">
import { GAME_LIBRARY } from '@rig/shared';
import { useServerStore } from '@/stores/useServerStore';

const games = Object.values(GAME_LIBRARY);
const serverStore = useServerStore();
</script>

<template>
    <div class="sidebar">
        <h3>Games</h3>
        <ul>
            <li v-for="game in games" :key="game.gameId" class="game-item">
            <span class="game-icon">{{ game.icon }}</span>
            <span class="game-name">{{ game.gameName }}</span>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.sidebar {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 0.5rem;
}
.game-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.game-item:hover {
    background-color: #333;
}
</style>