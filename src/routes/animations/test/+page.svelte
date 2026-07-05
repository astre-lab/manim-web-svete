<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { Share, RotateCcw } from '@lucide/svelte';
  import { 
    App, Page, Navbar, Toolbar, Button, Fab,
    Block, BlockTitle, Actions, ActionsGroup, ActionsLabel, ActionsButton 
  } from 'konsta/svelte';
  import {
    Player, Circle, Square, Triangle, Create, Transform, FadeIn, FadeOut, MathTex, 
    Indicate, Rotate, BLACK, BLUE, RED, GREEN, YELLOW, Dot, WHITE 
  } from 'manim-web';


// :VALUES
  const WIDTH = 800;
  const HEIGHT = 450;
  let title = "Basic atom"
  
  
  let containerEl = $state();
  let player = null;
  let isPlaying = $state(false);
  let isExporting = $state(false);
  let showExportActions = $state(false);
  let isRefreshing = $state(false);
  let containerKey = $state(0); // bumping this forces Svelte to destroy/recreate the div

  onMount(() => {
    initPlayer();
  });

  onDestroy(() => {
    player?.destroy?.();
  });

  function initPlayer() {
    player = new Player(containerEl, { width: WIDTH, height: HEIGHT, backgroundColor: BLACK });
    run();
  }

  async function refreshContainer() {
    if (isRefreshing) return;
    isRefreshing = true;

    // Tear down current player/canvas fully
    player?.destroy?.();
    player = null;
    isPlaying = false;

    // Bump key so the {#key} block unmounts and remounts a brand new <div>,
    // guaranteeing no leftover canvas/WebGL context/state survives.
    containerKey += 1;

    // Wait for Svelte to actually swap in the new DOM node before rebinding
    await tick();

    initPlayer();
    isRefreshing = false;
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

<App theme="ios" dark={true}>
  <Page>
    <Navbar title={title} />

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
    <div class="spinner"></div>
  {:else}
<Share />
  {/if}
</Fab>

<Fab
  iconOnly
  class="fixed right-4 bottom-safe-4 z-20"
  onclick={refreshContainer}
  disabled={isRefreshing}
  aria-label="Refresh container"
>
  {#if isRefreshing}
    <div class="spinner"></div>
  {:else}
<RotateCcw />
  {/if}
</Fab>

      </Toolbar>
    </div>

    <Actions
      opened={showExportActions}
      onBackdropClick={() => (showExportActions = false)}
    >
      <ActionsGroup>
        <ActionsLabel>Export scene</ActionsLabel>
        <ActionsButton onclick={exportImage} disabled={isPlaying} >
          Export current frame (PNG)
        </ActionsButton>
        
 <!--
        <ActionsButton onclick={exportVideo}>
          Export full animation (WebM)
        </ActionsButton> -->
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
    background: #000;
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