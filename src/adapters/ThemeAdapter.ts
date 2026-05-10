/**
 * Adapter: ThemeAdapter
 * Light/dark theme management with localStorage persistence.
 * Migrated from the original theme-manager.js to TypeScript.
 */

const THEME_KEY = 'fgts_simulator_theme';

type Theme = 'dark' | 'light';

export class ThemeAdapter {
  private toggleButton: HTMLElement | null = null;

  /** Initializes the theme manager */
  init(toggleButton: HTMLElement | null): void {
    if (!toggleButton) {
      console.error('ThemeAdapter: toggle button not provided');
      return;
    }
    this.toggleButton = toggleButton;

    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);

    toggleButton.addEventListener('click', () => {
      const current = this.getCurrentTheme();
      const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);
      this.saveTheme(newTheme);
      this.announceChange(newTheme);
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

      if (this.toggleButton) {
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        this.toggleButton.innerHTML = `<i data-lucide="${iconName}" class="icon-sm"></i>`;
        this.toggleButton.setAttribute('aria-pressed', String(theme === 'dark'));
        window.lucide?.createIcons({ nodes: [this.toggleButton] });
      }

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
