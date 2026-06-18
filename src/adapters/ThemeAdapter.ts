/**
 * Adapter: ThemeAdapter
 * Light/dark theme management with localStorage persistence.
 * Migrated from the original theme-manager.js to TypeScript.
 */

import { createIcons } from 'lucide';

const THEME_KEY = 'fgts_simulator_theme';

type Theme = 'dark' | 'light';

export class ThemeAdapter {
  private toggleButtons: HTMLElement[] = [];

  /** Initializes the theme manager */
  init(toggleButtons: HTMLElement | Array<HTMLElement | null> | null): void {
    const buttons = Array.isArray(toggleButtons) ? toggleButtons : [toggleButtons];
    this.toggleButtons = buttons.filter((button): button is HTMLElement => button !== null);

    if (this.toggleButtons.length === 0) {
      console.error('ThemeAdapter: toggle buttons not provided');
      return;
    }

    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);

    this.toggleButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const current = this.getCurrentTheme();
        const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
        this.announceChange(newTheme);
      });
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.hasSavedPreference()) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  private getSavedTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* localStorage unavailable */
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* localStorage unavailable */
    }
  }

  private hasSavedPreference(): boolean {
    try {
      return localStorage.getItem(THEME_KEY) !== null;
    } catch {
      return false;
    }
  }

  private applyTheme(theme: Theme): void {
    const overlay = document.getElementById('theme-fade-overlay');

    const apply = () => {
      document.documentElement.setAttribute('data-theme', theme);

      const iconName = theme === 'dark' ? 'sun' : 'moon';
      this.toggleButtons.forEach((button) => {
        button.textContent = '';
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', iconName);
        icon.className = 'icon-sm';
        button.appendChild(icon);
        button.setAttribute('aria-pressed', String(theme === 'dark'));
      });
      createIcons();

      if (overlay) {
        requestAnimationFrame(() => {
          overlay.classList.remove('active');
        });
      }
    };

    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => apply(), 100);
    } else {
      apply();
    }
  }

  getCurrentTheme(): Theme {
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
  }

  private announceChange(theme: Theme): void {
    const msg = theme === 'dark' ? 'Dark theme activated' : 'Light theme activated';

    let region = document.getElementById('theme-live-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'theme-live-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }

    region.textContent = msg;
    setTimeout(() => {
      region!.textContent = '';
    }, 1000);
  }
}
