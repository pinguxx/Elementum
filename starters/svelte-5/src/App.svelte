<script>
  let message = $state('');
  let notificationsEnabled = $state(true);
  let showAlert = $state(false);

  function handleInput(e) {
    message = e.detail?.value ?? e.target?.value ?? '';
  }

  function handleToggle(e) {
    notificationsEnabled = Boolean(e.detail?.checked ?? e.target?.checked);
  }
</script>

<main style="padding: 48px 16px; max-width: 520px; margin: 0 auto;">
  <el-card bordered>
    <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 1.25rem;">Svelte 5 + Elementum</h2>
      <el-theme-switch></el-theme-switch>
    </div>

    <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
      <el-input
        placeholder="Type a message..."
        value={message}
        oninput={handleInput}
      ></el-input>

      <el-switch checked={notificationsEnabled} onchange={handleToggle}>
        Enable notifications ({notificationsEnabled ? 'On' : 'Off'})
      </el-switch>

      <el-button variant="primary" onclick={() => (showAlert = true)}>
        Trigger Alert
      </el-button>

      {#if showAlert}
        <el-alert variant="success">
          Submitted: "{message || '(empty)'}" — notifications {notificationsEnabled ? 'enabled' : 'muted'}.
        </el-alert>
      {/if}
    </div>
  </el-card>
</main>
