'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, FileText, Settings } from 'lucide-react';

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Tableau' },
  { href: '/income/new', icon: PlusCircle, label: 'Encaisser' },
  { href: '/declaration', icon: FileText, label: 'Déclarer' },
  { href: '/settings', icon: Settings, label: 'Réglages' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors
                ${active ? 'text-gold' : 'text-muted'}`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                className={active ? 'text-gold' : 'text-muted'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-gold' : 'text-muted'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
