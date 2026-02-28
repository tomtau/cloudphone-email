<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { getProviders } from '$lib/email/index';
  import { currentProvider, isLoggedIn } from '$lib/email/store';
  import Header from '../components/Header.svelte';
  import OptionsMenu from '../components/OptionsMenu.svelte';
  import SoftKeyBar from '../components/SoftKeyBar.svelte';

  const providers = getProviders();
  let focusedIndex = $state(0);
  let menuVisible = $state(false);

  function onSoftKeyClick(position) {
    switch (position) {
      case 'start':
        menuVisible = !menuVisible;
        break;
      case 'center':
        selectProvider(focusedIndex);
        break;
      case 'end':
        history.back();
        break;
    }
  }

  function selectProvider(index) {
    if (menuVisible) return;
    const provider = providers[index];
    currentProvider.set(provider);
    isLoggedIn.set(false);
    goto(`${base}/login`);
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
        focusedIndex = (focusedIndex + 1) % providers.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusedIndex = (focusedIndex - 1 + providers.length) % providers.length;
        break;
      case 'Backspace':
        e.preventDefault();
        break;
    }
  }
</script>

<Header title={$t('email.providerSelect')} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  {#each providers as provider, index}
    {@const info = provider.getInfo()}
    <button
      class="provider-item"
      class:focused={index === focusedIndex}
      onclick={() => selectProvider(index)}
      tabindex={index === focusedIndex ? 0 : -1}
    >
      <span class="provider-name">{info.name}</span>
      <span class="provider-desc">{info.description}</span>
    </button>
  {/each}
</section>

<OptionsMenu
  visible={menuVisible}
  items={[{
    href: `${base}/about`,
    text: $t('common.about'),
  }, {
    href: `${base}/settings`,
    text: $t('common.settings'),
  }, {
    href: 'https://www.cloudfone.com/dev-privacy',
    target: '_self',
    text: $t('common.privacy')
  }]} />

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'start',
    icon: 'menu',
  }, {
    key: 'center',
    icon: 'select',
    title: $t('common.select'),
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

  .provider-item {
    display: block;
    width: 100%;
    padding: 6px 4pt;
    border-bottom: 1px solid #333;
    text-align: start;
    cursor: pointer;
    outline: none;
  }

  .provider-item.focused,
  .provider-item:focus {
    background-color: #1971e6;
  }

  .provider-name {
    display: block;
    font-size: 0.9em;
    font-weight: bold;
  }

  .provider-desc {
    display: block;
    font-size: 0.7em;
    color: #ccc;
  }

  .provider-item.focused .provider-desc {
    color: #ddd;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding-top: 36px;
      padding-bottom: 36px;
    }

    .provider-item {
      padding: 8px 8pt;
    }

    .provider-name {
      font-size: 1.1em;
    }

    .provider-desc {
      font-size: 0.85em;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    .provider-item {
      padding: 3px 4pt;
    }

    .provider-name {
      font-size: 0.75em;
    }

    .provider-desc {
      font-size: 0.6em;
    }
  }
</style>
