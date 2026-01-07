<script setup>
import { reactive, computed, watch, ref, onMounted } from 'vue';
import * as Diff from 'diff';
import { useTheme } from './composables/useTheme';

import AppHeader from './components/AppHeader.vue';
import InputPanel from './components/InputPanel.vue';
import ControlBar from './components/ControlBar.vue';
import VisualDiff from './components/VisualDiff.vue';
import RawDiff from './components/RawDiff.vue';
import AppFooter from './components/AppFooter.vue';

// --- State Management ---
const STORAGE_KEY = 'diff_tool_vue_refactored';
const UNDO_KEY = 'diff_tool_undo_buffer';

const defaultState = {
  left: "function hello() {\n  return 'world';\n}",
  right: "function hello() {\n  console.log('debug');\n  return 'world';\n}",
  format: 'side-by-side',
  context: 4,
  activeTab: 'visual',
  theme: 'auto'
};

const saved = localStorage.getItem(STORAGE_KEY);
const loadedState = saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;

const state = reactive(loadedState);

// --- Undo/Clear Logic ---
const hasUndoData = ref(false);

const checkUndoStatus = () => {
  hasUndoData.value = !!localStorage.getItem(UNDO_KEY);
};

// Action: Backup -> Clear
const clearAll = () => {
  const backup = { left: state.left, right: state.right };
  localStorage.setItem(UNDO_KEY, JSON.stringify(backup));
  
  state.left = '';
  state.right = '';
  
  checkUndoStatus();
};

// Action: Restore -> Clear Backup
const restoreContent = () => {
  const savedBackup = localStorage.getItem(UNDO_KEY);
  if (savedBackup) {
    const backup = JSON.parse(savedBackup);
    state.left = backup.left || '';
    state.right = backup.right || '';
    
    localStorage.removeItem(UNDO_KEY);
    checkUndoStatus();
  }
};

// Computed: Check if inputs have content (strictly boolean)
const isClearable = computed(() => {
  const leftLen = state.left?.length || 0;
  const rightLen = state.right?.length || 0;
  return leftLen > 0 || rightLen > 0;
});

// --- Theme Logic ---
const { cycleTheme, isDarkMode, theme } = useTheme(state.theme);
watch(theme, (newVal) => state.theme = newVal);

// --- Diff Logic ---
const patch = computed(() => {
  return Diff.createTwoFilesPatch(
    'Original', 'Modified',
    state.left, state.right,
    '', '',
    { context: Number(state.context) }
  );
});

// --- Persistence ---
watch(state, (newVal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
}, { deep: true });

onMounted(() => {
  checkUndoStatus();
});
</script>

<template>
  <div class="page-wrapper">
    <div class="container">
      
      <AppHeader 
        :current-theme="theme" 
        :has-undo="hasUndoData"
        :is-clearable="isClearable"
        @set-theme="(val) => theme = val" 
        @clear-content="clearAll"
        @restore-content="restoreContent"
      />

      <InputPanel 
        v-model:left="state.left" 
        v-model:right="state.right" 
      />

      <ControlBar 
        v-model:activeTab="state.activeTab"
        v-model:format="state.format"
        v-model:context="state.context"
      />

      <VisualDiff 
        v-if="state.activeTab === 'visual'"
        :patch="patch" 
        :format="state.format"
        :isDarkMode="isDarkMode"
      />

      <RawDiff 
        v-else
        :patch="patch"
      />

      <AppFooter />

    </div>
  </div>
</template>

<style scoped>
.page-wrapper { padding: 20px; }
.container { 
  max-width: 1200px; 
  margin: 0 auto; 
  background: var(--bg-container); 
  padding: 20px; 
  border-radius: 8px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.12); 
  border: 1px solid var(--border); 
}
</style>