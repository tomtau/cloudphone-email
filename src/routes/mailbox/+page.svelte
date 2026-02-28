<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { t } from '$lib/translations';
  import { currentProvider, currentEmails, loading } from '$lib/email/store';
  import Header from '../../components/Header.svelte';
  import OptionsMenu from '../../components/OptionsMenu.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';
  import EmailItem from '../../components/EmailItem.svelte';

  let provider = null;
  let focusedIndex = $state(0);
  let menuVisible = $state(false);
  let emails = $state([]);
  let mailboxId = $state('');
  let mailboxName = $state('');
  let hasMore = $state(false);
  let currentPage = $state(0);

  currentProvider.subscribe((p) => {
    provider = p;
  });

  currentEmails.subscribe((e) => {
    emails = e;
  });

  page.subscribe(($page) => {
    mailboxId = $page.url.searchParams.get('id') || '';
    mailboxName = $page.url.searchParams.get('name') || '';
    if (mailboxId) {
      loadEmails();
    }
  });

  async function loadEmails() {
    if (!provider || !mailboxId) return;
    loading.set(true);
    try {
      const result = await provider.getEmails(mailboxId, { page: currentPage, pageSize: 15 });
      currentEmails.set(result.emails);
      hasMore = result.hasMore;
    } catch (e) {
      console.error('Failed to load emails', e);
    } finally {
      loading.set(false);
    }
  }

  function openEmail(index) {
    if (menuVisible) return;
    const email = emails[index];
    if (email) {
      goto(`${base}/email?id=${encodeURIComponent(email.id)}`);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'start':
        menuVisible = !menuVisible;
        break;
      case 'center':
        openEmail(focusedIndex);
        break;
      case 'end':
        history.back();
        break;
    }
  }

  function onMenuItemSelected(item) {
    menuVisible = false;
    if (item.action === 'compose') {
      goto(`${base}/compose`);
    } else if (item.action === 'search') {
      goto(`${base}/search`);
    } else if (item.action === 'refresh') {
      loadEmails();
    }
  }

  function onKeyDown(e) {
    if (menuVisible) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        menuVisible = false;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (emails.length > 0) {
          focusedIndex = (focusedIndex + 1) % emails.length;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (emails.length > 0) {
          focusedIndex = (focusedIndex - 1 + emails.length) % emails.length;
        }
        break;
      case 'Backspace':
        e.preventDefault();
        history.back();
        break;
    }
  }
</script>

<Header title={mailboxName || $t('email.inbox')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  {#if emails.length === 0}
    <p class="empty">{$t('email.noEmails')}</p>
  {:else}
    {#each emails as email, index}
      <button
        class="email-row"
        class:focused={index === focusedIndex}
        onclick={() => openEmail(index)}
        tabindex={index === focusedIndex ? 0 : -1}
      >
        <EmailItem {email} focused={index === focusedIndex} />
      </button>
    {/each}
  {/if}
</section>

<OptionsMenu
  visible={menuVisible}
  onMenuItemSelected={onMenuItemSelected}
  items={[
    { href: '#compose', text: $t('email.compose'), action: 'compose' },
    { href: '#search', text: $t('email.search'), action: 'search' },
    { href: '#refresh', text: $t('email.refresh'), action: 'refresh' },
  ]} />

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'start',
    icon: 'menu',
  }, {
    key: 'center',
    icon: 'select',
    title: $t('email.open'),
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
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding-top: 20px;
      padding-bottom: 20px;
    }
  }
</style>
