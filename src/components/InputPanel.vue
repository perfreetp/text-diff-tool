<script setup>
const left = defineModel('left');
const right = defineModel('right');
</script>

<template>
  <div class="inputs">
    <textarea v-model="left" placeholder="Paste Original Text..."></textarea>
    <textarea v-model="right" placeholder="Paste Modified Text..."></textarea>
  </div>
</template>

<style scoped>
.inputs { display: flex; gap: 10px; margin-bottom: 15px; }
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
</style>