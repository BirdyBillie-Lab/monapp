'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { Product, LineCategory } from '@/lib/types';
import { ChevronLeft, PackagePlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatEurDecimal } from '@/lib/calculations';

const CAT_LABELS: Record<LineCategory, string> = {
  services: 'Prestation de service',
  sales: 'Vente de marchandise',
};

// ─── Inline edit form ──────────────────────────────────────────────────────────

function ProductEditForm({ product, onSave, onCancel }: {
  product: Product; onSave: (p: Product) => void; onCancel: () => void;
}) {
  const [nom, setNom]             = useState(product.nom);
  const [desc, setDesc]           = useState(product.description ?? '');
  const [prix, setPrix]           = useState(product.prixUnitaire?.toString() ?? '');
  const [cat, setCat]             = useState<LineCategory>(product.lineCategory);

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-border mt-3">
      <div>
        <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Nom *</label>
        <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du produit / prestation"
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      </div>
      <div>
        <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Description</label>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description courte (optionnel)"
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Prix unitaire (€)</label>
          <div className="relative">
            <input type="number" inputMode="decimal" value={prix} onChange={e => setPrix(e.target.value)} placeholder="0,00"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 pr-7 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">€</span>
          </div>
        </div>
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Catégorie</label>
          <div className="flex flex-col gap-1">
            {(['services', 'sales'] as LineCategory[]).map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="w-full py-1.5 px-2 rounded-lg text-[10px] font-medium text-center transition-all"
                style={cat === c
                  ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                  : { background: '#2A2540', border: '1px solid #2D2848', color: '#9B8EC4' }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ ...product, nom: nom.trim(), description: desc.trim() || undefined, prixUnitaire: parseFloat(prix) || undefined, lineCategory: cat })}
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

// ─── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onUpdate, onDelete }: {
  product: Product; onUpdate: (p: Product) => void; onDelete: () => void;
}) {
  const [editing, setEditing]       = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-text font-semibold text-sm">{product.nom}</p>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA' }}>
              {CAT_LABELS[product.lineCategory]}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {product.description && <p className="text-muted text-[11px]">{product.description}</p>}
            {product.prixUnitaire != null && (
              <p className="text-gold text-[11px] font-medium">{formatEurDecimal(product.prixUnitaire)}</p>
            )}
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
      {editing && <ProductEditForm product={product} onSave={p => { onUpdate(p); setEditing(false); }} onCancel={() => setEditing(false)} />}
    </div>
  );
}

// ─── Add form ──────────────────────────────────────────────────────────────────

function AddProductForm({ onAdd, onCancel }: { onAdd: (p: Product) => void; onCancel: () => void }) {
  const [nom, setNom]   = useState('');
  const [desc, setDesc] = useState('');
  const [prix, setPrix] = useState('');
  const [cat, setCat]   = useState<LineCategory>('services');

  const handleSubmit = () => {
    if (!nom.trim()) return;
    onAdd({ id: crypto.randomUUID(), nom: nom.trim(), description: desc.trim() || undefined, prixUnitaire: parseFloat(prix) || undefined, lineCategory: cat, createdAt: new Date().toISOString() });
    setNom(''); setDesc(''); setPrix(''); setCat('services');
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-text font-semibold text-sm">Nouveau produit / prestation</p>
      <div>
        <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Nom *</label>
        <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Séance coaching, T-shirt brodé…"
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      </div>
      <div>
        <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Description</label>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description courte (optionnel)"
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Prix unitaire (€)</label>
          <div className="relative">
            <input type="number" inputMode="decimal" value={prix} onChange={e => setPrix(e.target.value)} placeholder="0,00"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 pr-7 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">€</span>
          </div>
        </div>
        <div>
          <label className="block text-muted text-[10px] uppercase tracking-widest mb-1">Catégorie</label>
          <div className="flex flex-col gap-1">
            {(['services', 'sales'] as LineCategory[]).map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="w-full py-1.5 px-2 rounded-lg text-[10px] font-medium text-center transition-all"
                style={cat === c
                  ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                  : { background: '#2A2540', border: '1px solid #2D2848', color: '#9B8EC4' }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      </div>
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

export default function ProduitsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  const sorted = [...products]
    .filter(p => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">

        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft size={18} className="text-text" />
          </button>
          <h1 className="text-2xl font-bold text-text">Mes produits</h1>
        </div>

        <div className="flex gap-2">
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors" />
          <button onClick={() => { setShowAddForm(true); setSearch(''); }}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
            <PackagePlus size={16} /> Ajouter
          </button>
        </div>

        {showAddForm && (
          <AddProductForm
            onAdd={p => { addProduct(p); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {sorted.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl px-5 py-10 text-center">
            <p className="text-muted text-sm">
              {search ? 'Aucun produit trouvé.' : 'Aucun produit enregistré. Ajoutez-en un !'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={updateProduct}
                onDelete={() => deleteProduct(product.id)}
              />
            ))}
          </div>
        )}

        <p className="text-muted text-xs text-center">
          {products.length} produit{products.length !== 1 ? 's' : ''} enregistré{products.length !== 1 ? 's' : ''}
        </p>

      </div>
    </AppShell>
  );
}
