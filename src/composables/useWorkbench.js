import { reactive, computed, watch, ref } from 'vue';

const STORAGE_KEY = 'diff_tool_workbench_v2';
const LEGACY_KEY = 'diff_tool_vue_refactored';
const UNDO_KEY = 'diff_tool_undo_buffer';

const DEFAULT_LEFT = "function hello() {\n  return 'world';\n}";
const DEFAULT_RIGHT = "function hello() {\n  console.log('debug');\n  return 'world';\n}";

let tabSequence = 0;

function createTab(partial = {}) {
  tabSequence += 1;
  return {
    id: `tab-${Date.now()}-${tabSequence}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial.name || `对比 ${tabSequence}`,
    left: partial.left ?? '',
    right: partial.right ?? '',
    format: partial.format ?? 'side-by-side',
    context: partial.context ?? 4,
    activeView: partial.activeView ?? 'visual',
    ignoreCase: partial.ignoreCase ?? false,
    ignoreWhitespace: partial.ignoreWhitespace ?? false,
    diffMode: partial.diffMode ?? 'line'
  };
}

function sanitizeTab(raw) {
  const tab = createTab({
    name: raw.name,
    left: raw.left,
    right: raw.right,
    format: raw.format,
    context: raw.context,
    activeView: raw.activeView,
    ignoreCase: raw.ignoreCase,
    ignoreWhitespace: raw.ignoreWhitespace,
    diffMode: raw.diffMode
  });
  if (raw.id) tab.id = raw.id;
  return tab;
}

function loadInitialState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tabs) && saved.tabs.length) {
      tabSequence = saved.sequence || saved.tabs.length;
      const tabs = saved.tabs.map(sanitizeTab);
      const activeId = tabs.some((tab) => tab.id === saved.activeId) ? saved.activeId : tabs[0].id;
      return { tabs, activeId, theme: saved.theme || 'auto', sequence: tabSequence };
    }
  } catch {
    // fall through to legacy / defaults
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy && (legacy.left || legacy.right)) {
      const tab = createTab({
        name: '对比 1',
        left: legacy.left ?? '',
        right: legacy.right ?? '',
        format: legacy.format,
        context: legacy.context,
        activeView: legacy.activeTab
      });
      return { tabs: [tab], activeId: tab.id, theme: legacy.theme || 'auto', sequence: 1 };
    }
  } catch {
    // fall through to defaults
  }

  const tab = createTab({
    name: '对比 1',
    left: DEFAULT_LEFT,
    right: DEFAULT_RIGHT
  });
  return { tabs: [tab], activeId: tab.id, theme: 'auto', sequence: 1 };
}

export function useWorkbench() {
  const initial = loadInitialState();
  const state = reactive({
    tabs: initial.tabs,
    activeId: initial.activeId,
    theme: initial.theme,
    sequence: initial.sequence
  });

  const activeTab = computed(
    () => state.tabs.find((tab) => tab.id === state.activeId) || state.tabs[0]
  );

  let persistTimer = null;
  const persist = () => {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tabs: state.tabs,
        activeId: state.activeId,
        theme: state.theme,
        sequence: state.sequence
      }));
    }, 250);
  };
  watch(state, persist, { deep: true });

  const nextTabName = () => {
    state.sequence += 1;
    return `对比 ${state.sequence}`;
  };

  const newTab = (activate = true) => {
    const tab = createTab({ name: nextTabName() });
    state.tabs.push(tab);
    if (activate) state.activeId = tab.id;
    return tab;
  };

  const renameTab = (id, name) => {
    const tab = state.tabs.find((item) => item.id === id);
    if (tab) {
      const trimmed = String(name ?? '').trim();
      tab.name = trimmed || tab.name;
    }
  };

  const duplicateTab = (id) => {
    const source = state.tabs.find((item) => item.id === id);
    if (!source) return;
    const copy = createTab({
      name: `${source.name} 副本`,
      left: source.left,
      right: source.right,
      format: source.format,
      context: source.context,
      activeView: source.activeView,
      ignoreCase: source.ignoreCase,
      ignoreWhitespace: source.ignoreWhitespace,
      diffMode: source.diffMode
    });
    const index = state.tabs.findIndex((item) => item.id === id);
    state.tabs.splice(index + 1, 0, copy);
    state.activeId = copy.id;
  };

  const closeTab = (id) => {
    const index = state.tabs.findIndex((item) => item.id === id);
    if (index === -1 || state.tabs.length === 1) return;
    state.tabs.splice(index, 1);
    if (state.activeId === id) {
      state.activeId = state.tabs[Math.max(0, index - 1)].id;
    }
  };

  const tabHasContent = (id) => {
    const tab = state.tabs.find((item) => item.id === id);
    return Boolean(tab && (tab.left.trim() || tab.right.trim()));
  };

  const hasUndoData = ref(Boolean(localStorage.getItem(UNDO_KEY)));
  const checkUndoStatus = () => {
    hasUndoData.value = Boolean(localStorage.getItem(UNDO_KEY));
  };

  const clearActive = () => {
    const tab = activeTab.value;
    localStorage.setItem(UNDO_KEY, JSON.stringify({
      left: tab.left,
      right: tab.right
    }));
    tab.left = '';
    tab.right = '';
    checkUndoStatus();
  };

  const restoreActive = () => {
    try {
      const backup = JSON.parse(localStorage.getItem(UNDO_KEY));
      if (backup) {
        activeTab.value.left = backup.left || '';
        activeTab.value.right = backup.right || '';
      }
    } catch {
      // ignore corrupted backup
    }
    localStorage.removeItem(UNDO_KEY);
    checkUndoStatus();
  };

  return {
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
  };
}
