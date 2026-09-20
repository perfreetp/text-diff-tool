<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  tabs: { type: Array, required: true },
  activeId: { type: String, required: true },
  hasContent: { type: Function, required: true }
});

const emit = defineEmits([
  'select',
  'new',
  'rename',
  'duplicate',
  'request-close'
]);

const editingId = ref(null);
const editingName = ref('');
const editInput = ref(null);

const startRename = async (tab) => {
  editingId.value = tab.id;
  editingName.value = tab.name;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
};

const commitRename = () => {
  if (editingId.value) {
    emit('rename', editingId.value, editingName.value);
  }
  editingId.value = null;
};

const menu = ref({ show: false, x: 0, y: 0, tabId: null });

const openMenu = async (event, tab) => {
  event.preventDefault();
  menu.value = { show: false, x: 0, y: 0, tabId: tab.id };
  await nextTick();
  const rect = event.currentTarget.getBoundingClientRect();
  menu.value = {
    show: true,
    x: rect.left,
    y: rect.bottom + 4,
    tabId: tab.id
  };
};

const closeMenu = () => {
  menu.value.show = false;
};

const menuAction = (action) => {
  const id = menu.value.tabId;
  closeMenu();
  if (action === 'rename') {
    const tab = props.tabs.find((item) => item.id === id);
    if (tab) startRename(tab);
  } else if (action === 'duplicate') {
    emit('duplicate', id);
  } else if (action === 'close') {
    emit('request-close', id);
  }
};
</script>

<template>
  <div class="tab-bar">
    <div class="tab-list">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="work-tab"
        :class="{ active: tab.id === activeId, dirty: hasContent(tab.id) }"
        @click="emit('select', tab.id)"
        @dblclick="startRename(tab)"
        @contextmenu="openMenu($event, tab)"
      >
        <input
          v-if="editingId === tab.id"
          ref="editInput"
          v-model="editingName"
          class="rename-input"
          @click.stop
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="editingId = null"
          @blur="commitRename"
        />
        <template v-else>
          <span class="tab-dot" title="包含内容"></span>
          <span class="tab-name" :title="`${tab.name}（双击或右键重命名）`">{{ tab.name }}</span>
          <button
            class="tab-close"
            :disabled="tabs.length === 1"
            title="关闭标签页"
            @click.stop="emit('request-close', tab.id)"
          >×</button>
        </template>
      </div>
    </div>
    <button class="new-tab" title="新建对比标签页" @click="emit('new')">＋ 新建</button>

    <Teleport to="body">
      <div v-if="menu.show" class="menu-overlay" @click="closeMenu" @contextmenu.prevent="closeMenu">
        <div class="context-menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }" @click.stop>
          <button @click="menuAction('rename')">重命名</button>
          <button @click="menuAction('duplicate')">复制标签页</button>
          <button @click="menuAction('close')">关闭标签页</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--border);
}
.tab-list { display: flex; gap: 4px; flex: 1; min-width: 0; overflow-x: auto; }
.work-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--text-dim);
  white-space: nowrap;
  position: relative;
  top: 1px;
}
.work-tab:hover { background: var(--bg-controls); }
.work-tab.active {
  background: var(--bg-container);
  border-color: var(--border);
  color: var(--text-main);
  font-weight: 600;
}
.tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}
.work-tab.dirty .tab-dot { background: var(--btn-secondary); }
.work-tab.active.dirty .tab-dot { background: var(--btn-primary); }
.tab-name { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
.tab-close {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 3px;
  border-radius: 4px;
}
.tab-close:hover:not(:disabled) { background: rgba(248, 81, 73, 0.25); color: #cf222e; }
.tab-close:disabled { opacity: 0.3; cursor: default; }
.rename-input {
  width: 130px;
  font-size: 13px;
  padding: 2px 6px;
  border: 1px solid var(--btn-secondary);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-main);
}
.new-tab {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 4px;
  flex-shrink: 0;
}
.new-tab:hover { border-color: var(--btn-secondary); color: var(--btn-secondary); }
.menu-overlay { position: fixed; inset: 0; z-index: 900; }
.context-menu {
  position: fixed;
  background: var(--bg-container);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  padding: 4px;
  min-width: 140px;
  z-index: 901;
}
.context-menu button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-main);
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
}
.context-menu button:hover { background: var(--bg-controls); }
</style>
