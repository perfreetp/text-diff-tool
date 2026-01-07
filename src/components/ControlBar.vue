<script setup>
const activeTab = defineModel('activeTab');
const format = defineModel('format');
const context = defineModel('context');
</script>

<template>
  <div class="controls">
    <div class="tabs">
      <span 
        class="tab-btn" 
        :class="{ active: activeTab === 'visual' }" 
        @click="activeTab = 'visual'">
        Visual View
      </span>
      <span 
        class="tab-btn" 
        :class="{ active: activeTab === 'raw' }" 
        @click="activeTab = 'raw'">
        Raw Patch
      </span>
    </div>

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
.tab-btn {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 10px;
  user-select: none;
  font-size: 14px;
  color: var(--text-dim);
}
.tab-btn:hover { background: rgba(0,0,0,0.05); }
.tab-btn.active {
  background: var(--bg-input);
  color: var(--text-main);
  font-weight: 600;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
</style>