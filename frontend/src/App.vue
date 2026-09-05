<template>
    <div class="app-shell">
        <nav class="nav">
            <span class="nav__brand">
                <span class="nav__name">
                    <span class="nav__initial">L</span>ocal
                    <span class="nav__initial">S</span>erver
                    <span class="nav__initial">M</span>anager
                </span>
                <small class="nav__version">v{{ version }}</small>
            </span>
            <RouterLink class="nav__link" to="/serverList">Server List</RouterLink>
            <RouterLink class="nav__link" to="/createServer">Create Server</RouterLink>
            <ThemeSwitcher />
        </nav>
        <main>
            <RouterView />
        </main>
    </div>
</template>

<script setup lang="ts">
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

const version = __APP_VERSION__;
</script>
