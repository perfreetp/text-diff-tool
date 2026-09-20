import { ref, computed, watch } from 'vue';

const STORAGE_KEY = 'diff_tool_workbench_v1';
const LEGACY_KEY = 'diff_tool_vue_refactored';
const UNDO_KEY = 'diff_tool_undo_buffer';

const DEFAULT_LEFT = "function hello() {\n  return 'world';\n}";
const DEFAULT_RIGHT = "function hello() {\n  console.log('debug');\n  return 'world';\n}";

const DEFAULT_TAB = {
  name: '',
  left: DEFAULT_LEFT,
  right: DEFAULT_RIGHT,
  viewMode: 'visual', // visual | raw
  format: 'side-by-side', // side-by-side | line-by-line
  context: 4,
  diffMode: 'line', // line | word | char
  ignoreCase: false,
  ignoreWhitespace: false,
  leftFileName: '',
  rightFileName: ''
};

let tabSequence = 0;
const createTabId = () => {
  tabSequence += 1;
  return `tab-${Date.now().toString(36)}-${tabSequence}`;
};

const makeTab = (overrides = {}) => ({
  id: createTabId(),
  ...DEFAULT_TAB,
  ...overrides
});

const loadTabs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        return {
          tabs: parsed.tabs.map((tab) => makeTab(tab)),
          activeTabId: parsed.activeTabId && parsed.tabs.some((t) => t.id === parsed.activeTabId)
            ? parsed.activeTabId
            : parsed.tabs[0].id
        };
      }
    }
  } catch (error) {
    console.warn('Failed to restore workbench tabs:', error);
  }

  // Migrate from the previous single-task storage version.
  try {
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const tab = makeTab({
        name: '对比 1',
        left: legacy.left ?? DEFAULT_TAB.left,
        right: legacy.right ?? DEFAULT_TAB.right,
        viewMode: legacy.activeTab === 'raw' ? 'raw' : 'visual',
        format: legacy.format ?? DEFAULT_TAB.format,
        context: legacy.context ?? DEFAULT_TAB.context
      });
      return { tabs: [tab], activeTabId: tab.id };
    }
  } catch (error) {
    console.warn('Failed to migrate legacy state:', error);
  }

  const firstTab = makeTab({ name: '对比 1' });
  return { tabs: [firstTab], activeTabId: firstTab.id };
};

export function useTabs() {
  const initial = loadTabs();
  const tabs = ref(initial.tabs);
  const activeTabId = ref(initial.activeTabId);

  const activeTab = computed(
    () => tabs.value.find((tab) => tab.id === activeTabId.value) ?? tabs.value[0]
  );

  const persist = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tabs: tabs.value, activeTabId: activeTabId.value })
    );
  };

  watch([tabs, activeTabId], persist, { deep: true });

  // Persist immediately so migrated/restored state survives a refresh
  // even before the first mutation.
  persist();

  const activateTab = (id) => {
    activeTabId.value = id;
  };

  const createNewTab = () => {
    const index = tabs.value.length + 1;
    const tab = makeTab({ name: `对比 ${index}`, left: '', right: '' });
    tabs.value.push(tab);
    activeTabId.value = tab.id;
    return tab;
  };

  const duplicateTab = (id) => {
    const source = tabs.value.find((tab) => tab.id === id);
    if (!source) return;
    const cloned = JSON.parse(JSON.stringify(source));
    delete cloned.id;
    const copy = makeTab({
      ...cloned,
      name: `${source.name || '对比'} 副本`
    });
    const index = tabs.value.findIndex((tab) => tab.id === id);
    tabs.value.splice(index + 1, 0, copy);
    activeTabId.value = copy.id;
  };

  const renameTab = (id, name) => {
    const tab = tabs.value.find((item) => item.id === id);
    if (tab) tab.name = name;
  };

  const closeTab = (id) => {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index === -1) return;
    tabs.value.splice(index, 1);
    if (tabs.value.length === 0) {
      const fresh = makeTab({ name: '对比 1' });
      tabs.value.push(fresh);
      activeTabId.value = fresh.id;
      return;
    }
    if (activeTabId.value === id) {
      activeTabId.value = tabs.value[Math.min(index, tabs.value.length - 1)].id;
    }
  };

  const tabHasContent = (id) => {
    const tab = tabs.value.find((item) => item.id === id);
    return Boolean(tab && (tab.left.trim() || tab.right.trim()));
  };

  const clearActive = () => {
    const tab = activeTab.value;
    if (!tab) return;
    localStorage.setItem(
      UNDO_KEY,
      JSON.stringify({ left: tab.left, right: tab.right })
    );
    tab.left = '';
    tab.right = '';
    tab.leftFileName = '';
    tab.rightFileName = '';
  };

  const restoreActive = () => {
    const backup = localStorage.getItem(UNDO_KEY);
    const tab = activeTab.value;
    if (!backup || !tab) return Boolean(backup);
    try {
      const content = JSON.parse(backup);
      tab.left = content.left ?? '';
      tab.right = content.right ?? '';
      localStorage.removeItem(UNDO_KEY);
      return true;
    } catch (error) {
      return Boolean(backup);
    }
  };

  const hasUndoData = () => Boolean(localStorage.getItem(UNDO_KEY));

  return {
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
  };
}
