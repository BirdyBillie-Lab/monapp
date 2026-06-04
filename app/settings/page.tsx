'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { UserProfile, ActivityType, DeclarationFrequency } from '@/lib/types';
import { Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { THRESHOLDS, getACREStatus } from '@/lib/calculations';

const EMPTY_PROFILE: UserProfile = {
  activityType: 'services', declarationFrequency: 'monthly',
  hasACRE: false, hasVersementLiberatoire: false, onboardingComplete: false,
  monthlyObjective: undefined,
};

export default function SettingsPage() {
  const { profile, saveProfile } = useStore();
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<UserProfile>(profile ?? EMPTY_PROFILE);

  // Sync once when profile loads from localStorage (initial render has profile=null)
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  if (!profile) return null;

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

        {/* Profil personnel */}
        <Section title="Mon profil">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-muted text-xs uppercase tracking-widest mb-1.5">
                Prénom (pour la salutation)
              </label>
              <input
                type="text"
                placeholder="Ex : Sophie"
                value={form.name ?? ''}
                onChange={e => update({ name: e.target.value || undefined })}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-muted focus:border-purple transition-colors"
              />
            </div>
            <div>
              <label className="block text-muted text-xs uppercase tracking-widest mb-1.5">
                Objectif mensuel (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex : 4000"
                  value={form.monthlyObjective ?? ''}
                  onChange={e => update({ monthlyObjective: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 pr-8 text-white text-sm placeholder-muted focus:border-purple transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              </div>
              <p className="text-muted text-[10px] mt-1 px-1">
                Affiché sur le tableau de bord pour suivre votre progression.
              </p>
            </div>
          </div>
        </Section>

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
          <AcreSection form={form} update={update} />
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

function AcreSection({
  form,
  update,
}: {
  form: UserProfile;
  update: (p: Partial<UserProfile>) => void;
}) {
  const status = getACREStatus(form);
  const startIso = form.acreStartDate
    ? new Date(form.acreStartDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const handleToggle = (on: boolean) => {
    update({
      hasACRE: on,
      acreStartDate: on ? (form.acreStartDate ?? new Date().toISOString()) : undefined,
    });
  };

  const handleStartDate = (val: string) => {
    update({ acreStartDate: val ? new Date(val).toISOString() : undefined });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      {/* Header row with toggle */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white text-sm font-medium">ACRE (Aide à la Création)</p>
          <p className="text-muted text-xs mt-0.5">Réduction de 50% sur vos charges la 1ère année</p>
        </div>
        <button
          onClick={() => handleToggle(!form.hasACRE)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5
            ${form.hasACRE ? 'bg-purple' : 'bg-surface-3'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
            ${form.hasACRE ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Dates + status — visible when ACRE is on */}
      {form.hasACRE && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">

          {/* Start date */}
          <div>
            <label className="block text-muted text-xs uppercase tracking-widest mb-1.5">
              Date de début
            </label>
            <input
              type="date"
              value={startIso}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => handleStartDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-white text-sm focus:border-purple transition-colors [color-scheme:dark]"
            />
          </div>

          {/* End date (computed) */}
          {status.endDate && (
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">Date de fin</span>
              <span className="text-white text-sm font-medium">
                {status.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Status badge */}
          {status.isExpired ? (
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-3 py-2.5">
              <div className="w-2 h-2 rounded-full bg-muted shrink-0" />
              <div>
                <p className="text-muted text-xs font-medium">ACRE terminée</p>
                <p className="text-muted/60 text-[10px]">
                  Les cotisations sont revenues à leur taux normal.
                </p>
              </div>
            </div>
          ) : status.alertLevel === 'warning_1month' ? (
            <div className="flex items-center gap-2 bg-warning/8 border border-warning/30 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <p className="text-warning text-xs font-medium">
                Se termine dans {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''}
              </p>
            </div>
          ) : status.alertLevel === 'warning_3months' ? (
            <div className="flex items-center gap-2 bg-warning/8 border border-warning/30 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <p className="text-warning text-xs font-medium">
                Se termine dans {status.monthsRemaining} mois · préparez-vous
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-success/8 border border-success/25 rounded-xl px-3 py-2.5">
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              <p className="text-success text-xs font-medium">
                Active · encore {status.monthsRemaining} mois
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
