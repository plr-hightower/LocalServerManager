<script setup lang="ts">
defineProps<{ show: boolean; title:string }>();
defineEmits(['close']);
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ title }}</h3>
                        <button class="close-btn" @click="$emit('close')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <slot />
                    </div>
                    <div v-if="$slots.footer" class="modal-footer">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  width: 90%; max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}
.modal-header { padding: 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; background: #0f172a; border-radius: 0 0 12px 12px; display: flex; justify-content: flex-end; gap: 1rem; }
.close-btn { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
</style>