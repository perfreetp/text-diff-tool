<script setup>
import { ref, watch, nextTick } from 'vue';
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui';
import 'highlight.js/styles/github.min.css';
import 'diff2html/bundles/css/diff2html.min.css';

const props = defineProps({
  patch: String,
  format: String,
  isDarkMode: Boolean
});

const container = ref(null);

const draw = async () => {
  if (!container.value || !props.patch) return;
  // Clear previous content
  container.value.innerHTML = '';

  const ui = new Diff2HtmlUI(container.value, props.patch, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: props.format,
    highlight: true
  });
  ui.draw();
};

// Re-draw when patch data, format, or theme changes
watch(() => [props.patch, props.format, props.isDarkMode], async () => {
  await nextTick();
  draw();
}, { immediate: true });

defineExpose({
  getElement: () => container.value
});
</script>

<template>
  <div ref="container" class="diff-container"></div>
</template>

<style scoped>
.diff-container { margin-top: 10px; }
</style>
