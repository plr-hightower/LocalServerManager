<script setup lang="ts">
defineProps<{
    variant?: 'primary' | 'outline' | 'danger';
    type?: 'button' | 'submit';
    disabled?: boolean;
}>();
</script>

<template>
    <button :type="type || 'button'"
            :disabled="disabled"
            :class="['app-btn', variant || 'primary']">
        <slot />
    </button>
</template>

<style>
.app-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.primary { background: #3b82f6; color: white; border: none; }
.primary:hover:not(:disabled) { background: #2563eb; }

.outline { background: transparent; border: 1px solid #334155; color: #94a3b8; }
.outline:hover:not(:disabled) { border-color: #64748b; color: #f8fafc; background: #1e293b; }

.danger { background: #ef4444; color: white; border: none; }
.danger:hover:not(:disabled) { background: #dc2626; }

.app-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
</style>