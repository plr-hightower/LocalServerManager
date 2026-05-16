<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from './components/layout/AppLayout.vue';
import Dashboard from './views/Dashboard.vue';
import SideBar from './components/layout/SideBar.vue';
const activeGame = ref('minecraft')
</script>

<template>
    <AppLayout>
        <template #sidebar>
            <SideBar @select-game="(id: string) => activeGame = id" />
        </template>

        <Dashboard :selected-game-id="activeGame" />
    </AppLayout>
</template>

<style>
:root{
    --primary-color: #000000;
}
</style>