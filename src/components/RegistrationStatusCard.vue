<template>
  <VCard
    :loading="serverState.registration === undefined"
    class="card"
    elevation="24"
    @click="$emit('refresh')"
  >
    <VCardTitle>{{ $t("registrationStatus") }}</VCardTitle>
    <VContainer class="container card-icon-container">
      <VIcon
        v-if="serverState.registration === undefined"
        color="white"
        icon="mdi-sync-circle"
        size="150"
      ></VIcon>
      <VIcon
        v-else-if="serverState.registration === 'open'"
        color="green"
        icon="mdi-chevron-up-circle"
        size="150"
      ></VIcon>
      <VIcon
        v-else-if="serverState.registration === 'invitation'"
        color="yellow"
        icon="mdi-alert-circle-check"
        size="150"
      ></VIcon>
      <VIcon
        v-else-if="serverState.registration === 'closed'"
        color="red"
        icon="mdi-minus-circle"
        size="150"
      ></VIcon>
      <VIcon v-else color="red" icon="mdi-close-circle" size="150"></VIcon>
    </VContainer>
    <VContainer class="container card-item-container">
      <VCardItem class="card-item">
        <span v-if="serverState.registration === undefined">{{
          $t("gettingInfo")
        }}</span>
        <span v-else-if="serverState.registration === 'open'">{{
          $t("registrationOpen")
        }}</span>
        <span v-else-if="serverState.registration === 'invitation'">{{
          $t("registrationInvitation")
        }}</span>
        <span v-else-if="serverState.registration === 'closed'">{{
          $t("registrationClosed")
        }}</span>
        <span v-else>{{ $t("unableToGetInfo") }}</span>
      </VCardItem>
    </VContainer>
  </VCard>
</template>

<script setup lang="ts">
import type { ServerState } from "@/types";

interface Props {
  serverState: ServerState;
}

interface Emits {
  (e: "refresh"): void;
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
