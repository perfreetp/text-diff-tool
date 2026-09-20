<script setup>
defineProps({
  tab: { type: Object, required: true }
});

const emit = defineEmits(['patch-field']);

const set = (field, value) => emit('patch-field', { [field]: value });
</script>

<template>
  <div class="controls">
    <div class="tabs">
      <span
        class="tab-btn"
        :class="{ active: tab.viewMode === 'visual' }"
        @click="set('viewMode', 'visual')">
        Visual View
      </span>
      <span
        class="tab-btn"
        :class="{ active: tab.viewMode === 'raw' }"
        @click="set('viewMode', 'raw')">
        Raw Patch
      </span>
    </div>

    <div class="option-group" role="group" title="对比粒度">
      <span class="option-label">粒度</span>
      <div class="segmented">
        <button
          :class="{ active: tab.diffMode === 'line' }"
          title="按行对比"
          @click="set('diffMode', 'line')">按行</button>
        <button
          :class="{ active: tab.diffMode === 'word' }"
          title="按词对比"
          @click="set('diffMode', 'word')">按词</button>
        <button
          :class="{ active: tab.diffMode === 'char' }"
          title="按字符对比"
          @click="set('diffMode', 'char')">按字符</button>
      </div>
    </div>

    <label class="check-option" title="比较时忽略大小写差异">
      <input
        type="checkbox"
        :checked="tab.ignoreCase"
        @change="set('ignoreCase', $event.target.checked)"
      />
      <span>忽略大小写</span>
    </label>

    <label class="check-option" title="比较时忽略空白字符差异">
      <input
        type="checkbox"
        :checked="tab.ignoreWhitespace"
        @change="set('ignoreWhitespace', $event.target.checked)"
      />
      <span>忽略空白</span>
    </label>

    <div class="spacer"></div>

    <select
      v-if="tab.diffMode === 'line'"
      :value="tab.format"
      @change="set('format', $event.target.value)">
      <option value="side-by-side">Side-by-Side</option>
      <option value="line-by-line">Line-by-Line</option>
    </select>

    <select
      :value="tab.context"
      @change="set('context', Number($event.target.value))">
      <option :value="4">Context: 4 Lines</option>
      <option :value="0">No Context (Diff Only)</option>
      <option :value="99999">Full Context</option>
    </select>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
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
}
.tabs { display: flex; align-items: center; }
.tab-btn {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 10px;
  user-select: none;
  font-size: 14px;
  color: var(--text-dim);
}
.tab-btn:hover { background: rgba(128, 128, 128, 0.18); }
.tab-btn.active {
  background: var(--bg-input);
  color: var(--text-main);
  font-weight: 600;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.option-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.option-label {
  font-size: 12px;
  color: var(--text-dim);
}
.segmented {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.segmented button {
  background: var(--bg-input);
  color: var(--text-dim);
  border: none;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
  transition: all 0.15s;
}
.segmented button:last-child { border-right: none; }
.segmented button:hover { color: var(--text-main); }
.segmented button.active {
  background: var(--btn-secondary);
  color: var(--btn-text);
  font-weight: 600;
}
.check-option {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
}
.check-option input { cursor: pointer; accent-color: var(--btn-secondary); }
</style>
