<template>
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
</template>

<script setup lang="ts">
import elementLogoURL from "@/assets/images/element-logo.svg";

const openURLInNewTab = (url: string): void => {
  window.open(url);
};
</script>

<style scoped>
.container {
  display: flex;
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

@media screen and (max-width: 1200px) {
  .footer-container {
    flex-direction: column;
  }

  .footer-container > .column {
    width: 100%;
  }
}
</style>
