'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LocalGroup {
  id: string;
  name: string;
  className: string;
  subject: string;
}

function GroupModal({ onClose, onSave }: { onClose: () => void; onSave: (group: Omit<LocalGroup, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { name: name.trim(), className: className.trim(), subject: subject.trim() };
    if (!next.name || !next.className || !next.subject) {
      setError('Fill in group name, class, and subject.');
      return;
    }
    onSave(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md animate-[fadeIn_180ms_ease-out]">
      <form onSubmit={submit} className="card w-full max-w-md p-5 shadow-2xl sm:p-6 animate-[modalIn_220ms_ease-out]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Create Group</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Lightweight local group setup. Full group management is coming soon.</p>
          </div>
          <button type="button" onClick={onClose} className="motion-press flex h-9 w-9 items-center justify-center rounded-full text-xl text-[var(--muted)] hover:bg-[var(--surface-subtle)]">x</button>
        </div>
        <div className="mt-5 space-y-4">
          <Input label="Group Name" value={name} onChange={(event) => setName(event.target.value)} required hint="Example: Grade 8 Science A" />
          <Input label="Class" value={className} onChange={(event) => setClassName(event.target.value)} required hint="Example: Grade 8" />
          <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required hint="Example: Science" />
        </div>
        {error ? <div className="mt-4 rounded-md border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-3 py-2 text-sm font-semibold text-[var(--danger)]">{error}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Create Group</Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

export default function GroupsPage() {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vedaai-local-groups');
      if (saved) setGroups(JSON.parse(saved));
    } catch {
      setStorageError('Could not load saved groups from this browser.');
    }
  }, []);

  const totalStudents = useMemo(() => 0, []);

  function saveGroup(group: Omit<LocalGroup, 'id'>) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const next = [{ id, ...group }, ...groups];
    setGroups(next);
    try {
      localStorage.setItem('vedaai-local-groups', JSON.stringify(next));
      setStorageError('');
    } catch {
      setStorageError('Group was created for this session, but could not be saved in this browser.');
    }
    setOpen(false);
  }

  return (
    <AppShell breadcrumb="My Groups">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Groups</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Organize classes for future group workflows.</p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>+ Create Group</Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card motion-lift min-w-0 p-4 sm:p-5">
            <p className="text-xs text-[var(--muted)]">Groups</p>
            <p className="mt-2 text-2xl font-bold">{groups.length}</p>
          </div>
          <div className="card motion-lift min-w-0 p-4 sm:p-5">
            <p className="text-xs text-[var(--muted)]">Students</p>
            <p className="mt-2 text-2xl font-bold">{totalStudents}</p>
          </div>
          <div className="card motion-lift min-w-0 p-4 sm:p-5">
            <p className="text-xs text-[var(--muted)]">Status</p>
            <p className="mt-2 text-sm font-semibold text-[var(--primary)]">Coming soon</p>
          </div>
        </div>
        {storageError ? <div className="rounded-md border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-200">{storageError}</div> : null}

        {groups.length === 0 ? (
          <div className="card motion-lift flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-3xl text-[var(--primary)]">+</div>
            <h2 className="mt-6 text-lg font-bold">No groups yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Create a lightweight local group now. Advanced group management will be added later.</p>
            <Button type="button" className="mt-6" onClick={() => setOpen(true)}>Create Group</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <article key={group.id} className="card motion-lift min-w-0 p-4 sm:p-5">
                <h2 className="truncate font-bold">{group.name}</h2>
                <p className="mt-2 truncate text-sm text-[var(--muted)]">{group.className} - {group.subject}</p>
                <div className="mt-5 rounded-lg bg-[var(--surface-subtle)] p-3 text-xs text-[var(--muted)]">Group management feature coming soon</div>
              </article>
            ))}
          </div>
        )}
      </div>
      {open ? <GroupModal onClose={() => setOpen(false)} onSave={saveGroup} /> : null}
    </AppShell>
  );
}
