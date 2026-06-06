'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { Client } from '@/lib/types';
import { ChevronLeft, UserPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

function clientFullName(c: Client) {
  return [c.prenom, c.nom].filter(Boolean).join(' ');
}

// ─── Inline edit form ──────────────────────────────────────────────────────────

function ClientEditForm({ client, onSave, onCancel }: {
  client: Client; onSave: (c: Client) => void; onCancel: () => void;
}) {
  const [nom, setNom]       = useState(client.nom);
  const [prenom, setPrenom] = useState(client.prenom ?? '');
  const [tel, setTel]       = useState(client.telephone ?? '');
  const [addr, setAddr]     = useState(client.adresse ?? '');

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border mt-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Prénom</label>
          <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        </div>
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Nom *</label>
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        </div>
      </div>
      <input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="Téléphone"
        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      <input type="text" value={addr} onChange={e => setAddr(e.target.value)} placeholder="Adresse"
        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      <div className="flex gap-2">
        <button onClick={() => onSave({ ...client, nom: nom.trim(), prenom: prenom.trim() || undefined, telephone: tel.trim() || undefined, adresse: addr.trim() || undefined })}
          disabled={!nom.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
          <Check size={14} /> Enregistrer
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted bg-surface border border-border">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Client card ───────────────────────────────────────────────────────────────

function ClientCard({ client, onUpdate, onDelete }: {
  client: Client; onUpdate: (c: Client) => void; onDelete: () => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  const handleSave = (updated: Client) => { onUpdate(updated); setEditing(false); };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-text font-semibold text-sm">{clientFullName(client)}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {client.telephone && <p className="text-muted text-[11px]">{client.telephone}</p>}
            {client.adresse   && <p className="text-muted text-[11px] truncate">{client.adresse}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {deleteStep === 1 ? (
            <>
              <button onClick={onDelete}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)' }}>
                Confirmer
              </button>
              <button onClick={() => setDeleteStep(0)} className="text-muted"><X size={15} /></button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(v => !v); setDeleteStep(0); }} className="text-muted hover:text-purple-light transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={() => { setDeleteStep(1); setEditing(false); }} className="text-muted hover:text-danger transition-colors">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
      {editing && <ClientEditForm client={client} onSave={handleSave} onCancel={() => setEditing(false)} />}
    </div>
  );
}

// ─── Add client form ───────────────────────────────────────────────────────────

function AddClientForm({ onAdd, onCancel }: { onAdd: (c: Client) => void; onCancel: () => void }) {
  const [nom, setNom]       = useState('');
  const [prenom, setPrenom] = useState('');
  const [tel, setTel]       = useState('');
  const [addr, setAddr]     = useState('');

  const handleSubmit = () => {
    if (!nom.trim()) return;
    onAdd({ id: crypto.randomUUID(), nom: nom.trim(), prenom: prenom.trim() || undefined, telephone: tel.trim() || undefined, adresse: addr.trim() || undefined, createdAt: new Date().toISOString() });
    setNom(''); setPrenom(''); setTel(''); setAddr('');
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-text font-semibold text-sm">Nouveau client</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Prénom</label>
          <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        </div>
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Nom *</label>
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom"
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        </div>
      </div>
      <input type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="Téléphone"
        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      <input type="text" value={addr} onChange={e => setAddr(e.target.value)} placeholder="Adresse"
        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!nom.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
          Ajouter
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted bg-surface border border-border">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  const sorted = [...clients]
    .filter(c => !search || clientFullName(c).toLowerCase().includes(search.toLowerCase()) || (c.telephone ?? '').includes(search))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft size={18} className="text-text" />
          </button>
          <h1 className="text-2xl font-bold text-text">Mes clients</h1>
        </div>

        {/* Search + add */}
        <div className="flex gap-2">
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
          <button onClick={() => { setShowAddForm(true); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
            <UserPlus size={16} /> Ajouter
          </button>
        </div>

        {showAddForm && (
          <AddClientForm
            onAdd={c => { addClient(c); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {sorted.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl px-5 py-10 text-center">
            <p className="text-muted text-sm">
              {search ? 'Aucun client trouvé.' : 'Aucun client enregistré. Ajoutez-en un !'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onUpdate={updateClient}
                onDelete={() => deleteClient(client.id)}
              />
            ))}
          </div>
        )}

        <p className="text-muted text-xs text-center">
          {clients.length} client{clients.length !== 1 ? 's' : ''} enregistré{clients.length !== 1 ? 's' : ''}
        </p>

      </div>
    </AppShell>
  );
}
