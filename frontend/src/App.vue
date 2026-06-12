<template>
    <nav>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/serverList">Server List</RouterLink>
        <RouterLink to="/serverDetail">Server Detail</RouterLink>
        <RouterLink to="/createServer">Create Server</RouterLink>
    </nav>
    <main>
        <RouterView />
    </main>
</template>