<script setup lang="ts">
import { ref, computed } from 'vue';
import { useServerStore } from '@/stores/useServerStore';
import ServerCard from '@/components/servers/ServerCard.vue';
import { ServerStatus } from '@rig/shared';

const props = defineProps<{ selectedGameId: string}>();
const serverStore = useServerStore();

const showCreateForm = ref(false);

const filteredInstances = computed(() => {
    return serverStore.instances.filter(
        (instance) => instance.gameId === props.selectedGameId
    );
});

const handleActions = (id: string, action: 'start' | 'stop' | 'restart') => {
  const server = serverStore.instances.find(s => s.id === id);
  
  if (!server) return;

  if (action === 'start') {
    server.status = ServerStatus.STARTING;
    setTimeout(() => server.status = ServerStatus.RUNNING, 2000);
  } 
  else if (action === 'stop') {
    server.status = ServerStatus.STOPPING;
    setTimeout(() => server.status = ServerStatus.STOPPED, 2000);
  }
  else if (action === 'restart') {
    server.status = ServerStatus.STOPPING;
    setTimeout(() => {
      server.status = ServerStatus.STARTING;
      setTimeout(() => server.status = ServerStatus.RUNNING, 2000);
    }, 2000);
  }
};
</script>

<template>
    <div class="dashboard">
        <h2>{{ selectedGameId }} Servers</h2>

        <div v-if="filteredInstances.length > 0" class="server-grid">
            <ServerCard
            v-for="instance in filteredInstances"
            :key="instance.id"
            :instance="instance"
            @actions="handleActions"/>
        </div>

        <div v-else class="no-servers">
            <p>No servers found for {{ selectedGameId }}</p>
            <button @click="showCreateForm = true">+ Create New Server</button>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
}
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.no-servers {
  text-align: center;
  margin-top: 4rem;
  padding: 3rem;
  border: 2px dashed #334155;
  border-radius: 12px;
  color: #94a3b8;
}
h2 {
  text-transform: capitalize;
  font-size: 1.8rem;
  color: #f8fafc;
}
</style>