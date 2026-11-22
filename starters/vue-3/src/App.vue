<script setup>
import { ref } from 'vue';

const message = ref('');
const notificationsEnabled = ref(true);
const showAlert = ref(false);

function handleInput(e) {
  message.value = e.detail?.value ?? e.target?.value ?? '';
}

function handleToggle(e) {
  notificationsEnabled.value = Boolean(e.detail?.checked ?? e.target?.checked);
}
</script>

<template>
  <main style="padding: 48px 16px; max-width: 520px; margin: 0 auto;">
    <el-card bordered>
      <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 1.25rem;">Vue 3 + Elementum</h2>
        <el-theme-switch></el-theme-switch>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
        <el-input
          placeholder="Type a message..."
          :value="message"
          @input="handleInput"
        ></el-input>

        <el-switch :checked="notificationsEnabled" @change="handleToggle">
          Enable notifications ({{ notificationsEnabled ? 'On' : 'Off' }})
        </el-switch>

        <el-button variant="primary" @click="showAlert = true">
          Trigger Alert
        </el-button>

        <el-alert v-if="showAlert" variant="success">
          Submitted: "{{ message || '(empty)' }}" — notifications {{ notificationsEnabled ? 'enabled' : 'muted' }}.
        </el-alert>
      </div>
    </el-card>
  </main>
</template>
