'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { profile, isLoaded } = useStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (!profile?.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/dashboard');
    }
  }, [isLoaded, profile, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
