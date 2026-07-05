<script lang="ts">
  import { onMount, onDestroy } from 'svelte'; // Added onMount and onDestroy
  import { Share, RotateCcw, MoreVertical, RefreshCw, RotateCw } from '@lucide/svelte';
  import { 
    App, Page, Navbar, Toolbar, Button, Fab,
    Block, BlockTitle, Actions, ActionsGroup, ActionsLabel, ActionsButton,
    Popover, List, ListItem, Toggle, Preloader } from 'konsta/svelte';
  import {
    Player, Circle, Square, Triangle, Create, Transform, FadeIn, FadeOut, MathTex, 
    Indicate, Rotate, BLACK, BLUE, RED, GREEN, YELLOW, Dot, WHITE 
  } from 'manim-web';
  import { animations } from '$lib/animations/registry'; // Keep this if needed

  const WIDTH = 800;
  const HEIGHT = 450;
  let title = "Basic atom"

  let containerEl = $state();
  let player = null;
  let isPlaying = $state(false);
  let isExporting = $state(false);
  let showExportActions = $state(false);
  let isRefreshing = $state(false);
  let containerKey = $state(0);
  let isDark = $state(false);

  let moreOpened = $state(false);
  let moreButtonEl = $state();

  let refreshOpened = $state(false);
  let refreshButtonEl = $state();

  const DARK_KEY = 'manim-web:dark-mode';

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

    initPlayer();
  });

  onDestroy(() => {
    player?.destroy?.();
  });

  function initPlayer() {
    player = new Player(containerEl, { width: WIDTH, height: HEIGHT, backgroundColor: BLACK });
    run();
  }

  // "Hot reload": re-run the scene on the SAME player/canvas, no teardown.
  // Fast, but carries whatever in-memory state manim-web keeps between runs
  // (relevant to the VGroup.setPoints caching bug — if points look doubled
  // after using this, that's the module-level cache, not this function).
  async function hotReload() {
    if (isRefreshing || isPlaying) return;
    refreshOpened = false;
    await run();
  }

  // "Full refresh": destroy player + canvas entirely and recreate, guaranteeing
  // a clean WebGL context and no leftover module-level state.
  function fullRefresh() {
    refreshOpened = false;
    window.location.reload();
  }

  async function scene(s) {
    const equation1 = new MathTex({
      latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
      color: WHITE,
    });
    await s.play(new Create(equation1, { duration: 3 }));
    await s.wait(1);
    await s.play(new FadeOut(equation1));
    await s.wait(1);
  }

  async function run() {
    if (!player || isPlaying) return;
    isPlaying = true;
    await player.sequence(scene);
    isPlaying = false;
  }

  function getCanvas() {
    return containerEl?.querySelector('canvas');
  }

  function exportImage() {
    const canvas = getCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manim-frame-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    showExportActions = false;
  }

  async function exportVideo() {
    const canvas = getCanvas();
    if (!canvas || isExporting) return;
    isExporting = true;
    showExportActions = false;
    const stream = canvas.captureStream(60);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();
    await player.sequence(scene);
    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manim-export-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    isExporting = false;
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<App theme="ios" dark={isDark}>
  <Page>
    <Navbar title={title} class="sticky top-0 z-30">
    </Navbar>

            <Fab
          bind:this={moreButtonEl}
          class="fixed left-safe-4 ios:bottom-safe-5 material:bottom-safe-18 z-20 k-color-brand-red more-btn"
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

    <div class="viewer-wrap">
      <div class="player-shell">
        {#key containerKey}
          <div bind:this={containerEl} class="player-container" style={`aspect-ratio:${WIDTH}/${HEIGHT}`}></div>
        {/key}
        {#if isExporting}
          <div class="export-badge">Recording…</div>
        {/if}
        {#if isRefreshing}
          <div class="export-badge">Refreshing…</div>
        {/if}
      </div>

      <Toolbar class="controls-toolbar" top={false}>
        <Fab
          iconOnly
          class="fixed left-1/2 -translate-x-1/2 bottom-safe-4 z-20"
          onclick={() => (showExportActions = true)}
          disabled={isExporting || isRefreshing}
          aria-label="Export"
        >
          {#if isExporting}
            <Preloader />
          {:else}
            <Share />
          {/if}
        </Fab>

        <Fab
          bind:element={refreshButtonEl}
          iconOnly
          class="fixed right-4 bottom-safe-4 z-20"
          onclick={() => (refreshOpened = true)}
          disabled={isRefreshing}
          aria-label="Refresh options"
        >
          {#if isRefreshing}
            <div class="spinner"></div>
          {:else}
            <RotateCcw />
          {/if}
        </Fab>
      </Toolbar>
    </div>

    <Popover
      opened={refreshOpened}
      target={refreshButtonEl}
      onBackdropClick={() => (refreshOpened = false)}
    >
      <List nested class="my-2">
        <ListItem
          link
          title="Hot reload"
          onclick={hotReload}
        >
          {#snippet media()}
            <RefreshCw size={18} />
          {/snippet}
        </ListItem>
        <ListItem
          link
          title="Full refresh"
          onclick={fullRefresh}
        >
          {#snippet media()}
            <RotateCw size={18} />
          {/snippet}
        </ListItem>
      </List>
    </Popover>

    <Actions
      opened={showExportActions}
      onBackdropClick={() => (showExportActions = false)}
    >
      <ActionsGroup>
        <ActionsLabel>Export scene</ActionsLabel>
        <ActionsButton onclick={exportImage} disabled={isPlaying}>
          Export current frame (PNG)
        </ActionsButton>
      </ActionsGroup>
      <ActionsGroup>
        <ActionsButton onclick={() => (showExportActions = false)}>
          Cancel
        </ActionsButton>
      </ActionsGroup>
    </Actions>
  </Page>
</App>

<style>
  .viewer-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
  .player-shell {
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: #202020;
  }
  .player-container {
    width: 100%;
  }
  .player-container :global(canvas) {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }

</style>