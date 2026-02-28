<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { t } from '$lib/translations';
  import { currentProvider, currentEmail, loading } from '$lib/email/store.js';
  import Header from '../../components/Header.svelte';
  import OptionsMenu from '../../components/OptionsMenu.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';

  let provider = null;
  let menuVisible = $state(false);
  let email = $state(null);
  let emailId = $state('');

  currentProvider.subscribe((p) => {
    provider = p;
  });

  currentEmail.subscribe((e) => {
    email = e;
  });

  page.subscribe(($page) => {
    emailId = $page.url.searchParams.get('id') || '';
    if (emailId) {
      loadEmail();
    }
  });

  async function loadEmail() {
    if (!provider || !emailId) return;
    loading.set(true);
    try {
      const msg = await provider.getEmail(emailId);
      currentEmail.set(msg);
      if (!msg.isRead) {
        await provider.markAsRead(emailId);
        msg.isRead = true;
        currentEmail.set(msg);
      }
    } catch (e) {
      console.error('Failed to load email', e);
    } finally {
      loading.set(false);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'start':
        menuVisible = !menuVisible;
        break;
      case 'end':
        history.back();
        break;
    }
  }

  function onMenuItemSelected(item) {
    menuVisible = false;
    if (item.action === 'reply') {
      goto(`${base}/compose?mode=reply&id=${encodeURIComponent(emailId)}`);
    } else if (item.action === 'forward') {
      goto(`${base}/compose?mode=forward&id=${encodeURIComponent(emailId)}`);
    } else if (item.action === 'markRead') {
      markRead();
    }
  }

  async function markRead() {
    if (!provider || !emailId) return;
    try {
      await provider.markAsRead(emailId);
      if (email) {
        email.isRead = true;
        currentEmail.set(email);
      }
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  }

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
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

    if (e.key === 'Backspace') {
      e.preventDefault();
      history.back();
    }
  }
</script>

<Header title={email?.subject || $t('email.email')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  {#if email}
    <div class="email-meta">
      <div class="meta-row">
        <span class="label">{$t('email.from')}:</span>
        <span class="value">{email.fromName || email.from}</span>
      </div>
      <div class="meta-row">
        <span class="label">{$t('email.to')}:</span>
        <span class="value">{email.to.join(', ')}</span>
      </div>
      <div class="meta-row">
        <span class="label">{$t('email.date')}:</span>
        <span class="value">{formatDate(email.date)}</span>
      </div>
      {#if email.hasAttachments}
        <div class="meta-row">
          <span class="label">📎</span>
          <span class="value">{$t('email.attachment')}</span>
        </div>
      {/if}
    </div>
    <div class="email-body">
      {@html email.body}
    </div>
  {:else}
    <p class="loading-text">{$t('email.loading')}</p>
  {/if}
</section>

<OptionsMenu
  visible={menuVisible}
  onMenuItemSelected={onMenuItemSelected}
  items={[
    { href: '#reply', text: $t('email.reply'), action: 'reply' },
    { href: '#forward', text: $t('email.forward'), action: 'forward' },
    { href: '#markRead', text: $t('email.markRead'), action: 'markRead' },
  ]} />

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'start',
    icon: 'menu',
  }, {
    key: 'end',
    icon: 'back',
  }]} />

<style>
  #app {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 4pt;
  }

  .email-meta {
    border-bottom: 1px solid #444;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }

  .meta-row {
    display: flex;
    font-size: 0.75em;
    line-height: 1.4;
  }

  .label {
    color: #aaa;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .email-body {
    font-size: 0.8em;
    line-height: 1.4;
    word-break: break-word;
  }

  .email-body :global(*) {
    max-width: 100%;
    overflow-wrap: break-word;
  }

  .email-body :global(img) {
    max-width: 100%;
    height: auto;
  }

  .loading-text {
    text-align: center;
    color: #888;
    font-size: 0.85em;
    padding: 16px;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding: 36px 8pt 36px 8pt;
    }

    .meta-row {
      font-size: 0.85em;
    }

    .email-body {
      font-size: 0.9em;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding: 20px 4pt 20px 4pt;
    }

    .meta-row {
      font-size: 0.6em;
    }

    .email-body {
      font-size: 0.65em;
    }
  }
</style>
