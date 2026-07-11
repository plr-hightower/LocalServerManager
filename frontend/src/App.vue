<template>
    <div class="app-shell">
        <nav class="nav">
            <span class="nav__brand">Hightower</span>
            <RouterLink class="nav__link" to="/dashboard">Dashboard</RouterLink>
            <RouterLink class="nav__link" to="/serverList">Server List</RouterLink>
            <RouterLink class="nav__link" to="/createServer">Create Server</RouterLink>
        </nav>
        <main>
            <RouterView />
        </main>
    </div>
</template>