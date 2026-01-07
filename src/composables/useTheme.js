import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export function useTheme(initialTheme = 'auto') {
  const theme = ref(initialTheme);
  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Determine if dark mode should be active based on setting or system preference
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') return systemDarkQuery.matches;
    return theme.value === 'dark';
  });

  const applyTheme = () => {
    if (isDarkMode.value) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const label = computed(() => {
    const map = { auto: '🌓 Auto', light: '☀️ Light', dark: '🌙 Dark' };
    return map[theme.value];
  });

  const handleSystemChange = () => {
    if (theme.value === 'auto') applyTheme();
  };

  onMounted(() => {
    systemDarkQuery.addEventListener('change', handleSystemChange);
    applyTheme();
  });

  onUnmounted(() => {
    systemDarkQuery.removeEventListener('change', handleSystemChange);
  });

  watch(theme, applyTheme);

  return {
    theme,
    isDarkMode,
    label
  };
}