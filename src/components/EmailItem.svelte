<script>
  const { email, focused = false } = $props();

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
</script>

<div class="email-item" class:unread={!email.isRead} class:focused>
  <div class="email-header">
    <span class="sender">{email.fromName || email.from}</span>
    <span class="date">{formatDate(email.date)}</span>
  </div>
  <div class="subject">{email.subject}</div>
  <div class="snippet">{email.snippet}</div>
</div>

<style>
  .email-item {
    padding: 3px 4pt;
    border-bottom: 1px solid #333;
    cursor: pointer;
  }

  .email-item.unread {
    border-left: 2px solid #5CB5FF;
  }

  .email-item.unread .sender,
  .email-item.unread .subject {
    font-weight: bold;
  }

  .email-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .sender {
    font-size: 0.8em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .date {
    font-size: 0.65em;
    color: #aaa;
    margin-left: 4px;
    flex-shrink: 0;
  }

  .subject {
    font-size: 0.75em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snippet {
    font-size: 0.65em;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* QVGA */
  @media only screen and (min-width: 129px) and (max-width: 240px) {
    .email-item {
      padding: 4px 8pt;
    }

    .sender {
      font-size: 0.95em;
    }

    .date {
      font-size: 0.75em;
    }

    .subject {
      font-size: 0.85em;
    }

    .snippet {
      font-size: 0.75em;
    }
  }

  /* QQVGA */
  @media only screen and (max-width: 128px) {
    .email-item {
      padding: 2px 4pt;
    }

    .sender {
      font-size: 0.7em;
    }

    .subject {
      font-size: 0.65em;
    }

    .snippet {
      display: none;
    }
  }
</style>
