/**
 * Módulo de Gerenciamento de Tema - FGTS Simulator
 * Responsável pelo controle de tema claro/escuro com persistência
 * Projeto de Extensão Universitária - UNINTER
 */

const ThemeManager = (function() {
  'use strict';

  const THEME_KEY = 'fgts_simulator_theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  /**
   * Obtém tema salvo no localStorage ou retorna padrão
   * @returns {string} - 'dark' ou 'light'
   */
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === DARK_THEME || saved === LIGHT_THEME) {
        return saved;
      }
    } catch (e) {
      // localStorage não disponível ou erro de acesso
      console.warn('localStorage não disponível:', e);
    }

    // Padrão: tema claro
    return LIGHT_THEME;
  }

  /**
   * Salva tema no localStorage
   * @param {string} theme - 'dark' ou 'light'
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Não foi possível salvar tema:', e);
    }
  }

  /**
   * Aplica tema ao documento
   * @param {string} theme - 'dark' ou 'light'
   * @param {HTMLElement} toggleButton - Botão de alternância (opcional)
   */
  function applyTheme(theme, toggleButton) {
    if (!theme || (theme !== DARK_THEME && theme !== LIGHT_THEME)) {
      theme = LIGHT_THEME;
    }

    document.body.setAttribute('data-theme', theme);

    if (toggleButton) {
      const isDark = theme === DARK_THEME;
      toggleButton.textContent = isDark ? 'Tema Claro' : 'Tema Escuro';
      toggleButton.setAttribute('aria-pressed', String(isDark));
    }
  }

  /**
   * Inicializa o gerenciador de tema
   * @param {HTMLElement} toggleButton - Botão de alternância
   */
  function init(toggleButton) {
    if (!toggleButton) {
      console.error('ThemeManager: botão de toggle não fornecido');
      return;
    }

    // Carrega tema salvo
    const savedTheme = getSavedTheme();

    // Aplica tema inicial
    applyTheme(savedTheme, toggleButton);

    // Configura event listener
    toggleButton.addEventListener('click', function() {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;

      applyTheme(newTheme, toggleButton);
      saveTheme(newTheme);

      // Announce mudança para leitores de tela
      announceThemeChange(newTheme);
    });
  }

  /**
   * Anuncia mudança de tema para tecnologias assistivas
   * @param {string} newTheme - Novo tema aplicado
   */
  function announceThemeChange(newTheme) {
    const announcement = newTheme === DARK_THEME
      ? 'Tema escuro ativado'
      : 'Tema claro ativado';

    // Cria região live temporária se não existir
    let liveRegion = document.getElementById('theme-live-region');

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'theme-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = announcement;

    // Limpa após anúncio
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Retorna tema atual
   * @returns {string} - 'dark' ou 'light'
   */
  function getCurrentTheme() {
    return document.body.getAttribute('data-theme') || LIGHT_THEME;
  }

  // API pública do módulo
  return {
    init,
    applyTheme,
    getCurrentTheme,
    getSavedTheme,
    DARK_THEME,
    LIGHT_THEME
  };
})();

// Export para ambientes que suportam modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}