<script setup>
import { computed, watch, ref } from 'vue';
import { useTheme } from './composables/useTheme';
import { useWorkbench } from './composables/useWorkbench';
import { computeDiff, buildUnifiedPatch } from './composables/useDiff';
import { downloadHtmlReport } from './utils/exportReport';

import AppHeader from './components/AppHeader.vue';
import TabBar from './components/TabBar.vue';
import InputPanel from './components/InputPanel.vue';
import ControlBar from './components/ControlBar.vue';
import DiffView from './components/DiffView.vue';
import RawDiff from './components/RawDiff.vue';
import AppFooter from './components/AppFooter.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';

const {
  state,
  activeTab,
  newTab,
  renameTab,
  duplicateTab,
  closeTab,
  tabHasContent,
  hasUndoData,
  checkUndoStatus,
  clearActive,
  restoreActive
} = useWorkbench();

const { isDarkMode, theme } = useTheme(state.theme);
watch(theme, (value) => {
  state.theme = value;
});

const diffResult = computed(() => {
  const tab = activeTab.value;
  return computeDiff({
    left: tab.left,
    right: tab.right,
    mode: tab.diffMode,
    ignoreCase: tab.ignoreCase,
    ignoreWhitespace: tab.ignoreWhitespace
  });
});

const rawPatch = computed(() => buildUnifiedPatch(diffResult.value, Number(activeTab.value.context)));

const isClearable = computed(() =>
  Boolean(activeTab.value.left.trim() || activeTab.value.right.trim())
);

const closeConfirm = ref({ show: false, tabId: null });

const requestCloseTab = (id) => {
  if (state.tabs.length === 1) return;
  if (tabHasContent(id)) {
    closeConfirm.value = { show: true, tabId: id };
  } else {
    closeTab(id);
  }
};

const confirmClose = () => {
  const { tabId } = closeConfirm.value;
  closeConfirm.value = { show: false, tabId: null };
  if (tabId) closeTab(tabId);
};

const exportReport = () => {
  downloadHtmlReport({
    tab: activeTab.value,
    result: diffResult.value,
    isDark: isDarkMode.value
  });
};

const selectTab = (id) => {
  state.activeId = id;
};
</script>

<template>
  <div class="page-wrapper">
    <div class="container">

      <AppHeader
        :current-theme="theme"
        :has-undo="hasUndoData"
        :is-clearable="isClearable"
        @set-theme="(value) => (theme = value)"
        @clear-content="clearActive"
        @restore-content="restoreActive"
      />

      <TabBar
        :tabs="state.tabs"
        :active-id="state.activeId"
        :has-content="tabHasContent"
        @select="selectTab"
        @new="newTab()"
        @rename="renameTab"
        @duplicate="duplicateTab"
        @request-close="requestCloseTab"
      />

      <InputPanel
        :key="`input-${state.activeId}`"
        v-model:left="activeTab.left"
        v-model:right="activeTab.right"
      />

      <ControlBar
        v-model:active-view="activeTab.activeView"
        v-model:format="activeTab.format"
        v-model:context="activeTab.context"
        v-model:ignore-case="activeTab.ignoreCase"
        v-model:ignore-whitespace="activeTab.ignoreWhitespace"
        v-model:diff-mode="activeTab.diffMode"
        @export="exportReport"
      />

      <DiffView
        v-if="activeTab.activeView === 'visual'"
        :key="`diff-${state.activeId}`"
        :result="diffResult"
        :format="activeTab.format"
        :context="Number(activeTab.context)"
      />

      <RawDiff
        v-else
        :patch="rawPatch"
      />

      <AppFooter />

    </div>

    <ConfirmDialog
      :show="closeConfirm.show"
      title="关闭标签页"
      message="该标签页包含未清空的文本内容，关闭后内容将无法在本页恢复。确定要关闭吗？"
      @confirm="confirmClose"
      @cancel="closeConfirm = { show: false, tabId: null }"
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
