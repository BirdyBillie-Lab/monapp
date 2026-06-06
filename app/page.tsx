'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { ChevronRight, BookOpen, Calculator, ShieldCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { profile, isLoaded } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (profile?.onboardingComplete) {
      router.replace('/dashboard');
    } else {
      setReady(true);
    }
  }, [isLoaded, profile, router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">

        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }}>
            <span className="text-white text-3xl font-bold">C</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-bg" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-text mb-3 leading-tight">
          Copilote
        </h1>
        <p className="text-muted text-base leading-relaxed max-w-xs mb-10">
          Gérez votre activité de micro-entrepreneur sans stress ni jargon comptable.
        </p>

        {/* Features */}
        <div className="w-full max-w-sm flex flex-col gap-3 mb-12 text-left">
          {[
            { icon: <BookOpen size={18} />, title: 'Journal de recettes', desc: 'Enregistrez chaque recette et tenez votre livre à jour' },
            { icon: <Calculator size={18} />, title: 'Charges calculées', desc: 'Sachez exactement combien mettre de côté pour l\'URSSAF' },
            { icon: <ShieldCheck size={18} />, title: 'Prêt en cas de contrôle', desc: 'Exportez votre livre des recettes en PDF ou CSV à tout moment' },
          ].map((item) => (
            <div key={item.title}
              className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                <span className="text-purple-light">{item.icon}</span>
              </div>
              <div>
                <p className="text-text text-sm font-semibold">{item.title}</p>
                <p className="text-muted text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Link href="/onboarding"
            className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: '0 4px 24px rgba(139,92,246,0.4)' }}>
            Créer mon espace
            <ChevronRight size={18} strokeWidth={2.5} />
          </Link>

          <Link href="/dashboard"
            className="w-full py-4 rounded-2xl font-bold text-base text-center transition-colors"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}>
            Se connecter
          </Link>
        </div>
      </div>


    </div>
  );
}
