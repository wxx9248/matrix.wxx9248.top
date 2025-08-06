<template>
  <VChip class="chip" @click="copyToClipboard(text)">
    <code>{{ text }}</code>
  </VChip>
</template>

<script>
export default {
  name: "CopiableCode",
  props: ["text", "disableCopy"],
  methods: {
    async copyToClipboard(text) {
      try {
        if (!this.disableCopy) {
          await navigator.clipboard.writeText(text);
          this.$emit("success");
        }
      } catch (error) {
        this.$emit("error", error);
      }
    }
  }
};
</script>

<style scoped>
.chip {
  cursor: pointer;
  transition: 0.3s;
}
.chip:hover {
  backdrop-filter: brightness(50%);
}
</style>
