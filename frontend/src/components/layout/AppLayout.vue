<script lang="ts">

</script>

<template>
    <div class="app-layout">
        <aside class="app-sidebar">
            <Sidebar />
        </aside>

        <main class="main-content">
            <header class="app-header">
                <Header />
            </header>

            <section class="view-area">
                <slot />
            </section>
        </main>
    </div>
</template>

<style scoped>
.app-container {
    display: flex;
    height: 100vh;
    background-color: #1a1a1a;
    color: white;
}
.sidebar {
    width: 260px;
    border-right: 1px solid #333;
}
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}
</style>