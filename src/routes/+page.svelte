<script lang="ts">
  import { onMount } from 'svelte';
  import { App, Page, Navbar, List, ListItem, BlockTitle, Popover, Toggle, Fab } from 'konsta/svelte';
  import { animations } from '$lib/animations/registry';
  import { MoreVertical } from '@lucide/svelte';
  
  const DARK_KEY = 'manim-web:dark-mode';
  let isDark = $state(false);
  let moreOpened = $state(false);
  let moreButtonEl = $state<HTMLButtonElement>();
  const title = 'Manim Studio';

  function applyDarkMode(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(DARK_KEY, dark ? '1' : '0');
    } catch (e) {}
  }

  function toggleDarkMode(e: Event) {
    const target = e?.target as HTMLInputElement;
    isDark = target?.checked ?? !isDark;
    applyDarkMode(isDark);
  }
  
  onMount(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(DARK_KEY);
    } catch (e) {
      stored = null;
    }
    isDark = stored !== null
      ? stored === '1'
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    applyDarkMode(isDark);
  });
</script>

<svelte:head>
  <title>Animations</title>
</svelte:head>

<App theme="ios" dark={isDark}>
  <Page>
    <Navbar title={title} class="sticky top-0 z-30">
    </Navbar>
            <Fab
          bind:this={moreButtonEl}
          class="fixed right-safe-4 ios:top-safe-19 material:top-safe-18 z-20 k-color-brand-red more-btn"
          onclick={() => (moreOpened = true)}
          aria-label="More options"
        >
        {#snippet icon()}
      <MoreVertical size={20} />
    {/snippet}
          
        </Fab>
      
    <Popover
      opened={moreOpened}
      target={moreButtonEl}
      onBackdropClick={() => (moreOpened = false)}
    >
      <List nested class="my-2">
        <ListItem title="Dark mode">
          {#snippet after()}
            <Toggle checked={isDark} onchange={toggleDarkMode} />
          {/snippet}
        </ListItem>
      </List>
    </Popover>

    <BlockTitle>Available Animations</BlockTitle>

    <List strong inset>
      {#each animations as animation}
        <ListItem
          link
          href={animation.path}
          title={animation.title}
          subtitle={animation.description}
          after={animation.category}
        />
      {/each}
    </List>
  </Page>
</App>

