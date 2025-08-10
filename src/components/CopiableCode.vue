<template>
  <VChip class="chip" @click="copyToClipboard(text)">
    <code>{{ text }}</code>
  </VChip>
</template>

<script setup lang="ts">
interface Props {
  text: string;
  disableCopy?: boolean;
}

interface Emits {
  (e: 'success'): void;
  (e: 'error', error: Error): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (!props.disableCopy) {
      await navigator.clipboard.writeText(text);
      emit('success');
    }
  } catch (error) {
    emit('error', error as Error);
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