<script setup>
import { ref } from 'vue';

const props = defineProps({
  patch: String
});

const copySuccess = ref(false);

const copyRaw = () => {
  if (!props.patch) return;
  
  navigator.clipboard.writeText(props.patch).then(() => {
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  });
};
</script>

<template>
  <div class="raw-container">
    <div class="copy-area">
      <span class="hint">Includes headers, line numbers (@@), and markers (+/-)</span>
      
      <div class="copy-actions">
        <span class="success-msg" :class="{ show: copySuccess }">Copied!</span>
        <button class="secondary" @click="copyRaw">Copy Raw</button>
      </div>
    </div>
    
    <textarea readonly :value="patch" class="raw-output"></textarea>
  </div>
</template>

<style scoped>
.raw-container {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 15px;
}
.copy-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.hint { font-size: 13px; color: var(--text-dim); }
.copy-actions { display: flex; align-items: center; gap: 10px; }
.success-msg {
  color: var(--btn-primary);
  font-weight: bold;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s;
}
.success-msg.show { opacity: 1; }
.raw-output {
  width: 100%;
  height: 300px;
  background: #1f2328;
  color: #e6edf3;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid var(--border);
  box-sizing: border-box;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 13px;
  white-space: pre;
  overflow: auto;
}
button {
  padding: 8px 16px;
  background: var(--btn-primary);
  color: var(--btn-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
button.secondary { background: var(--btn-secondary); }
button:hover { filter: brightness(1.1); }
</style>