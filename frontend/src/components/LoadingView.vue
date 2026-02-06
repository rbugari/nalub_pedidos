<template>
  <div class="loading-container">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
    ></v-progress-circular>
    <p class="loading-text mt-4">Cargando...</p>
  </div>
</template>

<script setup>
// Loading component para lazy loading de rutas
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-text {
  color: #666;
  font-size: 16px;
}
</style>
