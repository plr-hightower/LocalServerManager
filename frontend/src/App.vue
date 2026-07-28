<template>
    <div class="app-shell">
        <nav class="nav">
            <span class="nav__brand">
                To be named
                <small class="nav__version">v{{ version }}</small>
            </span>
            <RouterLink class="nav__link" to="/serverList">Server List</RouterLink>
            <RouterLink class="nav__link" to="/createServer">Create Server</RouterLink>
        </nav>
        <main>
            <RouterView />
        </main>
    </div>
</template>

<script setup lang="ts">
const version = __APP_VERSION__;
</script>
