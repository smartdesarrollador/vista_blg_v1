import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
  DOCUMENT,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme =
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'orange'
  | 'teal';

interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system' | 'serif' | 'mono';
  compactMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface ThemePreferences {
  prefersDarkMode: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  private readonly STORAGE_KEY = 'blog_theme_config_v1';
  private readonly DEFAULT_CONFIG: ThemeConfig = {
    mode: 'auto',
    colorScheme: 'blue',
    fontSize: 'medium',
    fontFamily: 'system',
    compactMode: false,
    highContrast: false,
    reducedMotion: false,
  };

  // Estado reactivo
  private readonly _config = signal<ThemeConfig>(this.DEFAULT_CONFIG);
  private readonly _systemPreferences = signal<ThemePreferences>({
    prefersDarkMode: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
  });

  private readonly _isChanging = signal<boolean>(false);

  // Computed signals
  readonly config = this._config.asReadonly();
  readonly systemPreferences = this._systemPreferences.asReadonly();
  readonly isChanging = this._isChanging.asReadonly();

  // Tema efectivo (considerando auto mode)
  readonly effectiveTheme = computed(() => {
    const config = this.config();
    const systemPrefs = this.systemPreferences();

    if (config.mode === 'auto') {
      return systemPrefs.prefersDarkMode ? 'dark' : 'light';
    }

    return config.mode;
  });

  readonly isDarkMode = computed(() => this.effectiveTheme() === 'dark');
  readonly isLightMode = computed(() => this.effectiveTheme() === 'light');

  // CSS variables computadas
  readonly cssVariables = computed(() => {
    const config = this.config();
    const isDark = this.isDarkMode();

    return this.generateCSSVariables(config, isDark);
  });

  // Observable para cambios de tema
  private themeChanges$ = new BehaviorSubject<{
    previous: ThemeConfig;
    current: ThemeConfig;
    effectiveTheme: 'light' | 'dark';
  }>({
    previous: this.DEFAULT_CONFIG,
    current: this.DEFAULT_CONFIG,
    effectiveTheme: 'light',
  });

  private isBrowser: boolean;
  private mediaQueries: Map<string, MediaQueryList> = new Map();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initializeTheme();
      this.setupMediaQueryListeners();
      this.loadUserConfig();
    }
  }

  /**
   * Inicializa el tema
   */
  private initializeTheme(): void {
    this.detectSystemPreferences();
    this.applyTheme();
  }

  /**
   * Detecta las preferencias del sistema
   */
  private detectSystemPreferences(): void {
    if (!this.isBrowser) return;

    const preferences: ThemePreferences = {
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)')
        .matches,
      prefersReducedMotion: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)')
        .matches,
    };

    this._systemPreferences.set(preferences);
  }

  /**
   * Configura listeners para media queries
   */
  private setupMediaQueryListeners(): void {
    if (!this.isBrowser) return;

    // Dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueries.set('dark-mode', darkModeQuery);

    darkModeQuery.addEventListener('change', (e) => {
      this._systemPreferences.update((prefs) => ({
        ...prefs,
        prefersDarkMode: e.matches,
      }));

      if (this.config().mode === 'auto') {
        this.applyTheme();
      }
    });

    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    this.mediaQueries.set('reduced-motion', reducedMotionQuery);

    reducedMotionQuery.addEventListener('change', (e) => {
      this._systemPreferences.update((prefs) => ({
        ...prefs,
        prefersReducedMotion: e.matches,
      }));

      this.applyTheme();
    });

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    this.mediaQueries.set('high-contrast', highContrastQuery);

    highContrastQuery.addEventListener('change', (e) => {
      this._systemPreferences.update((prefs) => ({
        ...prefs,
        prefersHighContrast: e.matches,
      }));

      this.applyTheme();
    });
  }

  /**
   * Carga la configuración del usuario
   */
  private loadUserConfig(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const config = { ...this.DEFAULT_CONFIG, ...parsed };
        this._config.set(config);
        this.applyTheme();
      }
    } catch (error) {
      console.warn('Error loading theme config:', error);
    }
  }

  /**
   * Guarda la configuración del usuario
   */
  private saveUserConfig(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config()));
    } catch (error) {
      console.warn('Error saving theme config:', error);
    }
  }

  /**
   * Aplica el tema al documento
   */
  private applyTheme(): void {
    if (!this.isBrowser) return;

    this._isChanging.set(true);

    const config = this.config();
    const isDark = this.isDarkMode();
    const systemPrefs = this.systemPreferences();

    // Aplicar clases al documento
    this.applyDocumentClasses(config, isDark, systemPrefs);

    // Aplicar variables CSS
    this.applyCSSVariables();

    // Aplicar meta theme-color para mobile
    this.applyMetaThemeColor(isDark);

    // Transición suave
    setTimeout(() => {
      this._isChanging.set(false);
    }, 150);
  }

  /**
   * Aplica clases CSS al documento
   */
  private applyDocumentClasses(
    config: ThemeConfig,
    isDark: boolean,
    systemPrefs: ThemePreferences
  ): void {
    const html = this.document.documentElement;
    const body = this.document.body;

    // Limpiar clases anteriores
    html.classList.remove('light', 'dark');
    body.classList.remove(
      'theme-blue',
      'theme-green',
      'theme-purple',
      'theme-red',
      'theme-orange',
      'theme-teal',
      'font-small',
      'font-medium',
      'font-large',
      'font-system',
      'font-serif',
      'font-mono',
      'compact-mode',
      'high-contrast',
      'reduced-motion'
    );

    // Aplicar tema principal
    html.classList.add(isDark ? 'dark' : 'light');

    // Aplicar esquema de color
    body.classList.add(`theme-${config.colorScheme}`);

    // Aplicar tamaño de fuente
    body.classList.add(`font-${config.fontSize}`);

    // Aplicar familia de fuente
    body.classList.add(`font-${config.fontFamily}`);

    // Aplicar modificadores
    if (config.compactMode) {
      body.classList.add('compact-mode');
    }

    if (config.highContrast || systemPrefs.prefersHighContrast) {
      body.classList.add('high-contrast');
    }

    if (config.reducedMotion || systemPrefs.prefersReducedMotion) {
      body.classList.add('reduced-motion');
    }

    // Atributo para CSS
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
    html.setAttribute('data-color-scheme', config.colorScheme);
  }

  /**
   * Aplica variables CSS personalizadas
   */
  private applyCSSVariables(): void {
    const variables = this.cssVariables();
    const root = this.document.documentElement;

    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Genera variables CSS basadas en la configuración
   */
  private generateCSSVariables(
    config: ThemeConfig,
    isDark: boolean
  ): Record<string, string> {
    const variables: Record<string, string> = {};

    // Tamaños de fuente
    const fontSizes = {
      small: { base: '14px', scale: '0.9' },
      medium: { base: '16px', scale: '1' },
      large: { base: '18px', scale: '1.1' },
    };

    const fontSize = fontSizes[config.fontSize];
    variables['--font-size-base'] = fontSize.base;
    variables['--font-scale'] = fontSize.scale;

    // Familias de fuente
    const fontFamilies = {
      system:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", Times, serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    };

    variables['--font-family-base'] = fontFamilies[config.fontFamily];

    // Esquemas de color
    const colorSchemes = this.getColorSchemes();
    const scheme = colorSchemes[config.colorScheme];

    if (scheme) {
      Object.entries(scheme).forEach(([key, value]) => {
        variables[`--color-primary-${key}`] = value;
      });
    }

    // Espaciado en modo compacto
    if (config.compactMode) {
      variables['--spacing-scale'] = '0.8';
      variables['--line-height-scale'] = '0.9';
    } else {
      variables['--spacing-scale'] = '1';
      variables['--line-height-scale'] = '1';
    }

    // Alto contraste
    if (config.highContrast) {
      variables['--contrast-multiplier'] = '1.5';
      variables['--border-width-scale'] = '2';
    } else {
      variables['--contrast-multiplier'] = '1';
      variables['--border-width-scale'] = '1';
    }

    return variables;
  }

  /**
   * Obtiene los esquemas de color disponibles
   */
  private getColorSchemes(): Record<ColorScheme, Record<string, string>> {
    return {
      blue: {
        '50': '#eff6ff',
        '500': '#3b82f6',
        '600': '#2563eb',
        '700': '#1d4ed8',
        '900': '#1e3a8a',
      },
      green: {
        '50': '#f0fdf4',
        '500': '#22c55e',
        '600': '#16a34a',
        '700': '#15803d',
        '900': '#14532d',
      },
      purple: {
        '50': '#faf5ff',
        '500': '#a855f7',
        '600': '#9333ea',
        '700': '#7c3aed',
        '900': '#581c87',
      },
      red: {
        '50': '#fef2f2',
        '500': '#ef4444',
        '600': '#dc2626',
        '700': '#b91c1c',
        '900': '#7f1d1d',
      },
      orange: {
        '50': '#fff7ed',
        '500': '#f97316',
        '600': '#ea580c',
        '700': '#c2410c',
        '900': '#9a3412',
      },
      teal: {
        '50': '#f0fdfa',
        '500': '#14b8a6',
        '600': '#0d9488',
        '700': '#0f766e',
        '900': '#134e4a',
      },
    };
  }

  /**
   * Aplica meta theme-color para dispositivos móviles
   */
  private applyMetaThemeColor(isDark: boolean): void {
    let metaThemeColor = this.document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!metaThemeColor) {
      metaThemeColor = this.document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      this.document.head.appendChild(metaThemeColor);
    }

    const color = isDark ? '#1f2937' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }

  /**
   * Cambia el modo de tema
   */
  setThemeMode(mode: ThemeMode): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      mode,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Cambia el esquema de color
   */
  setColorScheme(colorScheme: ColorScheme): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      colorScheme,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Cambia el tamaño de fuente
   */
  setFontSize(fontSize: 'small' | 'medium' | 'large'): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      fontSize,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Cambia la familia de fuente
   */
  setFontFamily(fontFamily: 'system' | 'serif' | 'mono'): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      fontFamily,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Toggle del modo compacto
   */
  toggleCompactMode(): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      compactMode: !config.compactMode,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Toggle del alto contraste
   */
  toggleHighContrast(): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      highContrast: !config.highContrast,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Toggle del movimiento reducido
   */
  toggleReducedMotion(): void {
    const previous = this.config();

    this._config.update((config) => ({
      ...config,
      reducedMotion: !config.reducedMotion,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Toggle entre light y dark mode
   */
  toggleTheme(): void {
    const currentMode = this.config().mode;
    const currentEffective = this.effectiveTheme();

    if (currentMode === 'auto') {
      // Si está en auto, cambiar al contrario del actual
      this.setThemeMode(currentEffective === 'dark' ? 'light' : 'dark');
    } else {
      // Si no está en auto, alternar entre light y dark
      this.setThemeMode(currentMode === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * Actualiza toda la configuración
   */
  updateConfig(config: Partial<ThemeConfig>): void {
    const previous = this.config();

    this._config.update((current) => ({
      ...current,
      ...config,
    }));

    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Resetea la configuración a los valores por defecto
   */
  resetToDefault(): void {
    const previous = this.config();

    this._config.set(this.DEFAULT_CONFIG);
    this.applyTheme();
    this.saveUserConfig();
    this.emitThemeChange(previous);
  }

  /**
   * Emite cambio de tema
   */
  private emitThemeChange(previous: ThemeConfig): void {
    this.themeChanges$.next({
      previous,
      current: this.config(),
      effectiveTheme: this.effectiveTheme(),
    });
  }

  /**
   * Observable para cambios de tema
   */
  onThemeChange(): Observable<{
    previous: ThemeConfig;
    current: ThemeConfig;
    effectiveTheme: 'light' | 'dark';
  }> {
    return this.themeChanges$.asObservable();
  }

  /**
   * Obtiene los esquemas de color disponibles
   */
  getAvailableColorSchemes(): Array<{
    value: ColorScheme;
    label: string;
    color: string;
  }> {
    return [
      { value: 'blue', label: 'Azul', color: '#3b82f6' },
      { value: 'green', label: 'Verde', color: '#22c55e' },
      { value: 'purple', label: 'Púrpura', color: '#a855f7' },
      { value: 'red', label: 'Rojo', color: '#ef4444' },
      { value: 'orange', label: 'Naranja', color: '#f97316' },
      { value: 'teal', label: 'Turquesa', color: '#14b8a6' },
    ];
  }

  /**
   * Obtiene las opciones de fuente disponibles
   */
  getAvailableFontOptions(): Array<{
    value: string;
    label: string;
    preview: string;
  }> {
    return [
      { value: 'system', label: 'Sistema', preview: 'Texto del sistema' },
      { value: 'serif', label: 'Serif', preview: 'Texto con serifas' },
      { value: 'mono', label: 'Monoespaciada', preview: 'Texto monoespaciado' },
    ];
  }

  /**
   * Verifica si el navegador soporta la funcionalidad
   */
  getCapabilities(): {
    hasMediaQueries: boolean;
    hasLocalStorage: boolean;
    hasColorSchemeSupport: boolean;
    hasReducedMotionSupport: boolean;
    hasHighContrastSupport: boolean;
  } {
    if (!this.isBrowser) {
      return {
        hasMediaQueries: false,
        hasLocalStorage: false,
        hasColorSchemeSupport: false,
        hasReducedMotionSupport: false,
        hasHighContrastSupport: false,
      };
    }

    return {
      hasMediaQueries: 'matchMedia' in window,
      hasLocalStorage: 'localStorage' in window,
      hasColorSchemeSupport:
        window.matchMedia('(prefers-color-scheme)').media !== 'not all',
      hasReducedMotionSupport:
        window.matchMedia('(prefers-reduced-motion)').media !== 'not all',
      hasHighContrastSupport:
        window.matchMedia('(prefers-contrast)').media !== 'not all',
    };
  }
}
