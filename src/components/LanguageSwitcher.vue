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
      :activator="$refs.menuActivator"
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

<script>
import { useI18n } from 'vue-i18n';

export default {
  name: "LanguageSwitcher",
  setup() {
    const { locale, t } = useI18n();
    
    return {
      locale,
      t
    };
  },
  data() {
    return {
      showMenu: false,
      supportedLocales: {
        "en-US": "English",
        "zh-CN": "简体中文",
        "zh-TW": "繁體中文",
        "ja-JP": "日本語"
      }
    };
  },
  computed: {
    currentLocale() {
      return this.locale;
    }
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    changeLanguage(locale) {
      this.locale = locale;
      this.showMenu = false;
      // Update document language attribute
      document.documentElement.lang = locale;
      // Store preference in localStorage
      localStorage.setItem('preferred-language', locale);
    }
  },
  mounted() {
    // Load saved language preference
    const savedLocale = localStorage.getItem('preferred-language');
    if (savedLocale && this.supportedLocales[savedLocale]) {
      this.changeLanguage(savedLocale);
    }
  }
};
</script>

<style scoped>
.language-switcher {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 999;
}
</style>
