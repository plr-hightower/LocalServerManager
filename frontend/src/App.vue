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
        <!--
          AGPL section 13 requires that users interacting with this program over a
          network be offered its Corresponding Source. If you modify and deploy
          LSM, point sourceUrl at YOUR modified source, not the upstream repo.
        -->
        <footer class="footer">
            <span>
                Local Server Manager v{{ version }} , free software under the
                <a :href="licenseUrl" target="_blank" rel="noopener">AGPL-3.0-or-later</a>.
            </span>
            <a :href="sourceUrl" target="_blank" rel="noopener">Source code</a>
        </footer>
    </div>
</template>

<script setup lang="ts">
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

const version = __APP_VERSION__;

// Corresponding Source offer for network users (AGPL section 13). A deployer
// running a modified version must replace this with a link to their own source.
const sourceUrl = 'https://github.com/plr-hightower/HightowerServers';
const licenseUrl = 'https://www.gnu.org/licenses/agpl-3.0.html';
</script>

<style scoped>
.footer {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 0.8rem;
}

.footer a {
    color: var(--color-primary);
}
</style>
