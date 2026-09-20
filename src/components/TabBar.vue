<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  tabs: { type: Array, required: true },
  activeTabId: { type: String, required: true }
});

const emit = defineEmits([
  'activate',
  'new',
  'rename',
  'duplicate',
  'request-close'
]);

const renamingId = ref('');
const renameValue = ref('');
const renameInput = ref(null);
const menuOpenId = ref('');

const startRename = async (tab) => {
  renamingId.value = tab.id;
  renameValue.value = tab.name || '';
  menuOpenId.value = '';
  await nextTick();
  const inputEl = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
  inputEl?.focus();
  inputEl?.select();
};

const commitRename = () => {
  if (renamingId.value) {
    const trimmed = renameValue.value.trim();
    emit('rename', renamingId.value, trimmed || '未命名对比');
    renamingId.value = '';
  }
};

const cancelRename = () => {
  renamingId.value = '';
};

const toggleMenu = (event, id) => {
  event.stopPropagation();
  menuOpenId.value = menuOpenId.value === id ? '' : id;
};

const closeMenu = () => {
  menuOpenId.value = '';
};

const onMiddleClick = (event, tab) => {
  if (event.button === 1) {
    event.preventDefault();
    emit('request-close', tab.id);
  }
};

onMounted(() => window.addEventListener('click', closeMenu));
onUnmounted(() => window.removeEventListener('click', closeMenu));
</script>

<template>
  <div class="tab-bar">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="work-tab"
      :class="{ active: tab.id === activeTabId }"
          @click="emit('activate', tab.id)"
          @mousedown="onMiddleClick($event, tab)"
        >
        <input
          v-if="renamingId === tab.id"
          ref="renameInput"
          v-model="renameValue"
          class="rename-input"
          @click.stop
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="cancelRename"
          @blur="commitRename"
        />
        <template v-else>
          <span class="tab-name" title="双击重命名" @dblclick.stop="startRename(tab)">
            {{ tab.name || '未命名对比' }}
          </span>
          <div class="tab-actions">
            <button
              class="tab-menu-btn"
              title="标签页操作"
              @click="toggleMenu($event, tab.id)"
            >
              ⌄
            </button>
            <button
              class="tab-close-btn"
              title="关闭标签页（中键也可关闭）"
              @click.stop="emit('request-close', tab.id)"
            >
              ×
            </button>
            <div
              v-if="menuOpenId === tab.id"
              class="tab-menu"
              @click.stop
            >
              <button @click="startRename(tab)">✏️ 重命名</button>
              <button @click="emit('duplicate', tab.id); closeMenu()">📋 复制标签页</button>
              <button class="danger" @click="emit('request-close', tab.id); closeMenu()">
                ✖ 关闭标签页
              </button>
            </div>
          </div>
        </template>
      </div>

    <button class="new-tab-btn" title="新建对比标签页" @click="emit('new')">＋</button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: stretch;
  gap: 6px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}
.work-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 14px;
  border: 1px solid var(--border);
  border-radius: 8px 8px 0 0;
  background: var(--bg-controls);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  max-width: 220px;
  transition: background 0.15s, color 0.15s;
}
.work-tab:hover { color: var(--text-main); }
.work-tab.active {
  background: var(--bg-container);
  color: var(--text-main);
  font-weight: 600;
  border-bottom-color: var(--bg-container);
}
.tab-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
}
.tab-menu-btn,
.tab-close-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
.tab-close-btn { font-size: 16px; }
.tab-menu-btn:hover,
.tab-close-btn:hover {
  background: rgba(128, 128, 128, 0.25);
}
.rename-input {
  width: 130px;
  padding: 3px 6px;
  font-size: 13px;
  border: 1px solid var(--btn-secondary);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-main);
}
.tab-menu {
  position: absolute;
  top: 24px;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  background: var(--bg-container);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}
.tab-menu button {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}
.tab-menu button:hover { background: var(--bg-controls); }
.tab-menu button.danger { color: #cf222e; }
.new-tab-btn {
  width: 30px;
  height: 30px;
  align-self: center;
  border: 1px dashed var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.new-tab-btn:hover {
  color: var(--btn-secondary);
  border-color: var(--btn-secondary);
}
</style>
