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
          <VCard class="card" elevation="24">
            <VCardTitle>{{ $t('details') }}</VCardTitle>
            <VContainer class="container card-icon-container">
              <VIcon color="blue" icon="mdi-information" size="150"></VIcon>
            </VContainer>
            <VContainer class="container card-item-container">
              <VCardItem class="card-item">
                <span>{{ $t('matrixDomain') }}</span>
                <CopiableCode
                  :text="serverName"
                  @error="copyToClipboardErrorHandler"
                  @success="copyToClipboardSuccessHandler"
                />
              </VCardItem>
              <VCardItem class="card-item">
                <span>{{ $t('entryAddress') }}</span>
                <CopiableCode
                  :text="serverEntryPoint"
                  @error="copyToClipboardErrorHandler"
                  @success="copyToClipboardSuccessHandler"
                />
              </VCardItem>
            </VContainer>
          </VCard>
          <VCard
            :loading="serverState.state === undefined"
            class="card"
            elevation="24"
            @click="getServerState"
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
                  @error="copyToClipboardErrorHandler"
                  @success="copyToClipboardSuccessHandler"
                />
              </VCardItem>
            </VContainer>
          </VCard>
          <VCard
            :loading="serverState.registration === undefined"
            class="card"
            elevation="24"
            @click="getServerState"
          >
            <VCardTitle>{{ $t('registrationStatus') }}</VCardTitle>
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
              <VIcon
                v-else
                color="red"
                icon="mdi-close-circle"
                size="150"
              ></VIcon>
            </VContainer>
            <VContainer class="container card-item-container">
              <VCardItem class="card-item">
                <span v-if="serverState.registration === undefined"
                  >{{ $t('gettingInfo') }}</span
                >
                <span v-else-if="serverState.registration === 'open'"
                  >{{ $t('registrationOpen') }}</span
                >
                <span v-else-if="serverState.registration === 'invitation'"
                  >{{ $t('registrationInvitation') }}</span
                >
                <span v-else-if="serverState.registration === 'closed'"
                  >{{ $t('registrationClosed') }}</span
                >
                <span v-else>{{ $t('unableToGetInfo') }}</span>
              </VCardItem>
            </VContainer>
          </VCard>
        </VContainer>
      </VContainer>
    </VMain>
    <VFooter class="container footer-container">
      <div class="column">
        <p>
          <span>{{ $t('recommendUsing') }}</span>
          <VImg
            :src="elementLogoURL"
            class="logo logo-element"
            @click="openURLInNewTab('https://element.io')"
          />
        </p>
        <p>{{ $t('fullFeatured') }}</p>
      </div>
      <VDivider vertical />
      <div class="column">
        <VIcon class="logo logo-github" size="3rem">mdi-github</VIcon>
        <span
          >{{ $t('poweredBy') }}
          <a href="https://github.com/matrix-org/synapse">Synapse</a></span
        >
      </div>
    </VFooter>
  </VApp>
  <VContainer class="container alert-container">
    <VFadeTransition>
      <VAlert
        :model-value="alertState.show"
        :type="alertState.type"
        closable
        density="compact"
        max-width="50rem"
      >
        {{ alertState.text }}
      </VAlert>
    </VFadeTransition>
  </VContainer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import elementLogoURL from "@/assets/images/element-logo.svg";
import matrixLogoURL from "@/assets/images/matrix-logo.svg";
import CopiableCode from "@/components/CopiableCode.vue";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";

// Server configuration
const serverName = "wxx9248.top";
const serverEntryPoint = "https://matrix.wxx9248.top";

// i18n setup
const { t } = useI18n();

// Alert state
interface AlertState {
  type: 'success' | 'error' | 'warning' | 'info' | undefined;
  text: string;
  show: boolean;
}

const alertState = reactive<AlertState>({
  type: undefined,
  text: "",
  show: false
});

// Server state
type ServerStatus = 'operational' | 'offline' | 'error' | undefined;
type RegistrationStatus = 'open' | 'invitation' | 'closed' | 'error' | undefined;

interface ServerState {
  state: ServerStatus;
  latestClientVersionSupported: string;
  registration: RegistrationStatus;
}

const serverState = reactive<ServerState>({
  state: undefined,
  latestClientVersionSupported: "",
  registration: undefined
});

// Methods
const openURLInNewTab = (url: string): void => {
  window.open(url);
};

const copyToClipboardSuccessHandler = (): void => {
  showAlert(t("copiedSuccess"), "success", 2000);
};

const copyToClipboardErrorHandler = (error: Error): void => {
  showAlert(t("copyError"), "error", 2000);
  console.error(error);
};

const showAlert = (message: string, type: AlertState['type'], timeout?: number): void => {
  alertState.text = message;
  alertState.type = type;
  alertState.show = true;

  if (timeout) {
    setTimeout(() => {
      alertState.show = false;
    }, timeout);
  }
};

const getServerState = async (): Promise<void> => {
  serverState.state = undefined;
  serverState.latestClientVersionSupported = "";
  serverState.registration = undefined;

  try {
    // Get if operational
    const response = await fetch("/_matrix/client/versions");

    switch (response.status) {
      case 200:
        serverState.state = "operational";
        const json = await response.json();
        // Get latest supported client version
        serverState.latestClientVersionSupported =
          json["versions"][json["versions"].length - 1];
        break;
      case 502:
        serverState.state = "offline";
        break;
      default:
        serverState.state = "error";
        break;
    }
  } catch (error) {
    serverState.state = "error";
    console.error(error);
  }

  try {
    // Get if registrable
    const response = await fetch("/_matrix/client/r0/register", {
      method: "POST",
      body: JSON.stringify({ initial_device_display_name: "dummy" })
    });

    switch (response.status) {
      case 200:
        serverState.registration = "open";
        break;
      case 401:
        const json = await response.json();
        if (
          json["flows"].some((flow: any) =>
            flow["stages"].includes("m.login.registration_token")
          )
        ) {
          serverState.registration = "invitation";
        } else {
          serverState.registration = "open";
        }
        break;
      case 403:
        serverState.registration = "closed";
        break;
      case 429:
        break;
      case 400:
      default:
        serverState.registration = "error";
    }
  } catch (error) {
    serverState.registration = "error";
    console.error(error);
  }
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

.card-icon-container {
  justify-content: center;
}

.card-item-container {
  flex-direction: column;
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

.footer-container > .column {
  padding: 2rem;
  text-align: center;
  width: 50%;
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

.logo-element {
  cursor: pointer;
  height: 2rem;
  margin-bottom: 0.2rem;
  width: 10rem;
}

.logo-github {
  margin-bottom: 0.7rem;
  margin-right: 0.5rem;
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

  .footer-container {
    flex-direction: column;
  }

  .footer-container > .column {
    width: 100%;
  }
}

@media screen and (max-width: 600px) {
  .card {
    width: 95%;
  }
}
</style>