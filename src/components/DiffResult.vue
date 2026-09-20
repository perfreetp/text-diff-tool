<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import VisualDiff from './VisualDiff.vue';
import TokenDiff from './TokenDiff.vue';
import RawDiff from './RawDiff.vue';
import { exportHtmlReport } from '../utils/exportReport.js';

const props = defineProps({
  tab: { type: Object, required: true },
  patch: { type: String, required: true },
  tokenParts: { type: Array, default: () => [] },
  stats: { type: Object, required: true },
  isDarkMode: { type: Boolean, default: false }
});

const visualDiffRef = ref(null);
const tokenDiffRef = ref(null);
const currentIndex = ref(-1);
const changeElements = ref([]);


// --- Nav target collection for diff2html DOM ---
// diff2html marks changed cells with d2h-del / d2h-ins classes on <td>.
const isChangedRow = (row) =>
  row.querySelector(':scope > td.d2h-del, :scope > td.d2h-ins') !== null;

const collectLineTargets = (root) => {
  const tables = Array.from(root.querySelectorAll('table.d2h-diff-table'));
  if (tables.length >= 2) {
    // Side-by-side: one table per pane, rows align by index across panes.
    const leftRows = Array.from(tables[0].querySelectorAll('tbody > tr'));
    const rightRows = Array.from(tables[1].querySelectorAll('tbody > tr'));
    const groups = [];
    let current = null;
    leftRows.forEach((leftRow, index) => {
      const rightRow = rightRows[index] ?? null;
      const changed = isChangedRow(leftRow) || (rightRow && isChangedRow(rightRow));
      if (changed) {
        if (current && current.end + 1 === index) {
          current.elements.push(leftRow, rightRow);
          current.end = index;
        } else {
          current = { end: index, elements: [leftRow, rightRow] };
          groups.push(current.elements);
        }
      } else {
        current = null;
      }
    });
    return groups.map((group) => group.filter(Boolean));
  }

  // Line-by-line: group adjacent changed rows into one target.
  const rows = Array.from(root.querySelectorAll('table.d2h-diff-table tbody > tr'))
    .filter(isChangedRow);
  const groups = [];
  let current = [];
  for (const row of rows) {
    const previous = current.length ? current[current.length - 1] : null;
    if (previous && previous.nextElementSibling === row) {
      current.push(row);
    } else {
      if (current.length) groups.push(current);
      current = [row];
    }
  }
  if (current.length) groups.push(current);
  return groups;
};

const collectTargets = () => {
  changeElements.value.forEach((group) => {
    group.forEach((el) => el.classList.remove('nav-active'));
  });

  if (props.tab.viewMode === 'raw') {
    changeElements.value = [];
  } else if (props.tab.diffMode === 'line') {
    const root = visualDiffRef.value?.getElement();
    changeElements.value = root ? collectLineTargets(root) : [];
  } else {
    changeElements.value = (tokenDiffRef.value?.getChangeElements() ?? []).map((el) => [el]);
  }

  if (currentIndex.value >= changeElements.value.length) {
    currentIndex.value = changeElements.value.length ? changeElements.value.length - 1 : -1;
  }
  applyActiveClass();
};

const applyActiveClass = () => {
  changeElements.value.forEach((group, index) => {
    group.forEach((el) => el.classList.toggle('nav-active', index === currentIndex.value));
  });
};

const scrollToCurrent = () => {
  const group = changeElements.value[currentIndex.value];
  if (!group || !group[0]) return;
  group[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const goNext = () => {
  if (!changeElements.value.length) return;
  currentIndex.value = currentIndex.value >= changeElements.value.length - 1
    ? 0
    : currentIndex.value + 1;
  applyActiveClass();
  scrollToCurrent();
};

const goPrev = () => {
  if (!changeElements.value.length) return;
  currentIndex.value = currentIndex.value <= 0
    ? changeElements.value.length - 1
    : currentIndex.value - 1;
  applyActiveClass();
  scrollToCurrent();
};

const handleKeydown = (event) => {
  if (!event.altKey) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault();
    goNext();
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault();
    goPrev();
  }
};

// Re-collect after every redraw / option change. diff2html clears and redraws
// synchronously inside its own watcher, so retry briefly until the DOM lands.
let collectTimer = null;
const scheduleCollect = (attempt = 0) => {
  clearTimeout(collectTimer);
  collectTimer = setTimeout(() => {
    collectTargets();
    if (
      props.tab.viewMode === 'visual' &&
      props.tab.diffMode === 'line' &&
      !changeElements.value.length &&
      props.stats.changed &&
      attempt < 6
    ) {
      scheduleCollect(attempt + 1);
    }
  }, attempt === 0 ? 0 : 30);
};

watch(
  () => [props.patch, props.tab.format, props.tab.diffMode, props.tab.viewMode, props.isDarkMode, props.tokenParts, props.stats.changed],
  () => {
    currentIndex.value = -1;
    nextTick(() => scheduleCollect(0));
  },
  { immediate: true }
);

onUnmounted(() => clearTimeout(collectTimer));

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

const exportReport = () => {
  exportHtmlReport({
    tabName: props.tab.name,
    patch: props.patch,
    format: props.tab.format,
    diffMode: props.tab.diffMode,
    tokenParts: props.tokenParts,
    stats: props.stats,
    options: {
      ignoreCase: props.tab.ignoreCase,
      ignoreWhitespace: props.tab.ignoreWhitespace
    },
    leftFileName: props.tab.leftFileName,
    rightFileName: props.tab.rightFileName
  });
};

const navLabel = () => {
  if (!changeElements.value.length) return '0 / 0';
  return `${currentIndex.value < 0 ? 0 : currentIndex.value + 1} / ${changeElements.value.length}`;
};
</script>

<template>
  <div class="diff-result">
    <div class="result-toolbar">
      <div v-if="!stats.changed" class="identical-hint">
        ✅ 两侧内容一致
      </div>
      <div v-else class="stats">
        <span class="stat add">+{{ stats.additions }} 新增</span>
        <span class="stat del">-{{ stats.deletions }} 删除</span>
        <span class="stat mod">~{{ stats.modifications }} 修改</span>
      </div>

      <div class="toolbar-right">
        <div v-if="tab.viewMode === 'visual'" class="nav-group" :class="{ disabled: !changeElements.length }">
          <button class="nav-btn" :disabled="!changeElements.length" title="上一处差异 (Alt+↑)" @click="goPrev">
            ↑ 上一处
          </button>
          <span class="nav-position">{{ navLabel() }}</span>
          <button class="nav-btn" :disabled="!changeElements.length" title="下一处差异 (Alt+↓)" @click="goNext">
            下一处 ↓
          </button>
        </div>
        <span v-else class="raw-note">Raw Patch 视图暂不支持差异导航</span>
        <button class="export-btn" title="将当前对比结果导出为 HTML 报告" @click="exportReport">
          ⬇ 导出 HTML 报告
        </button>
      </div>
    </div>

    <VisualDiff
      v-if="tab.viewMode === 'visual' && tab.diffMode === 'line'"
      ref="visualDiffRef"
      :patch="patch"
      :format="tab.format"
      :is-dark-mode="isDarkMode"
    />
    <TokenDiff
      v-else-if="tab.viewMode === 'visual'"
      ref="tokenDiffRef"
      :parts="tokenParts"
      :diff-mode="tab.diffMode"
    />
    <RawDiff v-else :patch="patch" />
  </div>
</template>

<style scoped>
.diff-result { margin-top: 5px; }
.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--bg-controls);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
}
.stats { display: flex; gap: 8px; align-items: center; font-size: 13px; }
.identical-hint { color: var(--btn-primary); font-weight: 600; }
.stat {
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
}
.stat.add { background: rgba(46, 160, 67, 0.15); color: #1a7f37; }
.stat.del { background: rgba(248, 81, 73, 0.15); color: #cf222e; }
.stat.mod { background: rgba(217, 142, 8, 0.15); color: #9a6700; }
html.dark .stat.add { color: #7ee787; }
html.dark .stat.del { color: #ff7b72; }
html.dark .stat.mod { color: #e3b341; }
.toolbar-right { display: flex; align-items: center; gap: 12px; }
.nav-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-group.disabled { opacity: 0.55; }
.nav-btn, .export-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.nav-btn:not(:disabled):hover, .export-btn:hover {
  border-color: var(--btn-secondary);
  color: var(--btn-secondary);
  background: rgba(9, 105, 218, 0.08);
}
.nav-btn:disabled { cursor: default; }
.nav-position { font-size: 12px; color: var(--text-dim); min-width: 42px; text-align: center; }
.raw-note { font-size: 12px; color: var(--text-dim); }
.export-btn {
  border-color: var(--btn-secondary);
  color: var(--btn-secondary);
  font-weight: 600;
}
</style>
