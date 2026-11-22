<script setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { toast } from '@wcomp/elementum';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const members = ref([
  { name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { name: 'Grace Hopper', role: 'Architect', status: 'Active' },
  { name: 'Alan Turing', role: 'Researcher', status: 'Invited' },
]);

const query = ref('');
const roleFilter = ref('All');
const dialogOpen = ref(false);
const newName = ref('');
const newRole = ref('Engineer');
const tableRef = ref(null);

const filtered = computed(() =>
  members.value.filter(
    (m) =>
      (roleFilter.value === 'All' || m.role === roleFilter.value) &&
      m.name.toLowerCase().includes(query.value.trim().toLowerCase())
  )
);

onMounted(() => {
  if (tableRef.value) tableRef.value.columns.value = COLUMNS;
});

watchEffect(() => {
  if (tableRef.value) tableRef.value.data.value = filtered.value;
});

function addMember() {
  if (!newName.value.trim()) return;
  members.value = [...members.value, { name: newName.value.trim(), role: newRole.value, status: 'Active' }];
  toast.success(`Added ${newName.value.trim()} (${newRole.value})`);
  newName.value = '';
  dialogOpen.value = false;
}
</script>

<template>
  <main style="max-width: 820px; margin: 32px auto; padding: 0 16px; font-family: system-ui, sans-serif;">
    <el-toaster></el-toaster>
    <el-card bordered>
      <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h2 style="margin: 0;">Team Directory (Vue 3)</h2>
          <el-badge variant="primary">{{ filtered.length }} members</el-badge>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <el-button variant="primary" @click="dialogOpen = true">Add Member</el-button>
          <el-theme-switch></el-theme-switch>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <el-input placeholder="Filter by name..." :value="query" @input="(e) => (query = e.detail?.value ?? '')" />
        <el-select :value="roleFilter" @change="(e) => (roleFilter = e.detail?.value ?? 'All')">
          <option value="All">All Roles</option>
          <option value="Engineer">Engineer</option>
          <option value="Architect">Architect</option>
          <option value="Researcher">Researcher</option>
        </el-select>
      </div>

      <el-table ref="tableRef" selectable></el-table>
    </el-card>

    <el-dialog :open="dialogOpen || undefined" @close="dialogOpen = false">
      <h3 slot="header" style="margin: 0;">Invite Team Member</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <el-input placeholder="Full name" :value="newName" @input="(e) => (newName = e.detail?.value ?? '')" />
        <el-select :value="newRole" @change="(e) => (newRole = e.detail?.value ?? 'Engineer')">
          <option value="Engineer">Engineer</option>
          <option value="Architect">Architect</option>
          <option value="Researcher">Researcher</option>
        </el-select>
      </div>
      <div slot="footer" style="display: flex; gap: 8px; justify-content: flex-end;">
        <el-button variant="secondary" @click="dialogOpen = false">Cancel</el-button>
        <el-button variant="primary" @click="addMember">Invite</el-button>
      </div>
    </el-dialog>
  </main>
</template>
