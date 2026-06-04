'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { UserProfile, ActivityType, DeclarationFrequency } from '@/lib/types';
import { Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { THRESHOLDS } from '@/lib/calculations';

export default function SettingsPage() {
  const { profile, saveProfile } = useStore();
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const [form, setForm] = useState<UserProfile>({ ...profile });

  const handleSave = () => {
    saveProfile({ ...form, onboardingComplete: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (patch: Partial<UserProfile>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const activityLabels: Record<ActivityType, string> = {
    services: 'Prestations de services',
    sales: 'Vente de produits',
    mixed: 'Activité mixte',
  };

  const freqLabels: Record<DeclarationFrequency, string> = {
    monthly: 'Mensuelle',
    quarterly: 'Trimestrielle',
  };

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Réglages</h1>
          <p className="text-muted text-sm">Votre profil micro-entrepreneur</p>
        </div>

        {/* Activity type */}
        <Section title="Type d'activité">
          <div className="space-y-2">
            {(['services', 'sales', 'mixed'] as ActivityType[]).map((type) => (
              <button
                key={type}
                onClick={() => update({ activityType: type })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                  ${form.activityType === type
                    ? 'bg-purple/15 border border-purple'
                    : 'bg-surface-3 border border-border'
                  }`}
              >
                <span className={form.activityType === type ? 'text-purple font-medium text-sm' : 'text-white text-sm'}>
                  {activityLabels[type]}
                </span>
                {form.activityType === type && <Check size={16} className="text-purple" />}
              </button>
            ))}
          </div>
          <p className="text-muted text-xs mt-2 px-1">
            Plafond annuel : {new Intl.NumberFormat('fr-FR').format(THRESHOLDS[form.activityType])} €
          </p>
        </Section>

        {/* Declaration frequency */}
        <Section title="Fréquence de déclaration">
          <div className="space-y-2">
            {(['monthly', 'quarterly'] as DeclarationFrequency[]).map((freq) => (
              <button
                key={freq}
                onClick={() => update({ declarationFrequency: freq })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                  ${form.declarationFrequency === freq
                    ? 'bg-purple/15 border border-purple'
                    : 'bg-surface-3 border border-border'
                  }`}
              >
                <span className={form.declarationFrequency === freq ? 'text-purple font-medium text-sm' : 'text-white text-sm'}>
                  {freqLabels[freq]}
                </span>
                {form.declarationFrequency === freq && <Check size={16} className="text-purple" />}
              </button>
            ))}
          </div>
        </Section>

        {/* ACRE */}
        <Section title="Exonérations et options">
          <Toggle
            label="ACRE (Aide à la Création)"
            description="Réduction de 50% sur vos charges la 1ère année"
            checked={form.hasACRE}
            onChange={(v) => update({ hasACRE: v, acreStartDate: v ? new Date().toISOString() : undefined })}
          />
          <div className="h-px bg-border my-3" />
          <Toggle
            label="Versement libératoire"
            description="Impôt sur le revenu payé avec les charges sociales"
            checked={form.hasVersementLiberatoire}
            onChange={(v) => update({ hasVersementLiberatoire: v })}
          />
        </Section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold text-base mb-6 transition-all
            ${saved ? 'bg-success text-white' : 'bg-purple text-white'}`}
        >
          {saved ? '✓ Enregistré !' : 'Enregistrer les modifications'}
        </button>

        {/* About */}
        <div className="bg-surface-2 border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-muted text-xs uppercase tracking-wider font-medium">À propos</p>
          </div>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Données', value: 'Stockées localement' },
            { label: 'Taux de charges', value: 'Barème 2024' },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0">
              <span className="text-white/80 text-sm">{item.label}</span>
              <span className="text-muted text-sm">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-4 flex gap-3">
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
          <p className="text-muted text-xs leading-relaxed">
            Copilote est un outil d&apos;aide à la gestion, pas un logiciel comptable agréé.
            Pour toute question fiscale ou comptable, consultez un expert-comptable.
          </p>
        </div>

        {/* Danger zone */}
        <div className="bg-danger/5 border border-danger/20 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-danger/20">
            <p className="text-danger/70 text-xs uppercase tracking-wider font-medium">Zone de danger</p>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="w-full flex items-center justify-between px-4 py-3 text-danger text-sm"
          >
            <span>Réinitialiser l&apos;application</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-2 rounded-t-3xl p-6">
            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-danger" />
            </div>
            <h3 className="text-white font-bold text-lg text-center mb-2">
              Réinitialiser l&apos;application ?
            </h3>
            <p className="text-muted text-sm text-center mb-6">
              Toutes vos données (encaissements, profil) seront supprimées définitivement.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  localStorage.removeItem('copilote_data');
                  window.location.href = '/onboarding';
                }}
                className="w-full py-3.5 rounded-2xl bg-danger text-white font-bold"
              >
                Tout supprimer
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="w-full py-3.5 rounded-2xl bg-surface-3 text-white font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-muted text-xs uppercase tracking-wider font-medium mb-3">{title}</p>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-muted text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0
          ${checked ? 'bg-purple' : 'bg-surface-3'}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
