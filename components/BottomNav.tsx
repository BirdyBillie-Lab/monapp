'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Clock, Settings } from 'lucide-react';

const tabs = [
  { href: '/dashboard',     icon: Home,       label: 'Dashboard'   },
  { href: '/mes-chiffres',  icon: BarChart2,   label: 'Mes chiffres' },
  { href: '/mes-recettes',  icon: Clock,       label: 'Mes recettes' },
  { href: '/settings',      icon: Settings,    label: 'Paramètres'  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border safe-bottom">
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                ${active ? 'text-purple' : 'text-muted'}`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                className={active ? 'text-purple' : 'text-muted'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-purple-light' : 'text-muted'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
