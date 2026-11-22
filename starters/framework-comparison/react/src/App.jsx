import React, { useMemo, useState } from 'react';
import { toast } from '@wcomp/elementum';
import {
  ElBadge,
  ElButton,
  ElCard,
  ElDialog,
  ElInput,
  ElSelect,
  ElTable,
  ElThemeSwitch,
  ElToaster,
} from '@wcomp/elementum/react';

const INITIAL_MEMBERS = [
  { name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { name: 'Grace Hopper', role: 'Architect', status: 'Active' },
  { name: 'Alan Turing', role: 'Researcher', status: 'Invited' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export default function App() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Engineer');

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          (roleFilter === 'All' || m.role === roleFilter) &&
          m.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [members, query, roleFilter]
  );

  function addMember() {
    if (!newName.trim()) return;
    setMembers((prev) => [...prev, { name: newName.trim(), role: newRole, status: 'Active' }]);
    toast.success(`Added ${newName.trim()} (${newRole})`);
    setNewName('');
    setDialogOpen(false);
  }

  return (
    <main style={{ maxWidth: '820px', margin: '32px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <ElToaster />
      <ElCard bordered>
        <div slot="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>Team Directory (React)</h2>
            <ElBadge variant="primary">{`${filtered.length} members`}</ElBadge>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ElButton variant="primary" onClick={() => setDialogOpen(true)}>Add Member</ElButton>
            <ElThemeSwitch />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <ElInput
            placeholder="Filter by name..."
            value={query}
            onInput={(e) => setQuery(e.detail?.value ?? '')}
          />
          <ElSelect value={roleFilter} onChange={(e) => setRoleFilter(e.detail?.value ?? 'All')}>
            <option value="All">All Roles</option>
            <option value="Engineer">Engineer</option>
            <option value="Architect">Architect</option>
            <option value="Researcher">Researcher</option>
          </ElSelect>
        </div>

        <ElTable selectable columns={COLUMNS} data={filtered} />
      </ElCard>

      <ElDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <h3 slot="header" style={{ margin: 0 }}>Invite Team Member</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <ElInput placeholder="Full name" value={newName} onInput={(e) => setNewName(e.detail?.value ?? '')} />
          <ElSelect value={newRole} onChange={(e) => setNewRole(e.detail?.value ?? 'Engineer')}>
            <option value="Engineer">Engineer</option>
            <option value="Architect">Architect</option>
            <option value="Researcher">Researcher</option>
          </ElSelect>
        </div>
        <div slot="footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <ElButton variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</ElButton>
          <ElButton variant="primary" onClick={addMember}>Invite</ElButton>
        </div>
      </ElDialog>
    </main>
  );
}
