<template>
    <div class="dashboard">
        <h1>Dashboard</h1>

        <section class="logs">
            <iframe
                src="/dozzle/"
                class="log-frame"
                title="Dozzle live container logs"
            />
        </section>
    </div>
</template>

<script setup lang="ts">
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

.log-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
}
</style>