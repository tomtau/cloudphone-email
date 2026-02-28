<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { currentProvider, isLoggedIn, userEmail, loading, errorMessage } from '$lib/email/store.js';
  import Header from '../../components/Header.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';

  let provider = null;
  let statusText = $state('');
  let hasError = $state(false);

  currentProvider.subscribe((p) => {
    provider = p;
    if (!p) {
      goto(`${base}/`);
    }
  });

  async function doLogin() {
    if (!provider) return;
    statusText = $t('email.loggingIn');
    hasError = false;
    loading.set(true);

    try {
      const success = await provider.login();
      if (success) {
        isLoggedIn.set(true);
        const email = await provider.getUserEmail();
        userEmail.set(email);
        goto(`${base}/mailboxes`);
      } else {
        hasError = true;
        statusText = $t('email.loginFailed');
      }
    } catch (e) {
      hasError = true;
      statusText = e.message || $t('email.loginFailed');
    } finally {
      loading.set(false);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'center':
        doLogin();
        break;
      case 'end':
        goto(`${base}/`);
        break;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doLogin();
    }
  }
</script>

<Header title={$t('email.login')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  {#if provider}
    {@const info = provider.getInfo()}
    <div class="login-box">
      <h2>{info.name}</h2>
      <p class="desc">{info.description}</p>
      {#if statusText}
        <p class="status" class:error={hasError}>{statusText}</p>
      {/if}
      <button class="login-btn focused" onclick={doLogin}>
        {$t('email.login')}
      </button>
    </div>
  {/if}
</section>

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'center',
    text: $t('email.login'),
  }, {
    key: 'end',
    icon: 'back',
  }]} />

<style>
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-box {
    text-align: center;
    padding: 8pt;
  }

  h2 {
    margin: 0;
    font-size: 1.1em;
  }

  .desc {
    font-size: 0.8em;
    color: #ccc;
    margin: 4px 0;
  }

  .status {
    font-size: 0.75em;
    color: #5CB5FF;
    margin: 4px 0;
  }

  .status.error {
    color: #ff5555;
  }

  .login-btn {
    margin-top: 8px;
    padding: 6px 16px;
    font-size: 0.9em;
    color: white;
    background: #1971e6;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;
  }

  .login-btn:focus,
  .login-btn.focused {
    outline: 2px solid #5CB5FF;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding-top: 36px;
      padding-bottom: 36px;
    }

    h2 {
      font-size: 1.3em;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    h2 {
      font-size: 0.9em;
    }

    .desc {
      font-size: 0.65em;
    }

    .login-btn {
      font-size: 0.75em;
      padding: 4px 12px;
    }
  }
</style>
