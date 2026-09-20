<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  result: { type: Object, required: true },
  format: { type: String, default: 'side-by-side' },
  context: { type: Number, default: 4 }
});

const container = ref(null);
const currentIndex = ref(-1);

watch(
  () => props.result,
  () => {
    currentIndex.value = props.result.groups.length ? 0 : -1;
  },
  { immediate: true }
);

const visibleItems = computed(() => {
  const rows = props.result.allRows;
  const groups = props.result.groups;
  const ctx = Number(props.context);

  if (!rows.length || ctx >= rows.length) return rows;

  const positionById = new Map(rows.map((row, index) => [row.id, index]));
  const ranges = groups.map((group) => {
    const positions = group.rows.map((id) => positionById.get(id));
    return {
      start: Math.max(0, Math.min(...positions) - ctx),
      end: Math.min(rows.length - 1, Math.max(...positions) + ctx)
    };
  }).sort((a, b) => a.start - b.start);

  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const items = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      items.push({ type: 'gap', gapId: `gap-${cursor}-${range.start}`, count: range.start - cursor });
    }
    for (let index = range.start; index <= range.end; index++) items.push(rows[index]);
    cursor = range.end + 1;
  }
  if (cursor < rows.length) {
    items.push({ type: 'gap', gapId: `gap-${cursor}-${rows.length}`, count: rows.length - cursor });
  }
  return items;
});

const diffCount = computed(() => props.result.groups.length);
const currentGroupId = computed(() => {
  const group = props.result.groups[currentIndex.value];
  return group ? group.id : null;
});

const scrollToCurrent = async () => {
  if (currentGroupId.value === null) return;
  await nextTick();
  const element = container.value?.querySelector(`[data-group="${currentGroupId.value}"]`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const goTo = (direction) => {
  if (!diffCount.value) return;
  if (currentIndex.value === -1) currentIndex.value = 0;
  else {
    currentIndex.value = (currentIndex.value + direction + diffCount.value) % diffCount.value;
  }
  scrollToCurrent();
};

const onKeydown = (event) => {
  if (!event.altKey) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    goTo(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    goTo(-1);
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

const segmentClass = (segment) => [
  'tok',
  segment.type === 'ins' ? 'tok-ins' : '',
  segment.type === 'del' ? 'tok-del' : '',
  segment.hl ? `hljs-${segment.hl}` : ''
].filter(Boolean).join(' ');

const isSideBySide = computed(() => props.format === 'side-by-side');
const rowClass = (row) => ({
  'line-change': row.type === 'change',
  'line-eq': row.type === 'equal',
  'nav-current': row.groupId !== null && row.groupId === currentGroupId
});
const groupAttr = (row) => (row.groupId !== null ? { 'data-group': row.groupId } : {});
</script>

<template>
  <div class="diff-view">
    <div class="stats-bar">
      <div class="stats">
        <span class="stat added">+{{ result.stats.added }} 新增</span>
        <span class="stat deleted">-{{ result.stats.deleted }} 删除</span>
        <span class="stat modified">~{{ result.stats.modified }} 修改</span>
      </div>
      <div class="nav-group">
        <span class="nav-position">{{ diffCount ? `${currentIndex + 1} / ${diffCount} 处差异` : '无差异' }}</span>
        <button class="nav-btn" :disabled="!diffCount" title="上一处差异 (Alt+↑)" @click="goTo(-1)">↑ 上一处</button>
        <button class="nav-btn" :disabled="!diffCount" title="下一处差异 (Alt+↓)" @click="goTo(1)">下一处 ↓</button>
      </div>
    </div>

    <div v-if="result.isEmpty" class="state-hint">请在上方输入或拖入文本以开始对比</div>
    <div v-else-if="!result.hasChanges" class="state-hint success">✓ 两侧文本完全一致</div>

    <div v-else ref="container" class="diff-scroll">
      <table v-if="isSideBySide" class="diff-table sxs">
        <colgroup><col class="ln-col"><col><col class="ln-col"><col></colgroup>
        <tbody>
          <template v-for="item in visibleItems" :key="item.gapId || item.id">
            <tr v-if="item.type === 'gap'" class="gap-row"><td colspan="4">{{ item.count }} 行未变更内容已折叠</td></tr>
            <tr v-else :class="rowClass(item)" v-bind="groupAttr(item)">
              <template v-if="item.left">
                <td class="ln">{{ item.left.lineNo }}</td>
                <td class="code">
                  <span v-for="(segment, i) in item.left.segments" :key="i" :class="segmentClass(segment)">{{ segment.text || '\u00A0' }}</span>
                </td>
              </template>
              <template v-else>
                <td class="ln empty"></td><td class="code empty"></td>
              </template>
              <template v-if="item.right">
                <td class="ln">{{ item.right.lineNo }}</td>
                <td class="code">
                  <span v-for="(segment, i) in item.right.segments" :key="i" :class="segmentClass(segment)">{{ segment.text || '\u00A0' }}</span>
                </td>
              </template>
              <template v-else>
                <td class="ln empty"></td><td class="code empty"></td>
              </template>
            </tr>
          </template>
        </tbody>
      </table>

      <table v-else class="diff-table unified">
        <colgroup><col class="ln-col"><col class="sign-col"><col></colgroup>
        <tbody>
          <template v-for="item in visibleItems" :key="item.gapId || item.id">
            <tr v-if="item.type === 'gap'" class="gap-row"><td colspan="3">{{ item.count }} 行未变更内容已折叠</td></tr>
            <tr
              v-else-if="item.type === 'equal'"
              class="line-eq"
            >
              <td class="ln">{{ item.left.lineNo }}</td>
              <td class="sign"></td>
              <td class="code">
                <span v-for="(segment, i) in item.left.segments" :key="i" :class="segmentClass(segment)">{{ segment.text || '\u00A0' }}</span>
              </td>
            </tr>
            <template v-else>
              <tr v-if="item.left" :class="rowClass(item)" v-bind="groupAttr(item)">
                <td class="ln">{{ item.left.lineNo }}</td>
                <td class="sign sign-del">-</td>
                <td class="code side-del">
                  <span v-for="(segment, i) in item.left.segments" :key="i" :class="segmentClass(segment)">{{ segment.text || '\u00A0' }}</span>
                </td>
              </tr>
              <tr v-if="item.right" :class="rowClass(item)" v-bind="groupAttr(item)">
                <td class="ln">{{ item.right.lineNo }}</td>
                <td class="sign sign-ins">+</td>
                <td class="code side-ins">
                  <span v-for="(segment, i) in item.right.segments" :key="i" :class="segmentClass(segment)">{{ segment.text || '\u00A0' }}</span>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  background: var(--bg-controls);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 10px;
}
.stats { display: flex; gap: 8px; }
.stat {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.stat.added { background: rgba(46, 160, 67, 0.15); color: #1a7f37; }
.stat.deleted { background: rgba(248, 81, 73, 0.15); color: #cf222e; }
.stat.modified { background: rgba(56, 139, 253, 0.15); color: #0969da; }
html.dark .stat.added { color: #7ee787; }
html.dark .stat.deleted { color: #ff7b72; }
html.dark .stat.modified { color: #79c0ff; }
.nav-group { display: flex; align-items: center; gap: 8px; }
.nav-position { font-size: 12px; color: var(--text-dim); }
.nav-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-main);
  cursor: pointer;
}
.nav-btn:hover:not(:disabled) { border-color: var(--btn-secondary); color: var(--btn-secondary); }
.nav-btn:disabled { opacity: 0.45; cursor: default; }
.state-hint {
  padding: 40px;
  text-align: center;
  color: var(--text-dim);
  font-size: 14px;
  border: 1px dashed var(--border);
  border-radius: 6px;
}
.state-hint.success { color: var(--btn-primary); border-color: var(--btn-primary); }
.diff-scroll { max-height: 70vh; overflow: auto; border: 1px solid var(--border); border-radius: 6px; }
.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.ln-col { width: 52px; }
.sign-col { width: 24px; }
td {
  padding: 0 10px;
  line-height: 21px;
  vertical-align: top;
  white-space: pre-wrap;
  word-break: break-all;
}
td.ln {
  text-align: right;
  color: var(--text-dim);
  user-select: none;
  opacity: 0.75;
}
td.sign { text-align: center; user-select: none; color: var(--text-dim); }
td.code { padding-left: 12px; }
.line-eq td.empty, .gap-row td { background: var(--bg-controls); }
.sxs tr.line-change td:nth-child(1),
.sxs tr.line-change td:nth-child(2) {
  background: rgba(248, 81, 73, 0.1);
}
.sxs tr.line-change td:nth-child(3),
.sxs tr.line-change td:nth-child(4) {
  background: rgba(46, 160, 67, 0.1);
}
.unified .side-del, .unified .sign-del { background: rgba(248, 81, 73, 0.1); }
.unified .sign-del { color: #cf222e; }
.unified .side-ins, .unified .sign-ins { background: rgba(46, 160, 67, 0.1); }
.unified .sign-ins { color: #1a7f37; }
html.dark .sxs tr.line-change td:nth-child(1),
html.dark .sxs tr.line-change td:nth-child(2) { background: rgba(248, 81, 73, 0.15); }
html.dark .sxs tr.line-change td:nth-child(3),
html.dark .sxs tr.line-change td:nth-child(4) { background: rgba(46, 160, 67, 0.15); }
html.dark .unified .side-del, html.dark .unified .sign-del { background: rgba(248, 81, 73, 0.15); }
html.dark .unified .sign-del { color: #ff7b72; }
html.dark .unified .side-ins, html.dark .unified .sign-ins { background: rgba(46, 160, 67, 0.15); }
html.dark .unified .sign-ins { color: #7ee787; }
.tok-del {
  color: #cf222e;
  background: rgba(248, 81, 73, 0.28);
  border-radius: 2px;
}
.tok-ins {
  color: #1a7f37;
  background: rgba(46, 160, 67, 0.28);
  border-radius: 2px;
}
html.dark .tok-del { color: #ff7b72; background: rgba(248, 81, 73, 0.35); }
html.dark .tok-ins { color: #7ee787; background: rgba(63, 185, 80, 0.35); }
tr.nav-current td {
  box-shadow: inset 3px 0 0 var(--btn-secondary);
}
tr.nav-current { outline: 1px solid rgba(31, 111, 235, 0.55); outline-offset: -1px; }
.gap-row td {
  text-align: center;
  color: var(--text-dim);
  font-size: 12px;
  padding: 4px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.hljs { background: transparent; }
</style>
