<!-- src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
  import { theme, type Theme } from '$lib/stores/theme';
  import { Moon, Sun } from '@lucide/svelte';
  import { Fab } from 'konsta/svelte';
  
  let currentTheme: Theme = 'dark';
  const unsubscribe = theme.subscribe((value: Theme) => {
    currentTheme = value;
  });

  // Cleanup subscription on destroy
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>


<Fab
  iconOnly
  class="fixed right-1/2 -translate-x-1/2 bottom-safe-4 z-20"
  onclick={() => theme.toggle()}
  aria-label="Toggle theme"
>
  {#if currentTheme === 'dark'}
    <Sun size={24} />
  {:else}
    <Moon size={24} />
  {/if}
</Fab>

