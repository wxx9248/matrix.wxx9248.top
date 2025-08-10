<template>
  <VApp>
    <LanguageSwitcher />
    <VMain>
      <VContainer class="container main-container">
        <h1>{{ $t('welcome') }}</h1>
        <p>
          <span>{{ $t('needClient') }}</span>
          <VImg
            :src="matrixLogoURL"
            class="logo logo-matrix"
            @click="openURLInNewTab('https://matrix.org')"
          />
          <span>{{ $t('protocolToConnect') }}</span>
        </p>
        <VDivider></VDivider>
        <VContainer class="container card-container">
          <ServerDetailsCard
            :server-config="serverConfig"
            @copy-success="copyToClipboardSuccessHandler"
            @copy-error="copyToClipboardErrorHandler"
          />
          <ServerStatusCard
            :server-state="serverState"
            @refresh="getServerState"
            @copy-success="copyToClipboardSuccessHandler"
            @copy-error="copyToClipboardErrorHandler"
          />
          <RegistrationStatusCard
            :server-state="serverState"
            @refresh="getServerState"
          />
        </VContainer>
      </VContainer>
    </VMain>
    <RecommendedClientFooter />
  </VApp>
  <AppAlert 
    :alert-state="alertState" 
    @update:show="hideAlert"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import matrixLogoURL from "@/assets/images/matrix-logo.svg";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";
import ServerDetailsCard from "@/components/ServerDetailsCard.vue";
import ServerStatusCard from "@/components/ServerStatusCard.vue";
import RegistrationStatusCard from "@/components/RegistrationStatusCard.vue";
import RecommendedClientFooter from "@/components/RecommendedClientFooter.vue";
import AppAlert from "@/components/AppAlert.vue";
import { useServerState } from "@/composables/useServerState";
import { useAlert } from "@/composables/useAlert";
import type { ServerConfig } from "@/types";

// Server configuration
const serverConfig: ServerConfig = {
  serverName: "wxx9248.top",
  serverEntryPoint: "https://matrix.wxx9248.top"
};

// Composables
const { serverState, getServerState } = useServerState();
const { 
  alertState, 
  copyToClipboardSuccessHandler, 
  copyToClipboardErrorHandler,
  hideAlert 
} = useAlert();

// Methods
const openURLInNewTab = (url: string): void => {
  window.open(url);
};

// Lifecycle
onMounted(() => {
  getServerState();
});
</script>

<style scoped>
p {
  margin: 1rem 0 1rem 0;
}

.container {
  display: flex;
}

.main-container {
  flex-direction: column;
  padding-top: 5rem;
  text-align: center;
}

.card-container {
  display: grid;
  gap: 2rem;
  grid-template-columns: auto auto auto;
  justify-content: center;
  padding-top: 4rem;
}

.logo {
  display: inline-block;
  vertical-align: middle;
}

.logo-matrix {
  cursor: pointer;
  height: 2.6rem;
  margin-bottom: 0.15rem;
  width: 6.5rem;
}

@media screen and (max-width: 1600px) {
  .card-container {
    grid-template-columns: auto auto;
  }
}

@media screen and (max-width: 1200px) {
  .card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>