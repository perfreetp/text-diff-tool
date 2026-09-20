<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useTabs } from './composables/useTabs';
import { useDiff } from './composables/useDiff';

import AppHeader from './components/AppHeader.vue';
import TabBar from './components/TabBar.vue';
import InputPanel from './components/InputPanel.vue';
import ControlBar from './components/ControlBar.vue';
import DiffResult from './components/DiffResult.vue';
import AppFooter from './components/AppFooter.vue';
import ConfirmModal from './components/ConfirmModal.vue';

const THEME_KEY = 'diff_tool_theme';
const savedTheme = localStorage.getItem(THEME_KEY) || 'auto';

const {
  tabs,
  activeTabId,
  activeTab,
  activateTab,
  createNewTab,
  duplicateTab,
  renameTab,
  closeTab,
  tabHasContent,
  clearActive,
  restoreActive,
  hasUndoData
} = useTabs();

const { patch, tokenParts, stats } = useDiff(activeTab);
const { isDarkMode, theme } = useTheme(savedTheme);
watch(theme, (value) => localStorage.setItem(THEME_KEY, value));

// --- Header actions (scoped to the active tab) ---
const undoAvailable = ref(hasUndoData());

const handleClear = () => {
  clearActive();
  undoAvailable.value = true;
};

const handleRestore = () => {
  restoreActive();
  undoAvailable.value = false;
};

const isClearable = computed(() => {
  const tab = activeTab.value;
  return Boolean(tab && (tab.left?.length || tab.right?.length));
});

// --- Tab close with confirmation for non-empty tabs ---
const confirmState = ref({
  show: false,
  title: '',
  message: '',
  confirmText: '关闭',
  pendingTabId: null
});

const requestCloseTab = (id) => {
  if (tabHasContent(id)) {
    const tab = tabs.value.find((item) => item.id === id);
    confirmState.value = {
      show: true,
      title: '关闭标签页',
      message: `「${tab?.name || '未命名对比'}」中还有未保存的文本内容，确定要关闭吗？`,
      confirmText: '确认关闭',
      pendingTabId: id
    };
  } else {
    closeTab(id);
  }
};

const confirmClose = () => {
  if (confirmState.value.pendingTabId) {
    closeTab(confirmState.value.pendingTabId);
  }
  confirmState.value.show = false;
  confirmState.value.pendingTabId = null;
};

const cancelClose = () => {
  confirmState.value.show = false;
  confirmState.value.pendingTabId = null;
};

// --- Inputs ---
const patchField = (fieldPatch) => {
  Object.assign(activeTab.value, fieldPatch);
};

const handleLoadFile = ({ side, name }) => {
  activeTab.value[`${side}FileName`] = name;
};

onMounted(() => {
  undoAvailable.value = hasUndoData();
});
</script>

<template>
  <div class="page-wrapper">
    <div class="container">

      <AppHeader
        :current-theme="theme"
        :has-undo="undoAvailable"
        :is-clearable="isClearable"
        @set-theme="(value) => (theme = value)"
        @clear-content="handleClear"
        @restore-content="handleRestore"
      />

      <TabBar
        :tabs="tabs"
        :active-tab-id="activeTabId"
        @activate="activateTab"
        @new="createNewTab"
        @rename="renameTab"
        @duplicate="duplicateTab"
        @request-close="requestCloseTab"
      />

      <template v-if="activeTab">
        <InputPanel
          :left="activeTab.left"
          :right="activeTab.right"
          :left-file-name="activeTab.leftFileName"
          :right-file-name="activeTab.rightFileName"
          @update:left="activeTab.left = $event"
          @update:right="activeTab.right = $event"
          @load-file="handleLoadFile"
        />

        <ControlBar :tab="activeTab" @patch-field="patchField" />

        <DiffResult
          :key="activeTab.id"
          :tab="activeTab"
          :patch="patch"
          :token-parts="tokenParts"
          :stats="stats"
          :is-dark-mode="isDarkMode"
        />
      </template>

      <AppFooter />

    </div>

    <ConfirmModal
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      @confirm="confirmClose"
      @cancel="cancelClose"
    />
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
