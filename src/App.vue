<template>
  <VApp>
    <VMain>
      <VContainer class="container main-container">
        <h1>欢迎来到wxx9248的聊天服务器！</h1>
        <p>
          <span>你需要一个支持</span>
          <VImg
            :src="matrixLogoURL"
            class="logo logo-matrix"
            @click="openURLInNewTab('https://matrix.org')"
          />
          <span>协议的客户端来连接到聊天室。</span>
        </p>
        <VDivider></VDivider>
        <VContainer class="container card-container">
          <VCard class="card" elevation="24">
            <VCardTitle>详细信息</VCardTitle>
            <VContainer class="container card-icon-container">
              <VIcon color="blue" icon="mdi-information" size="150"></VIcon>
            </VContainer>
            <VContainer class="container card-item-container">
              <VCardItem class="card-item">
                <span>matrix 域：</span>
                <CopiableCode
                  :text="serverName"
                  @error="copyToClipboardErrorHandler"
                  @success="copyToClipboardSuccessHandler"
                />
              </VCardItem>
              <VCardItem class="card-item">
                <span>入口地址：</span>
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
            <VCardTitle>运行状态</VCardTitle>
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
                  >正在获取信息……</span
                >
                <span v-else-if="serverState.state === 'operational'"
                  >服务器运行正常 :)</span
                >
                <span v-else-if="serverState.state === 'offline'"
                  >服务器离线，正在维护 :(</span
                >
                <span v-else>未能获取到信息</span>
              </VCardItem>
              <VCardItem
                v-if="serverState.state === 'operational'"
                class="card-item"
              >
                <span>支持的最新 matrix 客户端版本：</span>
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
            <VCardTitle>注册入口状态</VCardTitle>
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
                  >正在获取信息……</span
                >
                <span v-else-if="serverState.registration === 'open'"
                  >注册入口已开放</span
                >
                <span v-else-if="serverState.registration === 'invitation'"
                  >注册入口已开放，但需要邀请码</span
                >
                <span v-else-if="serverState.registration === 'closed'"
                  >服务器暂不开放注册</span
                >
                <span v-else>未能获取到信息</span>
              </VCardItem>
            </VContainer>
          </VCard>
        </VContainer>
      </VContainer>
    </VMain>
    <VFooter class="container footer-container">
      <div class="column">
        <p>
          <span>推荐使用</span>
          <VImg
            :src="elementLogoURL"
            class="logo logo-element"
            @click="openURLInNewTab('https://element.io')"
          />
        </p>
        <p>支持全平台运行，功能完善</p>
      </div>
      <VDivider vertical />
      <div class="column">
        <VIcon class="logo logo-github" size="3rem">mdi-github</VIcon>
        <span
          >本服务器由
          <a href="https://github.com/matrix-org/synapse">Synapse</a>
          强力驱动</span
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

<script>
import elementLogoURL from "@/assets/images/element-logo.svg";
import matrixLogoURL from "@/assets/images/matrix-logo.svg";
import CopiableCode from "@/components/CopiableCode.vue";

export default {
  name: "App",
  components: { CopiableCode },
  setup() {
    const serverName = "wxx9248.top";
    const serverEntryPoint = "https://matrix.wxx9248.top";

    return { serverName, serverEntryPoint, matrixLogoURL, elementLogoURL };
  },
  methods: {
    openURLInNewTab(url) {
      window.open(url);
    },
    copyToClipboardSuccessHandler() {
      this.showAlert("已复制到剪贴板 :)", "success", 2000);
    },
    copyToClipboardErrorHandler(error) {
      this.showAlert("无法复制到剪贴板 :(", "error", 2000);
      console.error(error);
    },
    showAlert(message, type, timeout) {
      this.alertState.text = message;
      this.alertState.type = type;
      this.alertState.show = true;

      if (timeout) {
        setTimeout(() => {
          this.alertState.show = false;
        }, timeout);
      }
    },
    async getServerState() {
      this.state = undefined;
      this.latestClientVersionSupported = "";
      this.registration = undefined;

      try {
        // Get if operational
        const response = await fetch("/_matrix/client/versions");

        switch (response.status) {
          case 200:
            this.serverState.state = "operational";
            const json = await response.json();
            // Get latest supported client version
            this.serverState.latestClientVersionSupported =
              json["versions"][json["versions"].length - 1];
            break;
          case 502:
            this.serverState.state = "offline";
            break;
          default:
            this.serverState.state = "error";
            break;
        }
      } catch (error) {
        this.serverState.state = "error";
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
            this.serverState.registration = "open";
            break;
          case 401:
            const json = await response.json();
            if (
              json["flows"].some((flow) =>
                flow["stages"].includes("m.login.registration_token")
              )
            ) {
              this.serverState.registration = "invitation";
            } else {
              this.serverState.registration = "open";
            }
            break;
          case 403:
            this.serverState.registration = "closed";
            break;
          case 429:
            break;
          case 400:
          default:
            this.serverState.registration = "error";
        }
      } catch (error) {
        this.serverState.registration = "error";
        console.error(error);
      }
    }
  },
  data() {
    return {
      alertState: {
        type: undefined,
        text: "",
        show: false
      },
      serverState: {
        state: undefined,
        latestClientVersionSupported: "",
        registration: undefined
      }
    };
  },
  computed: {},
  mounted() {
    this.getServerState();
  }
};
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
