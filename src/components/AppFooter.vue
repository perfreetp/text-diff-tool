<template>
  <footer class="app-footer">
    <div class="links">
      <a href="https://github.com/caloskao/text-diff-tool" target="_blank" rel="noopener noreferrer">
        Source Code
      </a>
      <span class="divider">•</span>
      <a href="https://caloskao.org" target="_blank" rel="noopener noreferrer">Made by Calos</a>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
}

.links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

a {
  color: var(--text-dim);
  text-decoration: none;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

a:hover {
  color: var(--btn-secondary);
  text-decoration: underline;
}

.divider {
  color: var(--border);
}

.icon {
  font-size: 14px;
}
</style>