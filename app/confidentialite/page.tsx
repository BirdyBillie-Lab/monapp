'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function ConfidentialitePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg px-4 pt-10 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2">
          <ChevronLeft size={18} className="text-text" />
        </button>
        <h1 className="text-xl font-bold text-text">Politique de confidentialité</h1>
      </div>

      <div className="flex flex-col gap-6 text-muted text-sm leading-relaxed max-w-prose">
        <div className="bg-surface border border-dashed border-border rounded-2xl px-5 py-8 text-center">
          <p className="text-muted text-sm">
            La politique de confidentialité (RGPD) sera publiée ici avant le lancement commercial de l&apos;application.
          </p>
        </div>

        {[
          'Responsable du traitement',
          'Données collectées',
          'Finalités du traitement',
          'Base légale',
          'Durée de conservation',
          'Vos droits (accès, rectification, suppression)',
          'Cookies',
          'Contact DPO',
        ].map(section => (
          <div key={section}>
            <p className="text-text font-semibold text-sm mb-2">{section}</p>
            <div className="h-3 bg-surface-2 rounded-full w-full mb-1.5" />
            <div className="h-3 bg-surface-2 rounded-full w-4/5 mb-1.5" />
            <div className="h-3 bg-surface-2 rounded-full w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
