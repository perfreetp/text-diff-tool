<script setup>
defineProps({
  currentTheme: {
    type: String,
    required: true
  },
  hasUndo: {
    type: Boolean,
    default: false
  },
  isClearable: {
    type: Boolean,
    default: false
  }
});

defineEmits(['set-theme', 'clear-content', 'restore-content']);
</script>

<template>
  <div class="header">
    <h2>Text Diff Tool</h2>
    
    <div class="right-section">
      <button 
        v-if="hasUndo"
        class="undo-btn" 
        @click="$emit('restore-content')" 
        title="Undo Clear">
        ↩️ Undo
      </button>

      <button 
        class="clear-btn" 
        :class="{ disabled: !isClearable }"
        :disabled="!isClearable"
        @click="$emit('clear-content')" 
        title="Clear All Text">
        🗑️ Clear
      </button>

      <div class="theme-group">
        <button 
          :class="{ active: currentTheme === 'auto' }" 
          @click="$emit('set-theme', 'auto')"
          title="Follow System">
          🌓 Auto
        </button>
        <button 
          :class="{ active: currentTheme === 'light' }" 
          @click="$emit('set-theme', 'light')"
          title="Light Mode">
          ☀️ Light
        </button>
        <button 
          :class="{ active: currentTheme === 'dark' }" 
          @click="$emit('set-theme', 'dark')"
          title="Dark Mode">
          🌙 Dark
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Shared styles for action buttons */
.undo-btn, .clear-btn {
  background: transparent;
  border: 1px solid var(--border);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Undo Button specific styles */
.undo-btn {
  color: var(--btn-secondary);
  border-color: var(--btn-secondary);
}
.undo-btn:hover {
  background: rgba(9, 105, 218, 0.1);
}

/* Clear Button specific styles */
.clear-btn {
  color: var(--text-dim);
}
.clear-btn:not(:disabled):hover {
  background: rgba(248, 81, 73, 0.1);
  color: #cf222e;
  border-color: rgba(248, 81, 73, 0.5);
}
.clear-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: var(--border);
  color: var(--text-dim);
}

/* Theme Group styles */
.theme-group {
  display: flex;
  align-items: center;
}
.theme-group button {
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}
.theme-group button:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
.theme-group button:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
.theme-group button:not(:last-child) { border-right: none; }
.theme-group button:hover:not(.active) { background: var(--bg-controls); }
.theme-group button.active { background: var(--btn-primary); color: var(--btn-text); border-color: var(--btn-primary); z-index: 1; }
</style>