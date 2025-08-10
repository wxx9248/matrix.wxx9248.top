<template>
  <VCard
    :loading="serverState.state === undefined"
    class="card"
    elevation="24"
    @click="$emit('refresh')"
  >
    <VCardTitle>{{ $t('runningStatus') }}</VCardTitle>
    <VContainer class="container card-icon-container">
      <VIcon
        v-if="serverState.state === undefined"
        color="white"
        icon="mdi-sync-circle"
        size="150"
      ></VIcon>
      <VIcon
        v-else-if="serverState.state === 'operational'"
        color="green"
        icon="mdi-check-circle"
        size="150"
      ></VIcon>
      <VIcon
        v-else-if="serverState.state === 'offline'"
        color="red"
        icon="mdi-minus-circle"
        size="150"
      ></VIcon>
      <VIcon
        v-else
        color="red"
        icon="mdi-close-circle"
        size="150"
      ></VIcon>
    </VContainer>
    <VContainer class="container card-item-container">
      <VCardItem class="card-item">
        <span v-if="serverState.state === undefined"
          >{{ $t('gettingInfo') }}</span
        >
        <span v-else-if="serverState.state === 'operational'"
          >{{ $t('serverNormal') }}</span
        >
        <span v-else-if="serverState.state === 'offline'"
          >{{ $t('serverOffline') }}</span
        >
        <span v-else>{{ $t('unableToGetInfo') }}</span>
      </VCardItem>
      <VCardItem
        v-if="serverState.state === 'operational'"
        class="card-item"
      >
        <span>{{ $t('latestClientVersion') }}</span>
        <CopiableCode
          :disable-copy="true"
          :text="serverState.latestClientVersionSupported"
          @error="$emit('copyError', $event)"
          @success="$emit('copySuccess')"
        />
      </VCardItem>
    </VContainer>
  </VCard>
</template>

<script setup lang="ts">
import CopiableCode from '@/components/CopiableCode.vue';
import type { ServerState } from '@/types';

interface Props {
  serverState: ServerState;
}

interface Emits {
  (e: 'refresh'): void;
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
