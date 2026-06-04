'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ActivityType, DeclarationFrequency, UserProfile } from '@/lib/types';
import {
  Briefcase,
  ShoppingBag,
  Layers,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Zap,
  BadgePercent,
  Check,
} from 'lucide-react';

const TOTAL_STEPS = 5;

type Step = 'welcome' | 'activity' | 'frequency' | 'acre' | 'vl';

const stepOrder: Step[] = ['welcome', 'activity', 'frequency', 'acre', 'vl'];

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [data, setData] = useState<Partial<UserProfile>>({});

  const stepIndex = stepOrder.indexOf(step);

  const next = (updates?: Partial<UserProfile>) => {
    const merged = { ...data, ...updates };
    setData(merged);
    if (stepIndex < stepOrder.length - 1) {
      setStep(stepOrder[stepIndex + 1]);
    } else {
      const profile: UserProfile = {
        activityType: merged.activityType ?? 'services',
        declarationFrequency: merged.declarationFrequency ?? 'monthly',
        hasACRE: merged.hasACRE ?? false,
        acreStartDate: merged.hasACRE ? new Date().toISOString() : undefined,
        hasVersementLiberatoire: merged.hasVersementLiberatoire ?? false,
        onboardingComplete: true,
      };
      saveProfile(profile);
      router.replace('/dashboard');
    }
  };

  const back = () => {
    if (stepIndex > 0) setStep(stepOrder[stepIndex - 1]);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar */}
      {step !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-surface-3">
          <div
            className="h-full bg-gold transition-all duration-500 ease-out"
            style={{ width: `${(stepIndex / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* Back button */}
      {stepIndex > 0 && (
        <button
          onClick={back}
          className="fixed top-5 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-white"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Step content */}
      <div className="flex-1 flex flex-col">
        {step === 'welcome' && <WelcomeStep onNext={() => next()} />}
        {step === 'activity' && (
          <ActivityStep
            value={data.activityType}
            onNext={(v) => next({ activityType: v })}
          />
        )}
        {step === 'frequency' && (
          <FrequencyStep
            value={data.declarationFrequency}
            onNext={(v) => next({ declarationFrequency: v })}
          />
        )}
        {step === 'acre' && (
          <AcreStep
            value={data.hasACRE}
            onNext={(v) => next({ hasACRE: v })}
          />
        )}
        {step === 'vl' && (
          <VLStep
            value={data.hasVersementLiberatoire}
            onNext={(v) => next({ hasVersementLiberatoire: v })}
          />
        )}
      </div>
    </div>
  );
}

/* ── Welcome ── */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-gold/30 flex items-center justify-center mb-8">
        <span className="text-gold text-3xl font-bold">C</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">
        Bienvenue sur <span className="text-gold-gradient">Copilote</span>
      </h1>
      <p className="text-muted text-base leading-relaxed max-w-xs mb-12">
        Votre activité de micro-entrepreneur enfin lisible, sans jargon comptable.
      </p>
      <div className="w-full space-y-3 mb-10 text-left">
        {[
          { icon: '📊', text: 'Suivez vos encaissements en 10 secondes' },
          { icon: '💰', text: 'Sachez exactement combien mettre de côté' },
          { icon: '📋', text: 'Préparez vos déclarations sans stress' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3">
            <span className="text-xl">{item.icon}</span>
            <span className="text-white/80 text-sm">{item.text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-transform"
      >
        Commencer <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* ── Activity Type ── */
function ActivityStep({
  value,
  onNext,
}: {
  value?: ActivityType;
  onNext: (v: ActivityType) => void;
}) {
  const [selected, setSelected] = useState<ActivityType | undefined>(value);

  const options: { type: ActivityType; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      type: 'services',
      icon: <Briefcase size={24} />,
      title: 'Prestations de services',
      desc: 'Consulting, développement, design, coaching, formation…',
    },
    {
      type: 'sales',
      icon: <ShoppingBag size={24} />,
      title: 'Vente de produits',
      desc: 'Commerce, artisanat, revente de marchandises…',
    },
    {
      type: 'mixed',
      icon: <Layers size={24} />,
      title: 'Activité mixte',
      desc: 'Vous faites les deux à la fois.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col px-5 pt-16 pb-8">
      <div className="mb-8">
        <p className="text-muted text-sm mb-1">Étape 1 / 4</p>
        <h2 className="text-2xl font-bold text-white">Quelle est votre activité ?</h2>
      </div>
      <div className="space-y-3 flex-1">
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setSelected(opt.type)}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all
              ${selected === opt.type
                ? 'bg-gold/10 border-gold'
                : 'bg-surface-2 border-border'
              }`}
          >
            <div className={`mt-0.5 ${selected === opt.type ? 'text-gold' : 'text-muted'}`}>
              {opt.icon}
            </div>
            <div>
              <p className={`font-semibold text-sm ${selected === opt.type ? 'text-gold' : 'text-white'}`}>
                {opt.title}
              </p>
              <p className="text-muted text-xs mt-0.5">{opt.desc}</p>
            </div>
            {selected === opt.type && (
              <div className="ml-auto">
                <Check size={18} className="text-gold" />
              </div>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base mt-6 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        Continuer
      </button>
    </div>
  );
}

/* ── Declaration Frequency ── */
function FrequencyStep({
  value,
  onNext,
}: {
  value?: DeclarationFrequency;
  onNext: (v: DeclarationFrequency) => void;
}) {
  const [selected, setSelected] = useState<DeclarationFrequency | undefined>(value);

  const options: { freq: DeclarationFrequency; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      freq: 'monthly',
      icon: <CalendarDays size={24} />,
      title: 'Mensuelle',
      desc: 'Vous déclarez chaque mois sur l\'URSSAF.',
    },
    {
      freq: 'quarterly',
      icon: <CalendarClock size={24} />,
      title: 'Trimestrielle',
      desc: 'Vous déclarez tous les 3 mois sur l\'URSSAF.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col px-5 pt-16 pb-8">
      <div className="mb-8">
        <p className="text-muted text-sm mb-1">Étape 2 / 4</p>
        <h2 className="text-2xl font-bold text-white">Votre rythme de déclaration</h2>
        <p className="text-muted text-sm mt-2">
          Vous pouvez retrouver cette info sur votre espace URSSAF.
        </p>
      </div>
      <div className="space-y-3 flex-1">
        {options.map((opt) => (
          <button
            key={opt.freq}
            onClick={() => setSelected(opt.freq)}
            className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all
              ${selected === opt.freq
                ? 'bg-gold/10 border-gold'
                : 'bg-surface-2 border-border'
              }`}
          >
            <div className={`mt-0.5 ${selected === opt.freq ? 'text-gold' : 'text-muted'}`}>
              {opt.icon}
            </div>
            <div>
              <p className={`font-semibold text-sm ${selected === opt.freq ? 'text-gold' : 'text-white'}`}>
                {opt.title}
              </p>
              <p className="text-muted text-xs mt-0.5">{opt.desc}</p>
            </div>
            {selected === opt.freq && (
              <div className="ml-auto">
                <Check size={18} className="text-gold" />
              </div>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base mt-6 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        Continuer
      </button>
    </div>
  );
}

/* ── ACRE ── */
function AcreStep({
  value,
  onNext,
}: {
  value?: boolean;
  onNext: (v: boolean) => void;
}) {
  const [selected, setSelected] = useState<boolean | undefined>(value);

  return (
    <div className="flex-1 flex flex-col px-5 pt-16 pb-8">
      <div className="mb-8">
        <p className="text-muted text-sm mb-1">Étape 3 / 4</p>
        <h2 className="text-2xl font-bold text-white">Bénéficiez-vous de l&apos;ACRE ?</h2>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          L&apos;ACRE est une réduction de 50 % sur vos charges sociales pendant la 1ère année.
          Elle s&apos;obtient à la création si vous étiez demandeur d&apos;emploi.
        </p>
      </div>
      <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-6 flex gap-3">
        <Zap size={18} className="text-gold mt-0.5 shrink-0" />
        <p className="text-white/60 text-xs leading-relaxed">
          Si vous avez créé votre activité récemment et étiez inscrit à Pôle Emploi,
          vous avez probablement l&apos;ACRE. Vérifiez votre email de création ou votre espace URSSAF.
        </p>
      </div>
      <div className="space-y-3 flex-1">
        {[
          { v: true, label: 'Oui, je bénéficie de l\'ACRE', sub: 'Mes charges sont réduites de moitié' },
          { v: false, label: 'Non, je ne l\'ai pas', sub: 'Taux de charges normaux' },
        ].map(({ v, label, sub }) => (
          <button
            key={String(v)}
            onClick={() => setSelected(v)}
            className={`w-full p-4 rounded-2xl border text-left transition-all
              ${selected === v ? 'bg-gold/10 border-gold' : 'bg-surface-2 border-border'}`}
          >
            <p className={`font-semibold text-sm ${selected === v ? 'text-gold' : 'text-white'}`}>
              {label}
            </p>
            <p className="text-muted text-xs mt-0.5">{sub}</p>
          </button>
        ))}
      </div>
      <button
        onClick={() => selected !== undefined && onNext(selected)}
        disabled={selected === undefined}
        className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base mt-6 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        Continuer
      </button>
    </div>
  );
}

/* ── Versement Libératoire ── */
function VLStep({
  value,
  onNext,
}: {
  value?: boolean;
  onNext: (v: boolean) => void;
}) {
  const [selected, setSelected] = useState<boolean | undefined>(value);

  return (
    <div className="flex-1 flex flex-col px-5 pt-16 pb-8">
      <div className="mb-8">
        <p className="text-muted text-sm mb-1">Étape 4 / 4</p>
        <h2 className="text-2xl font-bold text-white leading-tight">
          Versement libératoire de l&apos;impôt ?
        </h2>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          C&apos;est une option qui permet de payer votre impôt sur le revenu en même temps
          que vos charges sociales, directement sur votre CA.
        </p>
      </div>
      <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-6 flex gap-3">
        <BadgePercent size={18} className="text-gold mt-0.5 shrink-0" />
        <p className="text-white/60 text-xs leading-relaxed">
          Si vous avez coché cette option lors de la création ou via votre espace impots.gouv.fr,
          répondez oui. Sinon, dites non — l&apos;impôt sera calculé séparément.
        </p>
      </div>
      <div className="space-y-3 flex-1">
        {[
          { v: true, label: 'Oui, j\'ai opté pour le VL', sub: 'L\'impôt est inclus dans mes charges' },
          { v: false, label: 'Non, je déclare normalement', sub: 'L\'impôt sur le revenu est séparé' },
        ].map(({ v, label, sub }) => (
          <button
            key={String(v)}
            onClick={() => setSelected(v)}
            className={`w-full p-4 rounded-2xl border text-left transition-all
              ${selected === v ? 'bg-gold/10 border-gold' : 'bg-surface-2 border-border'}`}
          >
            <p className={`font-semibold text-sm ${selected === v ? 'text-gold' : 'text-white'}`}>
              {label}
            </p>
            <p className="text-muted text-xs mt-0.5">{sub}</p>
          </button>
        ))}
      </div>
      <button
        onClick={() => selected !== undefined && onNext(selected)}
        disabled={selected === undefined}
        className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base mt-6 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        Terminer la configuration
      </button>
    </div>
  );
}
