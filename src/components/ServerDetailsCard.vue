<template>
  <VCard class="card" elevation="24">
    <VCardTitle>{{ $t('details') }}</VCardTitle>
    <VContainer class="container card-icon-container">
      <VIcon color="blue" icon="mdi-information" size="150"></VIcon>
    </VContainer>
    <VContainer class="container card-item-container">
      <VCardItem class="card-item">
        <span>{{ $t('matrixDomain') }}</span>
        <CopiableCode
          :text="serverConfig.serverName"
          @error="$emit('copyError', $event)"
          @success="$emit('copySuccess')"
        />
      </VCardItem>
      <VCardItem class="card-item">
        <span>{{ $t('entryAddress') }}</span>
        <CopiableCode
          :text="serverConfig.serverEntryPoint"
          @error="$emit('copyError', $event)"
          @success="$emit('copySuccess')"
        />
      </VCardItem>
    </VContainer>
  </VCard>
</template>

<script setup lang="ts">
import CopiableCode from '@/components/CopiableCode.vue';
import type { ServerConfig } from '@/types';

interface Props {
  serverConfig: ServerConfig;
}

interface Emits {
  (e: 'copySuccess'): void;
  (e: 'copyError', error: Error): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.container {
  display: flex;
}

.card-icon-container {
  justify-content: center;
}

.card-item-container {
  flex-direction: column;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  width: 500px;
}

.card-item {
  flex-direction: row;
  justify-content: space-between;
}

@media screen and (max-width: 600px) {
  .card {
    width: 95%;
  }
}
</style>
