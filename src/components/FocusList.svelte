<script>
  const { items = [], focusedIndex = 0, onSelect = () => {}, onFocusChange = () => {} } = $props();
  let listEl;

  function handleKeyDown(e) {
    if (!items.length) return;

    let newIndex = focusedIndex;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (focusedIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (focusedIndex - 1 + items.length) % items.length;
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(items[focusedIndex], focusedIndex);
        return;
      default:
        return;
    }

    onFocusChange(newIndex);
    listEl?.children[newIndex]?.focus();
    listEl?.children[newIndex]?.scrollIntoView({ block: 'nearest' });
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="focus-list" bind:this={listEl} role="listbox" aria-label="list">
  {#each items as item, index}
    <div
      class="focus-item"
      class:focused={index === focusedIndex}
      role="option"
      aria-selected={index === focusedIndex}
      tabindex={index === focusedIndex ? 0 : -1}
    >
      {@render children(item, index, index === focusedIndex)}
    </div>
  {/each}
</div>

{#snippet children(item, index, focused)}{/snippet}

<style>
  .focus-list {
    width: 100%;
    overflow-y: auto;
  }

  .focus-item {
    outline: none;
  }

  .focus-item.focused,
  .focus-item:focus {
    background-color: #1971e6;
  }
</style>
