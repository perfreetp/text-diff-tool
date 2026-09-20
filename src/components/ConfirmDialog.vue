<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '' }
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="overlay" @click.self="emit('cancel')">
      <div class="dialog" role="dialog" aria-modal="true">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="actions">
          <button class="btn-cancel" @click="emit('cancel')">取消</button>
          <button class="btn-confirm" @click="emit('confirm')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(1, 4, 9, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--bg-container);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 22px;
  width: 360px;
  max-width: calc(100vw - 40px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
h3 { margin: 0 0 10px; font-size: 16px; }
p { margin: 0 0 20px; font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.actions { display: flex; justify-content: flex-end; gap: 10px; }
button {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: filter 0.2s;
}
.btn-cancel { background: var(--bg-controls); color: var(--text-main); }
.btn-confirm { background: #cf222e; border-color: #cf222e; color: #fff; }
button:hover { filter: brightness(1.1); }
</style>
