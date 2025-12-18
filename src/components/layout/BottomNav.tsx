import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ArrowUpDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { getNicheConfig } from '@/utils/nicheConfig';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessType } = useBusiness();
  const config = getNicheConfig(businessType);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: Package, label: config?.labels.products || 'Produtos', path: '/products' },
    { icon: ArrowUpDown, label: 'Movimentar', path: '/movements' },
    { icon: Settings, label: 'Ajustes', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon 
                className={cn(
                  "w-6 h-6 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
