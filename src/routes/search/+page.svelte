<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { currentProvider, loading } from '$lib/email/store';
  import Header from '../../components/Header.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';
  import EmailItem from '../../components/EmailItem.svelte';

  let provider = null;
  let query = $state('');
  let results = $state([]);
  let focusedIndex = $state(-1);
  let hasSearched = $state(false);
  let searchInput;

  currentProvider.subscribe((p) => {
    provider = p;
  });

  async function doSearch() {
    if (!provider || !query.trim()) return;
    loading.set(true);
    hasSearched = true;
    try {
      const result = await provider.searchEmails(query.trim());
      results = result.emails;
      focusedIndex = results.length > 0 ? 0 : -1;
    } catch (e) {
      console.error('Search failed', e);
      results = [];
    } finally {
      loading.set(false);
    }
  }

  function openEmail(index) {
    const email = results[index];
    if (email) {
      goto(`${base}/email?id=${encodeURIComponent(email.id)}`);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'center':
        if (focusedIndex === -1) {
          doSearch();
        } else {
          openEmail(focusedIndex);
        }
        break;
      case 'end':
        history.back();
        break;
    }
  }

  function onKeyDown(e) {
    if (document.activeElement === searchInput) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault();
        searchInput.blur();
        focusedIndex = 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length > 0) {
          focusedIndex = (focusedIndex + 1) % results.length;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (focusedIndex <= 0) {
          focusedIndex = -1;
          searchInput?.focus();
        } else {
          focusedIndex = focusedIndex - 1;
        }
        break;
      case 'Backspace':
        e.preventDefault();
        history.back();
        break;
    }
  }
</script>

<Header title={$t('email.search')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  <div class="search-bar" class:focused={focusedIndex === -1}>
    <input
      type="text"
      bind:value={query}
      bind:this={searchInput}
      placeholder={$t('email.searchPlaceholder')}
    />
  </div>

  {#if hasSearched && results.length === 0}
    <p class="empty">{$t('email.noResults')}</p>
  {/if}

  {#each results as email, index}
    <button
      class="email-row"
      class:focused={index === focusedIndex}
      onclick={() => openEmail(index)}
      tabindex={index === focusedIndex ? 0 : -1}
    >
      <EmailItem {email} focused={index === focusedIndex} />
    </button>
  {/each}
</section>

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'center',
    text: focusedIndex === -1 ? $t('email.search') : $t('email.open'),
  }, {
    key: 'end',
    icon: 'back',
  }]} />

<style>
  #app {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .search-bar {
    padding: 4px 4pt;
    border-bottom: 1px solid #444;
    border-left: 2px solid transparent;
  }

  .search-bar.focused {
    border-left-color: #5CB5FF;
  }

  .search-bar input {
    width: 100%;
    background: #222;
    color: white;
    border: 1px solid #444;
    border-radius: 2px;
    padding: 3px 4px;
    font-size: 0.8em;
    font-family: inherit;
    outline: none;
  }

  .search-bar input:focus {
    border-color: #5CB5FF;
  }

  .empty {
    text-align: center;
    color: #888;
    font-size: 0.85em;
    padding: 16px;
  }

  .email-row {
    display: block;
    width: 100%;
    padding: 0;
    cursor: pointer;
    outline: none;
  }

  .email-row.focused,
  .email-row:focus {
    background-color: #1971e6;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding-top: 36px;
      padding-bottom: 36px;
    }

    .search-bar {
      padding: 6px 8pt;
    }

    .search-bar input {
      font-size: 0.95em;
      padding: 4px 6px;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    .search-bar {
      padding: 2px 4pt;
    }

    .search-bar input {
      font-size: 0.7em;
      padding: 2px 3px;
    }
  }
</style>
