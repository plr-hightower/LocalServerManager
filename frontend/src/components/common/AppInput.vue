<script setup lang="ts">
defineProps<{
    type?: string;
    label?: string;
    modelValue: string | number;
    placeholder?: string;
    error?: string;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
    <div class="input-group">
        <label v-if="label" class="input-label">{{ label }}</label>
        <input :type="type || 'text'"
               :value="modelValue"
               :placeholder="placeholder"
               :class="['app-input', { 'input-error': error }]"
               @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
        <span v-if="error" class="error-text">{{ error }}</span>
    </div>
</template>

<style scoped>
.input-group { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
.input-label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
.app-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.7rem;
  color: white;
  outline: none;
  transition: border-color 0.2s;
}
.app-input:focus { border-color: #3b82f6; }
.input-error { border-color: #ef4444 !important; }
.error-text { font-size: 0.75rem; color: #ef4444; }
</style>