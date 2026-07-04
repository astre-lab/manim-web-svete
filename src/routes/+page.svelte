<script lang="ts">
  import { App, Page, Navbar, List, ListItem, BlockTitle } from 'konsta/svelte';
  import { animations } from '$lib/animations/registry';
</script>

<svelte:head>
  <title>Animations</title>
</svelte:head>

<App theme="ios" dark>
  <Page>
    <Navbar title="Animations" />

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