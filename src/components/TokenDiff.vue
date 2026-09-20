<script setup>
import { computed, ref, onBeforeUpdate } from 'vue';

const props = defineProps({
  parts: { type: Array, required: true },
  diffMode: { type: String, default: 'word' }
});

// Groups consecutive change parts so each group is one navigation target.
const groups = computed(() => {
  const result = [];
  let current = null;
  props.parts.forEach((part, index) => {
    if (part.type === 'common') {
      current = null;
      result.push({ key: `c-${index}`, type: 'common', parts: [part] });
    } else {
      if (!current) {
        current = { key: `g-${index}`, type: 'change', parts: [] };
        result.push(current);
      }
      current.parts.push(part);
    }
  });
  return result;
});

const changeElements = ref([]);

onBeforeUpdate(() => {
  changeElements.value = [];
});

const setChangeRef = (element, group) => {
  if (element && group.type === 'change') changeElements.value.push(element);
};

defineExpose({
  getChangeElements: () => changeElements.value
});
</script>

<template>
  <div class="token-diff" :class="diffMode">
    <div class="token-row">
      <span
        v-for="(group, index) in groups"
        :key="group.key"
        :ref="(el) => setChangeRef(el, group)"
        class="token-group"
        :class="{ change: group.type === 'change' }"
      >
        <template v-if="group.type === 'common'">{{ group.parts[0].left ?? group.parts[0].right }}</template>
        <template v-else>
          <span
            v-for="(part, partIndex) in group.parts"
            :key="partIndex"
            class="token"
            :class="part.type"
          >{{ part.type === 'del' ? part.left : part.right }}</span>
        </template>
      </span>
    </div>
  </div>
</template>

<style scoped>
.token-diff {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  overflow: hidden;
}
.token-row {
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-main);
}
.token.del {
  background: rgba(248, 81, 73, 0.25);
  color: #cf222e;
  border-radius: 3px;
}
.token.ins {
  background: rgba(46, 160, 67, 0.25);
  color: #1a7f37;
  border-radius: 3px;
}
.token-diff.char .token { border-radius: 0; }
html.dark .token.del { color: #ff7b72; background: rgba(248, 81, 73, 0.28); }
html.dark .token.ins { color: #7ee787; background: rgba(63, 185, 80, 0.28); }
</style>
