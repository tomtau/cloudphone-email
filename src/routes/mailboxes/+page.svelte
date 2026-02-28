<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { currentProvider, isLoggedIn, userEmail, mailboxes, loading } from '$lib/email/store.js';
  import Header from '../../components/Header.svelte';
  import OptionsMenu from '../../components/OptionsMenu.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';

  let provider = null;
  let focusedIndex = $state(0);
  let menuVisible = $state(false);
  let mailboxList = $state([]);

  currentProvider.subscribe((p) => {
    provider = p;
  });

  isLoggedIn.subscribe((loggedIn) => {
    if (!loggedIn && provider) {
      goto(`${base}/`);
    }
  });

  mailboxes.subscribe((m) => {
    mailboxList = m;
  });

  async function loadMailboxes() {
    if (!provider) return;
    loading.set(true);
    try {
      const boxes = await provider.getMailboxes();
      mailboxes.set(boxes);
    } catch (e) {
      console.error('Failed to load mailboxes', e);
    } finally {
      loading.set(false);
    }
  }

  loadMailboxes();

  function openMailbox(index) {
    if (menuVisible) return;
    const box = mailboxList[index];
    if (box) {
      goto(`${base}/mailbox?id=${encodeURIComponent(box.id)}&name=${encodeURIComponent(box.name)}`);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'start':
        menuVisible = !menuVisible;
        break;
      case 'center':
        openMailbox(focusedIndex);
        break;
      case 'end':
        history.back();
        break;
    }
  }

  async function handleLogout() {
    if (provider) {
      await provider.logout();
    }
    isLoggedIn.set(false);
    currentProvider.set(null);
    userEmail.set('');
    goto(`${base}/`);
  }

  function onMenuItemSelected(item) {
    menuVisible = false;
    if (item.action === 'compose') {
      goto(`${base}/compose`);
    } else if (item.action === 'search') {
      goto(`${base}/search`);
    } else if (item.action === 'refresh') {
      loadMailboxes();
    } else if (item.action === 'logout') {
      handleLogout();
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
        if (mailboxList.length > 0) {
          focusedIndex = (focusedIndex + 1) % mailboxList.length;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (mailboxList.length > 0) {
          focusedIndex = (focusedIndex - 1 + mailboxList.length) % mailboxList.length;
        }
        break;
      case 'Backspace':
        e.preventDefault();
        history.back();
        break;
    }
  }
</script>

<Header title={$t('email.mailboxes')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  {#each mailboxList as box, index}
    <button
      class="mailbox-item"
      class:focused={index === focusedIndex}
      onclick={() => openMailbox(index)}
      tabindex={index === focusedIndex ? 0 : -1}
    >
      <span class="mailbox-name">{box.name}</span>
      {#if box.unreadCount > 0}
        <span class="mailbox-badge">{box.unreadCount}</span>
      {/if}
      <span class="mailbox-count">{box.totalCount}</span>
    </button>
  {/each}
</section>

<OptionsMenu
  visible={menuVisible}
  onMenuItemSelected={onMenuItemSelected}
  items={[
    { href: '#compose', text: $t('email.compose'), action: 'compose' },
    { href: '#search', text: $t('email.search'), action: 'search' },
    { href: '#refresh', text: $t('email.refresh'), action: 'refresh' },
    { href: '#logout', text: $t('email.logout'), action: 'logout' },
    { href: `${base}/settings`, text: $t('common.settings') },
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

  .mailbox-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 6px 4pt;
    border-bottom: 1px solid #333;
    cursor: pointer;
    outline: none;
  }

  .mailbox-item.focused,
  .mailbox-item:focus {
    background-color: #1971e6;
  }

  .mailbox-name {
    flex: 1;
    font-size: 0.9em;
    font-weight: bold;
  }

  .mailbox-badge {
    background: #5CB5FF;
    color: black;
    border-radius: 8px;
    padding: 0 5px;
    font-size: 0.7em;
    font-weight: bold;
    margin-right: 6px;
  }

  .mailbox-count {
    font-size: 0.7em;
    color: #aaa;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding-top: 36px;
      padding-bottom: 36px;
    }

    .mailbox-item {
      padding: 8px 8pt;
    }

    .mailbox-name {
      font-size: 1.1em;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    .mailbox-item {
      padding: 3px 4pt;
    }

    .mailbox-name {
      font-size: 0.75em;
    }

    .mailbox-badge {
      font-size: 0.6em;
      padding: 0 3px;
    }

    .mailbox-count {
      font-size: 0.6em;
    }
  }
</style>
