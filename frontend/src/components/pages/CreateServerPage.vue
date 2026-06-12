<template>
    <h1>Create Server</h1>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

console.log(router.currentRoute.value.path)
console.log(router.currentRoute.value.params) 
</script>