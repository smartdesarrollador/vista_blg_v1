import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import {
  ThemeService,
  ThemeMode,
  ColorScheme,
} from '../../core/services/theme.service';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);

  // Inputs
  @Input() variant: 'button' | 'dropdown' | 'panel' | 'mini' = 'button';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showLabel: boolean = true;
  @Input() showColorSchemes: boolean = false;
  @Input() showAdvancedOptions: boolean = false;
  @Input() position: 'left' | 'right' | 'center' = 'right';

  // Outputs
  @Output() themeChanged = new EventEmitter<{
    mode: ThemeMode;
    colorScheme: ColorScheme;
    effectiveTheme: 'light' | 'dark';
  }>();

  // ViewChild para dropdown
  @ViewChild('dropdownContent') dropdownContent!: ElementRef;

  // Estado del componente
  private readonly _isOpen = signal<boolean>(false);
  private readonly _isAnimating = signal<boolean>(false);

  readonly isOpen = this._isOpen.asReadonly();
  readonly isAnimating = this._isAnimating.asReadonly();

  // Estado del tema
  readonly themeConfig = this.themeService.config;
  readonly effectiveTheme = this.themeService.effectiveTheme;
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly systemPreferences = this.themeService.systemPreferences;
  readonly isChanging = this.themeService.isChanging;

  // Opciones de tema
  readonly themeOptions: ThemeOption[] = [
    {
      value: 'light',
      label: 'Claro',
      icon: 'sun',
      description: 'Tema claro',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      icon: 'moon',
      description: 'Tema oscuro',
    },
    {
      value: 'auto',
      label: 'Auto',
      icon: 'auto',
      description: 'Seguir sistema',
    },
  ];

  // Esquemas de color disponibles
  readonly colorSchemes = computed(() =>
    this.themeService.getAvailableColorSchemes()
  );
  readonly fontOptions = computed(() =>
    this.themeService.getAvailableFontOptions()
  );

  // Opción actual seleccionada
  readonly currentThemeOption = computed(() => {
    const mode = this.themeConfig().mode;
    return (
      this.themeOptions.find((option) => option.value === mode) ||
      this.themeOptions[0]
    );
  });

  // Classes CSS computadas
  readonly containerClasses = computed(() => {
    const classes = ['theme-toggle'];

    classes.push(`variant-${this.variant}`);
    classes.push(`size-${this.size}`);
    classes.push(`position-${this.position}`);

    if (this.isOpen()) classes.push('is-open');
    if (this.isAnimating()) classes.push('is-animating');
    if (this.isChanging()) classes.push('is-changing');

    return classes.join(' ');
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Escuchar cambios de tema
    this.themeService
      .onThemeChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((change) => {
        this.themeChanged.emit({
          mode: change.current.mode,
          colorScheme: change.current.colorScheme,
          effectiveTheme: change.effectiveTheme,
        });
      });

    // Cerrar dropdown al hacer click fuera
    if (this.variant === 'dropdown' || this.variant === 'panel') {
      document.addEventListener('click', this.onDocumentClick.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  /**
   * Toggle simple entre light/dark mode
   */
  onToggleTheme(): void {
    if (this.variant === 'button' || this.variant === 'mini') {
      this.themeService.toggleTheme();
    } else {
      this.toggleDropdown();
    }
  }

  /**
   * Cambia a un modo específico de tema
   */
  onSelectThemeMode(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);

    if (this.variant === 'dropdown') {
      this.closeDropdown();
    }
  }

  /**
   * Cambia el esquema de color
   */
  onSelectColorScheme(colorScheme: ColorScheme): void {
    this.themeService.setColorScheme(colorScheme);
  }

  /**
   * Cambia el tamaño de fuente
   */
  onChangeFontSize(fontSize: 'small' | 'medium' | 'large'): void {
    this.themeService.setFontSize(fontSize);
  }

  /**
   * Cambia la familia de fuente
   */
  onChangeFontFamily(fontFamily: 'system' | 'serif' | 'mono'): void {
    this.themeService.setFontFamily(fontFamily);
  }

  /**
   * Toggle del modo compacto
   */
  onToggleCompactMode(): void {
    this.themeService.toggleCompactMode();
  }

  /**
   * Toggle del alto contraste
   */
  onToggleHighContrast(): void {
    this.themeService.toggleHighContrast();
  }

  /**
   * Toggle del movimiento reducido
   */
  onToggleReducedMotion(): void {
    this.themeService.toggleReducedMotion();
  }

  /**
   * Resetea configuración a defaults
   */
  onResetToDefault(): void {
    this.themeService.resetToDefault();

    if (this.variant === 'dropdown' || this.variant === 'panel') {
      this.closeDropdown();
    }
  }

  /**
   * Toggle del dropdown
   */
  private toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Abre el dropdown
   */
  private openDropdown(): void {
    this._isAnimating.set(true);
    this._isOpen.set(true);

    setTimeout(() => {
      this._isAnimating.set(false);
    }, 200);
  }

  /**
   * Cierra el dropdown
   */
  private closeDropdown(): void {
    this._isAnimating.set(true);

    setTimeout(() => {
      this._isOpen.set(false);
      this._isAnimating.set(false);
    }, 150);
  }

  /**
   * Maneja clicks fuera del componente
   */
  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const container = target.closest('.theme-toggle');

    if (!container && this.isOpen()) {
      this.closeDropdown();
    }
  }

  /**
   * Obtiene el ícono SVG para una opción de tema
   */
  getThemeIcon(iconName: string): string {
    const icons: Record<string, string> = {
      sun: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>`,
      moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/></svg>`,
      auto: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.25 16.22a6.937 6.937 0 01-9.47-9.47 7.451 7.451 0 1011.5 9.414.75.75 0 00.969-.969 7.5 7.5 0 00-2.717-2.717zM3.177 5.25a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H4.677a.75.75 0 01-.75-.75zm13.5 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"/></svg>`,
      palette: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM15.75 8.25a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zM8.25 10.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zM9.75 15.75a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zM16.5 13.5a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"/></svg>`,
    };

    return icons[iconName] || icons['auto'];
  }

  /**
   * Obtiene el texto del botón según el estado actual
   */
  getButtonText(): string {
    if (this.variant === 'mini') return '';

    if (!this.showLabel) return '';

    const current = this.currentThemeOption();
    return current.label;
  }

  /**
   * Obtiene el ícono del botón según el estado actual
   */
  getButtonIcon(): string {
    const current = this.currentThemeOption();
    return this.getThemeIcon(current.icon);
  }

  /**
   * Verifica si un esquema de color está activo
   */
  isColorSchemeActive(colorScheme: ColorScheme): boolean {
    return this.themeConfig().colorScheme === colorScheme;
  }

  /**
   * Verifica si un modo está activo
   */
  isThemeModeActive(mode: ThemeMode): boolean {
    return this.themeConfig().mode === mode;
  }

  /**
   * TrackBy function para optimización de ngFor
   */
  trackByValue(index: number, item: any): any {
    return item.value;
  }
}
