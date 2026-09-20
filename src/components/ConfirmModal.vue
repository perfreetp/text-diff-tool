<script setup>
import { watch, onUnmounted } from 'vue';

const props = defineProps({
  show: Boolean,
  title: { type: String, default: '请确认' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  danger: { type: Boolean, default: true }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleKeydown = (event) => {
  if (!props.show) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('cancel');
  } else if (event.key === 'Enter') {
    event.preventDefault();
    emit('confirm');
  }
};

watch(
  () => props.show,
  (visible) => {
    if (visible) window.addEventListener('keydown', handleKeydown);
    else window.removeEventListener('keydown', handleKeydown);
  }
);

onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('cancel')">{{ cancelText }}</button>
          <button class="modal-btn confirm" :class="{ danger }" @click="$emit('confirm')">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(1, 4, 9, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-dialog {
  background: var(--bg-container);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 22px 24px;
  width: 380px;
  max-width: calc(100vw - 40px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
}
.modal-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
}
.modal-message {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dim);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.modal-btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.2s;
}
.modal-btn.cancel {
  background: transparent;
  color: var(--text-main);
}
.modal-btn.cancel:hover { background: var(--bg-controls); }
.modal-btn.confirm {
  background: var(--btn-secondary);
  border-color: var(--btn-secondary);
  color: var(--btn-text);
}
.modal-btn.confirm.danger {
  background: #cf222e;
  border-color: #cf222e;
}
.modal-btn.confirm:hover { filter: brightness(1.1); }
</style>
