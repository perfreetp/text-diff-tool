<script setup>
const activeView = defineModel('activeView');
const format = defineModel('format');
const context = defineModel('context');
const ignoreCase = defineModel('ignoreCase');
const ignoreWhitespace = defineModel('ignoreWhitespace');
const diffMode = defineModel('diffMode');

defineEmits(['export']);
</script>

<template>
  <div class="controls">
    <div class="tabs">
      <span
        class="tab-btn"
        :class="{ active: activeView === 'visual' }"
        @click="activeView = 'visual'">
        Visual View
      </span>
      <span
        class="tab-btn"
        :class="{ active: activeView === 'raw' }"
        @click="activeView = 'raw'">
        Raw Patch
      </span>
    </div>

    <div class="option-group">
      <label class="check">
        <input type="checkbox" v-model="ignoreCase" />
        <span>忽略大小写</span>
      </label>
      <label class="check">
        <input type="checkbox" v-model="ignoreWhitespace" />
        <span>忽略空白</span>
      </label>
    </div>

    <select v-model="diffMode" title="对比粒度">
      <option value="line">按行对比</option>
      <option value="word">按词对比</option>
      <option value="char">按字符对比</option>
    </select>

    <div class="spacer"></div>

    <select v-model="format">
      <option value="side-by-side">Side-by-Side</option>
      <option value="line-by-line">Line-by-Line</option>
    </select>

    <select v-model="context">
      <option :value="4">Context: 4 Lines</option>
      <option :value="0">No Context (Diff Only)</option>
      <option :value="99999">Full Context</option>
    </select>

    <button class="export-btn" title="导出当前对比结果为 HTML 报告" @click="$emit('export')">
      ⬇ 导出 HTML
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
  background: var(--bg-controls);
  padding: 10px;
  border-radius: 6px;
  flex-wrap: wrap;
}
.spacer { flex-grow: 1; }
select {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background-color: var(--bg-input);
  color: var(--text-main);
  cursor: pointer;
  font-size: 13px;
}
.tab-btn {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 10px;
  user-select: none;
  font-size: 14px;
  color: var(--text-dim);
}
.tab-btn:hover { background: rgba(128, 128, 128, 0.15); }
.tab-btn.active {
  background: var(--bg-input);
  color: var(--text-main);
  font-weight: 600;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.option-group {
  display: flex;
  gap: 12px;
}
.check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
}
.check input { cursor: pointer; accent-color: var(--btn-primary); }
.export-btn {
  padding: 7px 14px;
  background: var(--btn-secondary);
  color: var(--btn-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: filter 0.2s;
  white-space: nowrap;
}
.export-btn:hover { filter: brightness(1.1); }
</style>
