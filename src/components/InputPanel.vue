<script setup>
import { ref } from 'vue';

defineProps({
  left: { type: String, required: true },
  right: { type: String, required: true },
  leftFileName: { type: String, default: '' },
  rightFileName: { type: String, default: '' }
});

const emit = defineEmits(['update:left', 'update:right', 'load-file']);

const dragSide = ref('');
const readingSide = ref('');

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const handleFiles = async (files, side) => {
  const file = Array.from(files).find((item) => item.type.startsWith('text/') || item.size < 1024 * 1024 * 5);
  if (!file) return;
  readingSide.value = side;
  try {
    const content = await readFile(file);
    emit('update:' + side, content);
    emit('load-file', { side, name: file.name });
  } finally {
    readingSide.value = '';
    dragSide.value = '';
  }
};

const onDrop = (event, side) => {
  event.preventDefault();
  if (event.dataTransfer.files.length > 0) {
    handleFiles(event.dataTransfer.files, side);
  } else {
    const text = event.dataTransfer.getData('text/plain');
    if (text) emit('update:' + side, text);
    dragSide.value = '';
  }
};

const onDragOver = (event, side) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dragSide.value = side;
};

const onDragLeave = (side) => {
  if (dragSide.value === side) dragSide.value = '';
};

const onLabelClick = (side) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = () => {
    if (input.files?.length) handleFiles(input.files, side);
  };
  input.click();
};
</script>

<template>
  <div class="inputs">
    <div
      class="drop-zone"
      :class="{ dragging: dragSide === 'left', reading: readingSide === 'left' }"
      @drop="onDrop($event, 'left')"
      @dragover="onDragOver($event, 'left')"
      @dragleave="onDragLeave('left')"
    >
      <div class="drop-hint">
        <span v-if="leftFileName" class="file-name" :title="leftFileName">📄 {{ leftFileName }}</span>
        <span v-else class="file-label" @click="onLabelClick('left')">Original（点击或拖入文件）</span>
      </div>
      <textarea
        :value="left"
        placeholder="粘贴原始文本，或直接把文本文件拖到这里..."
        @input="emit('update:left', $event.target.value)"
      ></textarea>
      <div v-if="dragSide === 'left'" class="drop-overlay">松开以加载文件</div>
    </div>

    <div
      class="drop-zone"
      :class="{ dragging: dragSide === 'right', reading: readingSide === 'right' }"
      @drop="onDrop($event, 'right')"
      @dragover="onDragOver($event, 'right')"
      @dragleave="onDragLeave('right')"
    >
      <div class="drop-hint">
        <span v-if="rightFileName" class="file-name" :title="rightFileName">📄 {{ rightFileName }}</span>
        <span v-else class="file-label" @click="onLabelClick('right')">Modified（点击或拖入文件）</span>
      </div>
      <textarea
        :value="right"
        placeholder="粘贴修改后文本，或直接把文本文件拖到这里..."
        @input="emit('update:right', $event.target.value)"
      ></textarea>
      <div v-if="dragSide === 'right'" class="drop-overlay">松开以加载文件</div>
    </div>
  </div>
</template>

<style scoped>
.inputs { display: flex; gap: 10px; margin-bottom: 15px; }
.drop-zone {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.drop-hint {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--text-dim);
}
.file-label {
  cursor: pointer;
}
.file-label:hover { color: var(--btn-secondary); text-decoration: underline; }
.file-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--btn-secondary);
}
textarea {
  flex: 1;
  height: 150px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: monospace;
  background: var(--bg-input);
  color: var(--text-main);
  resize: vertical;
}
textarea:focus { outline: 2px solid var(--btn-secondary); border-color: transparent; }
.drop-zone.dragging textarea {
  border-color: var(--btn-secondary);
  outline: 2px dashed var(--btn-secondary);
  outline-offset: 2px;
}
.drop-overlay {
  position: absolute;
  inset: 22px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--btn-secondary) 12%, transparent);
  border: 2px dashed var(--btn-secondary);
  border-radius: 6px;
  color: var(--btn-secondary);
  font-weight: 600;
  font-size: 14px;
  pointer-events: none;
}
</style>
