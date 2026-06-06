'use client';

import { use, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { Client, IncomeEntry, InvoiceLine, PaymentMethod, PLATFORM_FEES, Product } from '@/lib/types';
import { formatEurDecimal } from '@/lib/calculations';
import { ChevronLeft, Check, Plus, Trash2, X, UserPlus, Search, BookOpen } from 'lucide-react';

function clientFullName(c: Client) {
  return [c.prenom, c.nom].filter(Boolean).join(' ');
}

function emptyLine(): InvoiceLine {
  return { id: crypto.randomUUID(), description: '', category: 'services', amount: 0 };
}

// ─── Client field (same as new page) ──────────────────────────────────────────

function ClientField({ clients, selectedClient, manualName, onSelect, onManualChange, onAdd }: {
  clients: Client[]; selectedClient: Client | null; manualName: string;
  onSelect: (c: Client | null) => void; onManualChange: (n: string) => void; onAdd: (c: Client) => void;
}) {
  const [query, setQuery]         = useState(selectedClient ? clientFullName(selectedClient) : manualName);
  const [open, setOpen]           = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [newNom, setNewNom]       = useState('');
  const [newPrenom, setNewPrenom] = useState('');
  const [newTel, setNewTel]       = useState('');
  const [newAddr, setNewAddr]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter(c =>
      c.nom.toLowerCase().includes(q) || (c.prenom && c.prenom.toLowerCase().includes(q)) ||
      clientFullName(c).toLowerCase().includes(q)
    ).slice(0, 6);
  }, [clients, query]);

  const handleSelect = (c: Client) => { setQuery(clientFullName(c)); onSelect(c); setOpen(false); setShowForm(false); };
  const handleClear  = () => { setQuery(''); onSelect(null); onManualChange(''); setOpen(false); setShowForm(false); inputRef.current?.focus(); };

  const handleAddClient = () => {
    if (!newNom.trim()) return;
    const client: Client = { id: crypto.randomUUID(), nom: newNom.trim(), prenom: newPrenom.trim() || undefined, telephone: newTel.trim() || undefined, adresse: newAddr.trim() || undefined, createdAt: new Date().toISOString() };
    onAdd(client); handleSelect(client);
    setNewNom(''); setNewPrenom(''); setNewTel(''); setNewAddr(''); setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input ref={inputRef} type="text" placeholder="Rechercher ou saisir un client…"
          value={query} onChange={e => { setQuery(e.target.value); onManualChange(e.target.value); onSelect(null); setOpen(true); setShowForm(false); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full bg-surface border border-border rounded-2xl pl-9 pr-9 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors"
        />
        {query.length > 0 && <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"><X size={15} /></button>}
      </div>
      {open && (query.length > 0 || clients.length > 0) && !showForm && (
        <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden mt-1 z-10 flex flex-col">
          {matches.map(c => (
            <button key={c.id} onMouseDown={() => handleSelect(c)} className="w-full text-left px-4 py-3 border-b border-border last:border-b-0 flex flex-col gap-0.5">
              <span className="text-text text-sm font-medium">{clientFullName(c)}</span>
              {c.telephone && <span className="text-muted text-[10px]">{c.telephone}</span>}
            </button>
          ))}
          <button onMouseDown={() => { setOpen(false); setShowForm(true); setNewNom(query); }}
            className="w-full text-left px-4 py-3 flex items-center gap-2 border-t border-border" style={{ color: '#A78BFA' }}>
            <UserPlus size={14} /><span className="text-sm font-medium">{query.trim() ? `Ajouter « ${query.trim()} »` : 'Ajouter un client'}</span>
          </button>
        </div>
      )}
      {showForm && (
        <div className="bg-surface-2 border border-border rounded-2xl p-4 mt-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-text text-sm font-semibold">Nouveau client</span>
            <button onClick={() => setShowForm(false)} className="text-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Prénom</label>
              <input type="text" value={newPrenom} onChange={e => setNewPrenom(e.target.value)} placeholder="Prénom"
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
            </div>
            <div>
              <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Nom *</label>
              <input type="text" value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nom"
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
            </div>
          </div>
          <input type="tel" value={newTel} onChange={e => setNewTel(e.target.value)} placeholder="Téléphone"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
          <input type="text" value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Adresse complète"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
          <button onClick={handleAddClient} disabled={!newNom.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
            Enregistrer le client
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { entries, clients, products, updateEntry, deleteEntry, addClient } = useStore();

  const entry = entries.find(e => e.id === id);

  // Pre-populate state from existing entry
  const initClient = entry?.clientId ? (clients.find(c => c.id === entry.clientId) ?? null) : null;
  const [date, setDate]                   = useState(entry?.date ?? new Date().toISOString().slice(0, 10));
  const [selectedClient, setSelectedClient] = useState<Client | null>(initClient);
  const [clientName, setClientName]       = useState(entry?.clientName ?? '');
  const [invoiceRef, setInvoiceRef]       = useState(entry?.invoiceRef ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(entry?.paymentMethod ?? 'virement');
  const [lines, setLines]                 = useState<InvoiceLine[]>(() => {
    if (entry?.lines && entry.lines.length > 0) return entry.lines;
    if (entry) return [{ id: crypto.randomUUID(), description: entry.description ?? '', category: 'services', amount: entry.grossAmount }];
    return [emptyLine()];
  });
  const [deleteStep, setDeleteStep]       = useState(0);
  const [submitted, setSubmitted]         = useState(false);

  if (!entry) {
    return (
      <AppShell>
        <div className="px-4 pt-10 flex flex-col items-center gap-4">
          <p className="text-muted">Encaissement introuvable.</p>
          <button onClick={() => router.back()} className="text-purple-light text-sm underline">Retour</button>
        </div>
      </AppShell>
    );
  }

  const feeInfo       = PLATFORM_FEES[paymentMethod];
  const totalLine     = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const feeAmt        = totalLine * feeInfo.rate;
  const servicesTotal = lines.filter(l => l.category === 'services').reduce((s, l) => s + l.amount, 0);
  const salesTotal    = lines.filter(l => l.category === 'sales').reduce((s, l) => s + l.amount, 0);
  const isValid       = lines.some(l => l.description.trim() && l.amount > 0);

  const updateLine = (lid: string, patch: Partial<InvoiceLine>) =>
    setLines(prev => prev.map(l => l.id === lid ? { ...l, ...patch } : l));
  const removeLine = (lid: string) => setLines(prev => prev.filter(l => l.id !== lid));

  const handleNewClient = (client: Client) => { addClient(client); setSelectedClient(client); setClientName(clientFullName(client)); };

  const handleSubmit = () => {
    if (!isValid) return;
    const validLines = lines.filter(l => l.description.trim() && l.amount > 0);
    const gross = validLines.reduce((s, l) => s + l.amount, 0);
    const fee   = gross * feeInfo.rate;
    const effectiveName = selectedClient ? clientFullName(selectedClient) : clientName.trim();
    updateEntry({
      ...entry,
      date,
      clientName: effectiveName || undefined,
      clientId: selectedClient?.id ?? entry.clientId,
      invoiceRef: invoiceRef.trim() || undefined,
      lines: validLines,
      grossAmount: gross,
      netAmount: gross - fee,
      paymentMethod,
      platformFeeRate: feeInfo.rate,
      platformFeeAmount: fee,
    });
    setSubmitted(true);
    setTimeout(() => router.replace('/mes-recettes'), 1000);
  };

  const handleDelete = () => {
    if (deleteStep === 0) { setDeleteStep(1); return; }
    deleteEntry(entry.id);
    router.replace('/mes-recettes');
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-3">
        <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
          <Check size={36} className="text-success" />
        </div>
        <p className="text-text font-bold text-xl">Encaissement modifié !</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-5">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft size={18} className="text-text" />
          </button>
          <h1 className="text-xl font-bold text-text">Modifier l&apos;encaissement</h1>
        </div>

        {/* Date */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Date</label>
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm focus:border-purple transition-colors [color-scheme:dark]" />
        </div>

        {/* Client */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Client</label>
          <ClientField clients={clients} selectedClient={selectedClient} manualName={clientName}
            onSelect={c => { setSelectedClient(c); if (c) setClientName(clientFullName(c)); }}
            onManualChange={setClientName} onAdd={handleNewClient} />
        </div>

        {/* Invoice ref */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Référence facture</label>
          <input type="text" value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        </div>

        {/* Lines */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-3">Lignes de facturation</label>
          <div className="flex flex-col gap-3">
            {lines.map((line, i) => (
              <LineCard key={line.id} line={line} index={i} canDelete={lines.length > 1}
                products={products}
                onChange={patch => updateLine(line.id, patch)} onDelete={() => removeLine(line.id)} />
            ))}
          </div>
          <button onClick={() => setLines(prev => [...prev, emptyLine()])}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-purple/40 text-purple text-sm font-medium">
            <Plus size={16} strokeWidth={2.5} /> Ajouter une ligne
          </button>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Mode de paiement</label>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(PLATFORM_FEES) as [PaymentMethod, { label: string; rate: number }][]).map(([key, info]) => (
              <button key={key} onClick={() => setPaymentMethod(key)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={paymentMethod === key
                  ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.5)' }
                  : { background: '#1E1A2E', border: '1px solid #2D2848' }}>
                <span style={{ color: paymentMethod === key ? '#A78BFA' : '#FAF5FF', fontWeight: paymentMethod === key ? 500 : 400 }}>{info.label}</span>
                <span className={`text-xs ${info.rate > 0 ? 'text-warning' : 'text-muted'}`}>
                  {info.rate > 0 ? `−${(info.rate * 100).toFixed(2).replace('.', ',')}%` : 'Sans frais'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {totalLine > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            {servicesTotal > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Prestations</span><span className="text-text">{formatEurDecimal(servicesTotal)}</span></div>}
            {salesTotal > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Ventes</span><span className="text-text">{formatEurDecimal(salesTotal)}</span></div>}
            {feeAmt > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Frais {feeInfo.label}</span><span className="text-warning">−{formatEurDecimal(feeAmt)}</span></div>}
            <div className="flex justify-between items-baseline border-t border-border pt-2">
              <span className="text-text font-semibold">Total</span>
              <span className="text-text font-bold text-lg">{formatEurDecimal(totalLine)}</span>
            </div>
          </div>
        )}

        {/* Save */}
        <button onClick={handleSubmit} disabled={!isValid}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white disabled:opacity-30 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: isValid ? '0 4px 20px rgba(139,92,246,0.35)' : 'none' }}>
          Enregistrer les modifications
        </button>

        {/* Delete */}
        <button onClick={handleDelete}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
          style={deleteStep === 1
            ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#EF4444' }
            : { background: 'transparent', border: '1px solid #2D2848', color: '#6B7280' }}>
          {deleteStep === 1 ? 'Confirmer la suppression ?' : 'Supprimer cet encaissement'}
        </button>
        {deleteStep === 1 && (
          <button onClick={() => setDeleteStep(0)} className="text-muted text-xs text-center -mt-3">Annuler</button>
        )}

      </div>
    </AppShell>
  );
}

function LineCard({ line, index, canDelete, products = [], onChange, onDelete }: {
  line: InvoiceLine; index: number; canDelete: boolean; products?: Product[];
  onChange: (p: Partial<InvoiceLine>) => void; onDelete: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePickProduct = (p: Product) => {
    onChange({ description: p.nom, category: p.lineCategory, ...(p.prixUnitaire != null ? { amount: p.prixUnitaire } : {}) });
    setShowPicker(false);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-medium uppercase tracking-widest">Ligne {index + 1}</span>
        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-all"
              style={showPicker
                ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#A78BFA' }
                : { background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              <BookOpen size={11} /> Catalogue
            </button>
          )}
          {canDelete && <button onClick={onDelete} className="text-muted hover:text-danger transition-colors"><Trash2 size={15} /></button>}
        </div>
      </div>

      {showPicker && (
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden flex flex-col -mt-1">
          {[...products].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(p => (
            <button key={p.id} onMouseDown={() => handlePickProduct(p)}
              className="w-full text-left px-3 py-2.5 border-b border-border last:border-0 flex items-center justify-between gap-2">
              <div>
                <span className="text-text text-xs font-medium">{p.nom}</span>
                {p.description && <span className="text-muted text-[10px] ml-2">{p.description}</span>}
              </div>
              {p.prixUnitaire != null && <span className="text-gold text-[10px] font-medium shrink-0">{formatEurDecimal(p.prixUnitaire)}</span>}
            </button>
          ))}
        </div>
      )}

      <input type="text" placeholder="Description" value={line.description} onChange={e => onChange({ description: e.target.value })}
        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      <div className="flex gap-2">
        {(['services', 'sales'] as const).map(cat => (
          <button key={cat} onClick={() => onChange({ category: cat })}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all text-center"
            style={line.category === cat
              ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
              : { background: '#2A2540', border: '1px solid #2D2848', color: '#9B8EC4' }}>
            {cat === 'services' ? 'Prestation de service' : 'Vente de marchandise'}
          </button>
        ))}
      </div>
      <div className="relative">
        <input type="number" inputMode="decimal" placeholder="0,00" value={line.amount || ''}
          onChange={e => onChange({ amount: parseFloat(e.target.value) || 0 })}
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 pr-8 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
      </div>
    </div>
  );
}
