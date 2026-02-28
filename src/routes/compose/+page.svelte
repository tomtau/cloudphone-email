<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { t } from '$lib/translations';
  import { currentProvider, currentEmail, loading, errorMessage } from '$lib/email/store';
  import Header from '../../components/Header.svelte';
  import SoftKeyBar from '../../components/SoftKeyBar.svelte';

  let provider = null;
  let mode = $state('new');
  let toField = $state('');
  let ccField = $state('');
  let bccField = $state('');
  let subjectField = $state('');
  let bodyField = $state('');
  let statusText = $state('');
  let hasError = $state(false);
  let focusedField = $state(0);
  let fields = ['to', 'cc', 'bcc', 'subject', 'body'];
  let toInput, ccInput, bccInput, subjectInput, bodyInput;

  currentProvider.subscribe((p) => {
    provider = p;
  });

  page.subscribe(async ($page) => {
    mode = $page.url.searchParams.get('mode') || 'new';
    const emailId = $page.url.searchParams.get('id') || '';

    if ((mode === 'reply' || mode === 'forward') && emailId && provider) {
      try {
        const email = await provider.getEmail(emailId);
        if (mode === 'reply') {
          toField = email.from;
          subjectField = `Re: ${email.subject.replace(/^Re:\s*/i, '')}`;
          bodyField = `\n\n--- Original message ---\n${stripHtml(email.body)}`;
        } else if (mode === 'forward') {
          subjectField = `Fwd: ${email.subject.replace(/^Fwd:\s*/i, '')}`;
          bodyField = `\n\n--- Forwarded message ---\n${$t('email.from')}: ${email.fromName || email.from}\n${$t('email.subject')}: ${email.subject}\n\n${stripHtml(email.body)}`;
        }
      } catch (e) {
        console.error('Failed to load email for compose', e);
      }
    }
  });

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  function getTitle() {
    switch (mode) {
      case 'reply': return $t('email.reply');
      case 'forward': return $t('email.forward');
      default: return $t('email.compose');
    }
  }

  async function sendEmail() {
    if (!provider || !toField.trim() || !subjectField.trim()) return;
    statusText = $t('email.sending');
    hasError = false;
    loading.set(true);

    try {
      const success = await provider.sendEmail({
        to: toField.split(',').map((s) => s.trim()).filter(Boolean),
        cc: ccField ? ccField.split(',').map((s) => s.trim()).filter(Boolean) : [],
        bcc: bccField ? bccField.split(',').map((s) => s.trim()).filter(Boolean) : [],
        subject: subjectField,
        body: bodyField,
        inReplyTo: mode === 'reply' ? '' : undefined,
        forwardOf: mode === 'forward' ? '' : undefined,
      });

      if (success) {
        statusText = $t('email.sent_success');
        setTimeout(() => history.back(), 1000);
      } else {
        hasError = true;
        statusText = $t('email.sendFailed');
      }
    } catch (e) {
      hasError = true;
      statusText = e.message || $t('email.sendFailed');
    } finally {
      loading.set(false);
    }
  }

  function onSoftKeyClick(position) {
    switch (position) {
      case 'center':
        sendEmail();
        break;
      case 'end':
        history.back();
        break;
    }
  }

  function focusField(index) {
    focusedField = index;
    switch (index) {
      case 0: toInput?.focus(); break;
      case 1: ccInput?.focus(); break;
      case 2: bccInput?.focus(); break;
      case 3: subjectInput?.focus(); break;
      case 4: bodyInput?.focus(); break;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      focusField(Math.min(focusedField + 1, fields.length - 1));
    } else if (e.key === 'ArrowUp' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      focusField(Math.max(focusedField - 1, 0));
    } else if (e.key === 'Backspace' && !toField && !subjectField && !bodyField) {
      e.preventDefault();
      history.back();
    }
  }
</script>

<Header title={getTitle()} />

<svelte:window onkeydown={onKeyDown} />

<section id="app">
  <div class="form-group" class:focused={focusedField === 0}>
    <label for="compose-to">{$t('email.to')}</label>
    <input
      id="compose-to"
      type="email"
      bind:value={toField}
      bind:this={toInput}
      placeholder="email@example.com"
      onfocus={() => focusedField = 0}
    />
  </div>

  <div class="form-group" class:focused={focusedField === 1}>
    <label for="compose-cc">{$t('email.cc')}</label>
    <input
      id="compose-cc"
      type="email"
      bind:value={ccField}
      bind:this={ccInput}
      placeholder={$t('email.cc')}
      onfocus={() => focusedField = 1}
    />
  </div>

  <div class="form-group" class:focused={focusedField === 2}>
    <label for="compose-bcc">{$t('email.bcc')}</label>
    <input
      id="compose-bcc"
      type="email"
      bind:value={bccField}
      bind:this={bccInput}
      placeholder={$t('email.bcc')}
      onfocus={() => focusedField = 2}
    />
  </div>

  <div class="form-group" class:focused={focusedField === 3}>
    <label for="compose-subject">{$t('email.subject')}</label>
    <input
      id="compose-subject"
      type="text"
      bind:value={subjectField}
      bind:this={subjectInput}
      placeholder={$t('email.subject')}
      onfocus={() => focusedField = 3}
    />
  </div>

  <div class="form-group" class:focused={focusedField === 4}>
    <label for="compose-body">{$t('email.body')}</label>
    <textarea
      id="compose-body"
      bind:value={bodyField}
      bind:this={bodyInput}
      placeholder={$t('email.body')}
      rows="6"
      onfocus={() => focusedField = 4}
    ></textarea>
  </div>

  {#if statusText}
    <p class="status" class:error={hasError}>{statusText}</p>
  {/if}
</section>

<SoftKeyBar
  onSoftKeyClick={onSoftKeyClick}
  items={[{
    key: 'center',
    text: $t('email.send'),
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

  .form-group {
    margin-bottom: 4px;
    border-left: 2px solid transparent;
    padding-left: 4px;
  }

  .form-group.focused {
    border-left-color: #5CB5FF;
  }

  label {
    display: block;
    font-size: 0.7em;
    color: #aaa;
    margin-bottom: 1px;
  }

  input, textarea {
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

  input:focus, textarea:focus {
    border-color: #5CB5FF;
  }

  textarea {
    resize: none;
    min-height: 60px;
  }

  .status {
    font-size: 0.75em;
    color: #5CB5FF;
    text-align: center;
    margin-top: 4px;
  }

  .status.error {
    color: #ff5555;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    #app {
      padding: 36px 8pt 36px 8pt;
    }

    label {
      font-size: 0.85em;
    }

    input, textarea {
      font-size: 0.95em;
      padding: 4px 6px;
    }

    textarea {
      min-height: 80px;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    #app {
      padding: 20px 4pt 20px 4pt;
    }

    label {
      font-size: 0.6em;
    }

    input, textarea {
      font-size: 0.7em;
      padding: 2px 3px;
    }

    textarea {
      min-height: 40px;
    }
  }
</style>
