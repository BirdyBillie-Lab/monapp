'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, isLoaded } = useStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (!profile?.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isLoaded, profile, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-bg">
      <main className="pb-20 min-h-screen overflow-y-auto no-scrollbar">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
