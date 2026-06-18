/**
 * Entry Point — FGTS Simulator (TypeScript)
 * Inicializa todos os adapters e configura o modal.
 */

import { createIcons, icons } from 'lucide';
import { UIAdapter } from './adapters/UIAdapter';
import { ThemeAdapter } from './adapters/ThemeAdapter';

function init(): void {
  // Theme
  const themeAdapter = new ThemeAdapter();
  themeAdapter.init([
    document.getElementById('toggleTheme'),
    document.getElementById('navbarThemeToggle'),
  ]);

  // UI
  const uiAdapter = new UIAdapter();
  uiAdapter.init();

  // Icons
  createIcons({ icons });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
