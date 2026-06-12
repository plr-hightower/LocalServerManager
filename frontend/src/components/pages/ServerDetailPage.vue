<template>
    <h1>Server Details</h1>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

console.log(router.currentRoute.value.path)
console.log(router.currentRoute.value.params) 
</script>