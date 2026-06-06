'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { Check, BarChart2, Bell, FileText, Lock, Heart, Shield } from 'lucide-react';
import Image from 'next/image';

// ── Hardcoded star positions to avoid hydration mismatch ──────────────────────
const STARS = [
  { top: 4,  left: 8,  s: 1.5 }, { top: 7,  left: 22, s: 1   }, { top: 3,  left: 38, s: 2   },
  { top: 11, left: 52, s: 1   }, { top: 6,  left: 67, s: 1.5 }, { top: 2,  left: 80, s: 1   },
  { top: 9,  left: 91, s: 1.5 }, { top: 14, left: 14, s: 1   }, { top: 18, left: 29, s: 2   },
  { top: 13, left: 44, s: 1   }, { top: 20, left: 60, s: 1.5 }, { top: 16, left: 75, s: 1   },
  { top: 22, left: 88, s: 2   }, { top: 25, left: 5,  s: 1   }, { top: 28, left: 19, s: 1.5 },
  { top: 24, left: 33, s: 1   }, { top: 30, left: 48, s: 2   }, { top: 26, left: 70, s: 1   },
  { top: 33, left: 83, s: 1.5 }, { top: 36, left: 10, s: 1   }, { top: 1,  left: 95, s: 1.5 },
  { top: 8,  left: 57, s: 1   }, { top: 19, left: 3,  s: 1.5 }, { top: 31, left: 96, s: 1   },
];

// ── Sparkle icon ──────────────────────────────────────────────────────────────
function SparkleIcon() {
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA, #C4B5FD)', boxShadow: '0 0 30px rgba(139,92,246,0.5)' }}>
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
        <path d="M12 2 L13.5 9.5 L21 12 L13.5 14.5 L12 22 L10.5 14.5 L3 12 L10.5 9.5 Z" />
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
    <div className="min-h-screen" style={{ background: '#080818', color: '#F0F0F0' }}>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 max-w-4xl mx-auto">
        <div className="flex flex-col items-center mx-auto">
          <SparkleIcon />
          <p className="text-white font-bold text-xl mt-2">Copilote</p>
          <p className="text-purple-light text-xs mt-0.5" style={{ color: '#A78BFA' }}>Votre activité, en toute clarté.</p>
        </div>
        <Link href="/dashboard"
          className="absolute right-6 top-8 px-4 py-2 rounded-xl text-sm font-medium border text-white transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
          Se connecter
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-6 pb-10 max-w-4xl mx-auto">
        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white pointer-events-none"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.s, height: s.s, opacity: 0.4 }} />
        ))}

        <div className="relative flex flex-row items-center gap-4">
          {/* Text */}
          <div className="flex-1 z-10 min-w-0">
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3">
              L&apos;allié de votre activité,{' '}
              enfin <span style={{ color: '#A78BFA' }}>sans stress.</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base leading-relaxed mb-2">
              Copilote s&apos;occupe de vos chiffres, de vos déclarations et de vos rappels importants.
            </p>
            <p className="font-medium italic text-sm mb-5" style={{ color: '#A78BFA' }}>
              Vous gardez le cap, on s&apos;occupe du reste.
            </p>
            <div className="flex flex-row gap-2 mb-4">
              <Link href="/onboarding"
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white text-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
                Essayer gratuitement
              </Link>
              <Link href="#features"
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white text-center border"
                style={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)' }}>
                Découvrir Copilote
              </Link>
            </div>
            {/* Trust */}
            <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/50">
              <span className="flex items-center gap-1"><Check size={10} style={{ color: '#A78BFA' }} /> Sans engagement</span>
              <span className="flex items-center gap-1"><Lock size={10} style={{ color: '#A78BFA' }} /> Données sécurisées</span>
              <span className="flex items-center gap-1"><Heart size={10} style={{ color: '#A78BFA' }} /> Pour les indépendants</span>
            </div>
          </div>

          {/* Lighthouse — right side, always visible */}
          <div className="relative shrink-0 w-36 h-52 md:w-96 md:h-[480px]">
            <Image
              src="/Lighthouse.png"
              alt=""
              width={600}
              height={800}
              className="w-full h-full object-contain"
              priority
            />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(8,8,24,0.2)' }} />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-5 py-10 max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-6">
          Tout ce qu&apos;il vous faut, rien que l&apos;essentiel.
        </h2>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-3">
          {[
            {
              icon: <BarChart2 size={20} />,
              title: 'Vos chiffres à jour, en automatique',
              desc: 'Prestations, dépenses, TVA… Copilote calcule et classe tout pour vous.',
            },
            {
              icon: <Bell size={20} />,
              title: 'Rappels au bon moment',
              desc: 'Plus de date limite oubliée. Copilote vous prévient à temps, toujours.',
            },
            {
              icon: <FileText size={20} />,
              title: 'Déclarations prêtes, sans prise de tête',
              desc: 'ACRE, URSSAF, TVA… Copilote prépare et vérifie pour vous.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-4 flex flex-row md:flex-col gap-3 items-start"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.2)' }}>
                <span style={{ color: '#A78BFA' }}>{f.icon}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-snug mb-1">{f.title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="rounded-2xl p-6 border-l-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeftColor: '#7C3AED', borderLeftWidth: 4 }}>
          <p className="text-white/80 text-sm leading-relaxed italic">
            &ldquo;Je déclare toujours à la dernière minute parce que je ne savais jamais ce que j&apos;étais censée mettre. Maintenant je copie-colle les chiffres.&rdquo;
          </p>
          <p className="text-white/40 text-xs">Léa, tatoueuse indépendante</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-5 py-10 max-w-4xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
          Choisissez la formule qui vous ressemble.
        </h2>
        <div className="grid grid-cols-2 gap-3">

          {/* Free */}
          <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-white font-bold text-base md:text-lg">Gratuit</p>
              <p className="text-white font-bold text-3xl md:text-4xl mt-1">0€</p>
              <p className="text-white/40 text-xs md:text-sm">pour toujours</p>
            </div>
            <div className="flex flex-col gap-2">
              {['30 recettes/mois', 'Calculs URSSAF', 'Alertes ACRE', '1 export/mois'].map(f => (
                <div key={f} className="flex items-start gap-1.5">
                  <Check size={12} className="mt-0.5 shrink-0" style={{ color: '#A78BFA' }} />
                  <span className="text-white/70 text-xs md:text-sm">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding"
              className="mt-auto w-full py-2.5 rounded-xl text-xs md:text-sm font-bold text-center border text-white"
              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
              Commencer
            </Link>
          </div>

          {/* Sérénité */}
          <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-3 relative"
            style={{ background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(139,92,246,0.6)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
              La plus choisie
            </div>
            <div>
              <p className="text-white font-bold text-base md:text-lg">Sérénité</p>
              <p className="text-white font-bold text-3xl md:text-4xl mt-1">4,99€</p>
              <p className="text-white/40 text-xs md:text-sm">/ mois ou 39€/an</p>
            </div>
            <div className="flex flex-col gap-2">
              {['Recettes illimitées', 'Exports illimités', 'Simulateur', 'Notifs perso.', 'Stats avancées'].map(f => (
                <div key={f} className="flex items-start gap-1.5">
                  <Check size={12} className="mt-0.5 shrink-0" style={{ color: '#A78BFA' }} />
                  <span className="text-white/80 text-xs md:text-sm">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding"
              className="mt-auto w-full py-2.5 rounded-xl text-xs md:text-sm font-bold text-center text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
              Choisir Sérénité
            </Link>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          Offre de lancement : accès Sérénité à vie pour 29€* une seule fois.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 border-t max-w-4xl mx-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/30 mb-6">
          <span className="flex items-center gap-1.5"><Heart size={12} /> Conçu avec des indépendants</span>
          <span className="flex items-center gap-1.5"><Shield size={12} /> Hébergé en France</span>
          <span className="flex items-center gap-1.5"><Lock size={12} /> Vos données vous appartiennent</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-white/25">
          <Link href="/cgv" className="hover:text-white/50 transition-colors">CGV</Link>
          <span>·</span>
          <Link href="/confidentialite" className="hover:text-white/50 transition-colors">Politique de confidentialité</Link>
        </div>
      </footer>

    </div>
  );
}
