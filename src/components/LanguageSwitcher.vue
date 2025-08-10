<template>
  <div class="language-switcher">
    <VBtn
      icon
      variant="text"
      @click="toggleMenu"
      ref="menuActivator"
    >
      <VIcon>mdi-translate</VIcon>
    </VBtn>
    
    <VMenu
      :model-value="showMenu"
      :activator="menuActivator"
      location="bottom end"
      offset="8"
      @update:model-value="showMenu = $event"
    >
      <VList density="compact">
        <VListItem
          v-for="(label, locale) in supportedLocales"
          :key="locale"
          :active="currentLocale === locale"
          @click="changeLanguage(locale)"
        >
          <VListItemTitle>{{ label }}</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

// i18n setup
const { locale } = useI18n();

// State
const showMenu = ref<boolean>(false);
const menuActivator = ref();

const supportedLocales = {
  "en-US": "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "ja-JP": "日本語"
} as const;

// Computed
const currentLocale = computed(() => locale.value);

// Methods
const toggleMenu = (): void => {
  showMenu.value = !showMenu.value;
};

const changeLanguage = (newLocale: string): void => {
  locale.value = newLocale;
  showMenu.value = false;
  // Update document language attribute
  document.documentElement.lang = newLocale;
  // Store preference in localStorage
  localStorage.setItem('preferred-language', newLocale);
};

// Lifecycle
onMounted(() => {
  // Load saved language preference
  const savedLocale = localStorage.getItem('preferred-language');
  if (savedLocale && savedLocale in supportedLocales) {
    changeLanguage(savedLocale);
  }
});
</script>

<style scoped>
.language-switcher {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 999;
}
</style>