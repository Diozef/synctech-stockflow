/**
 * ============================================
 * MÓDULO DE NAVEGAÇÃO GLOBAL
 * ============================================
 * 
 * Este módulo controla a navegação global do sistema.
 * As rotas das telas são definidas aqui.
 * Novas abas devem ser adicionadas neste módulo.
 * 
 * Estrutura atual:
 * 1. Dashboard - Visão geral
 * 2. Estoque - Lista de produtos
 * 3. Movimentar - Entrada/Saída
 * 4. Relatórios - Análises (v2)
 * 5. Ajustes - Configurações
 * 
 * ============================================
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ArrowUpDown, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessData } from '@/hooks/useBusiness';
import { getNicheConfig } from '@/utils/nicheConfig';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { business } = useBusinessData();
  const config = getNicheConfig(business?.business_type || null);

  // Definição das 5 abas principais da navegação
  const navItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', path: '/app/dashboard' },
    { icon: Package, label: 'Estoque', path: '/app/products' },
    { icon: ArrowUpDown, label: 'Movimentar', path: '/app/movements' },
    { icon: BarChart3, label: 'Relatórios', path: '/app/reports' },
    { icon: Settings, label: 'Ajustes', path: '/app/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <item.icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium truncate",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
