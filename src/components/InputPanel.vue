<script setup>
import { ref } from 'vue';

const left = defineModel('left');
const right = defineModel('right');

const dragSide = ref(null);
const message = ref('');
let messageTimer = null;

const showMessage = (text) => {
  message.value = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    message.value = '';
  }, 2500);
};

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsText(file);
});

const handleDrop = async (event, side) => {
  event.preventDefault();
  dragSide.value = null;

  const files = Array.from(event.dataTransfer?.files || []).filter(
    (file) => file.type.startsWith('text/') || /\.(txt|md|js|ts|json|css|html|vue|py|java|c|cpp|h|go|rs|yml|yaml|xml|sh|sql|log|diff|patch)$/i.test(file.name)
  );

  if (!files.length) {
    showMessage('仅支持读取文本文件');
    return;
  }

  try {
    const primary = await readFile(files[0]);
    if (side === 'left') {
      left.value = primary;
      if (files[1]) right.value = await readFile(files[1]);
    } else {
      right.value = primary;
      if (files[1]) left.value = await readFile(files[1]);
    }
    const paired = files.length > 1 ? `（已同时载入 ${files[1].name}）` : '';
    showMessage(`已载入 ${files[0].name}${paired}`);
  } catch {
    showMessage('文件读取失败');
  }
};

const dragOver = (event, side) => {
  event.preventDefault();
  dragSide.value = side;
};

const dragLeave = () => {
  dragSide.value = null;
};
</script>

<template>
  <div class="inputs-wrap">
    <div class="inputs">
      <div
        class="drop-zone"
        :class="{ dragging: dragSide === 'left' }"
        @dragover="dragOver($event, 'left')"
        @dragleave="dragLeave"
        @drop="handleDrop($event, 'left')"
      >
        <label class="side-label">原始文本（拖拽文件到此处）</label>
        <textarea v-model="left" placeholder="粘贴原始文本，或直接把文本文件拖到这里..."></textarea>
        <span v-if="dragSide === 'left'" class="drop-hint">松开以读取文件</span>
      </div>
      <div
        class="drop-zone"
        :class="{ dragging: dragSide === 'right' }"
        @dragover="dragOver($event, 'right')"
        @dragleave="dragLeave"
        @drop="handleDrop($event, 'right')"
      >
        <label class="side-label">修改文本（拖拽文件到此处）</label>
        <textarea v-model="right" placeholder="粘贴修改后文本，或直接把文本文件拖到这里..."></textarea>
        <span v-if="dragSide === 'right'" class="drop-hint">松开以读取文件</span>
      </div>
    </div>
    <Transition name="fade">
      <div v-if="message" class="drop-message">{{ message }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.inputs-wrap { margin-bottom: 15px; }
.inputs { display: flex; gap: 10px; }
.drop-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 6px;
}
.drop-zone.dragging { outline: 2px dashed var(--btn-secondary); outline-offset: 2px; }
.side-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 4px;
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
.drop-hint {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 12px;
  color: var(--btn-secondary);
  background: var(--bg-container);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--btn-secondary);
  pointer-events: none;
}
.drop-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--btn-secondary);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
