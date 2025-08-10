<template>
  <VContainer class="container alert-container">
    <VFadeTransition>
      <VAlert
        :model-value="alertState.show"
        :type="alertState.type"
        closable
        density="compact"
        max-width="50rem"
        @update:model-value="$emit('update:show', $event)"
      >
        {{ alertState.text }}
      </VAlert>
    </VFadeTransition>
  </VContainer>
</template>

<script setup lang="ts">
import type { AlertState } from '@/types';

interface Props {
  alertState: AlertState;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.container {
  display: flex;
}

.alert-container {
  display: flex;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.alert-container > div {
  margin-bottom: 1rem;
}
</style>
