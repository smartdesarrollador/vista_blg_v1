import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ImageLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface ImageOptimizationConfig {
  /** Habilitado lazy loading */
  enableLazyLoading: boolean;
  /** Umbral de intersección para lazy loading */
  intersectionThreshold: number;
  /** Margen del root para lazy loading */
  rootMargin: string;
  /** Placeholder durante la carga */
  placeholder?: string;
  /** Blur placeholder para mejor UX */
  blurPlaceholder?: string;
  /** Tamaños responsivos */
  sizes?: string;
  /** Calidad de imagen (1-100) */
  quality: number;
  /** Formato preferido */
  format: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  /** Prioridad de carga */
  priority: 'high' | 'low' | 'auto';
}

@Directive({
  selector: '[appOptimizedImage]',
  standalone: true,
})
export class OptimizedImageDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLImageElement>);
  private platformId = inject(PLATFORM_ID);

  // Inputs para configuración
  @Input() src!: string;
  @Input() alt!: string;
  @Input() width?: number;
  @Input() height?: number;
  @Input() sizes?: string;
  @Input() priority: 'high' | 'low' | 'auto' = 'auto';
  @Input() placeholder?: string;
  @Input() blurPlaceholder?: string;
  @Input() quality: number = 75;
  @Input() format: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto' = 'auto';
  @Input() enableLazyLoading: boolean = true;
  @Input() intersectionThreshold: number = 0.1;
  @Input() rootMargin: string = '50px';

  // Estado reactivo
  private loadingState = signal<ImageLoadingState>({
    isLoading: false,
    isLoaded: false,
    hasError: false,
  });

  // Computed properties
  readonly isLoading = computed(() => this.loadingState().isLoading);
  readonly isLoaded = computed(() => this.loadingState().isLoaded);
  readonly hasError = computed(() => this.loadingState().hasError);

  private isBrowser: boolean;
  private intersectionObserver?: IntersectionObserver;
  private imageElement: HTMLImageElement;
  private originalSrc: string = '';
  private loadAttempts: number = 0;
  private maxLoadAttempts: number = 3;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.imageElement = this.elementRef.nativeElement;

    // Effect para manejar cambios de estado
    effect(() => {
      const state = this.loadingState();
      this.updateImageClasses(state);
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      // En SSR, usar la imagen directamente sin optimizaciones
      this.setupImageForSSR();
      return;
    }

    this.originalSrc = this.src;
    this.setupImageAttributes();

    if (this.enableLazyLoading && this.priority !== 'high') {
      this.setupLazyLoading();
    } else {
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  /**
   * Configuración para SSR
   */
  private setupImageForSSR(): void {
    this.imageElement.src = this.src;
    this.imageElement.alt = this.alt;

    if (this.width) {
      this.imageElement.width = this.width;
    }

    if (this.height) {
      this.imageElement.height = this.height;
    }

    if (this.sizes) {
      this.imageElement.sizes = this.sizes;
    }
  }

  /**
   * Configura atributos básicos de la imagen
   */
  private setupImageAttributes(): void {
    // Configurar alt text
    this.imageElement.alt = this.alt;

    // Configurar dimensiones si están disponibles
    if (this.width) {
      this.imageElement.width = this.width;
      this.imageElement.style.width = `${this.width}px`;
    }

    if (this.height) {
      this.imageElement.height = this.height;
      this.imageElement.style.height = `${this.height}px`;
    }

    // Configurar sizes para responsive
    if (this.sizes) {
      this.imageElement.sizes = this.sizes;
    }

    // Configurar loading attribute
    if (this.priority === 'high') {
      this.imageElement.loading = 'eager';
    } else {
      this.imageElement.loading = 'lazy';
    }

    // Configurar decode attribute para mejor performance
    this.imageElement.decoding = 'async';

    // Agregar clases CSS para estados
    this.imageElement.classList.add('optimized-image');

    // Configurar placeholder si está disponible
    if (this.placeholder || this.blurPlaceholder) {
      this.setupPlaceholder();
    }

    // Event listeners para estados de carga
    this.setupImageEventListeners();
  }

  /**
   * Configura placeholder durante la carga
   */
  private setupPlaceholder(): void {
    if (this.blurPlaceholder) {
      // Usar blur placeholder para mejor UX
      this.imageElement.style.backgroundImage = `url(${this.blurPlaceholder})`;
      this.imageElement.style.backgroundSize = 'cover';
      this.imageElement.style.backgroundPosition = 'center';
      this.imageElement.style.filter = 'blur(5px)';
    } else if (this.placeholder) {
      // Usar placeholder simple
      this.imageElement.src = this.placeholder;
    }

    this.imageElement.classList.add('has-placeholder');
  }

  /**
   * Configura lazy loading con Intersection Observer
   */
  private setupLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores sin soporte
      this.loadImage();
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.intersectionObserver?.unobserve(this.imageElement);
          }
        });
      },
      {
        threshold: this.intersectionThreshold,
        rootMargin: this.rootMargin,
      }
    );

    this.intersectionObserver.observe(this.imageElement);
  }

  /**
   * Configura event listeners para la imagen
   */
  private setupImageEventListeners(): void {
    this.imageElement.addEventListener('loadstart', () => {
      this.loadingState.update((state) => ({
        ...state,
        isLoading: true,
        hasError: false,
      }));
    });

    this.imageElement.addEventListener('load', () => {
      this.loadingState.update((state) => ({
        ...state,
        isLoading: false,
        isLoaded: true,
        hasError: false,
      }));
    });

    this.imageElement.addEventListener('error', (event) => {
      this.handleImageError(event);
    });
  }

  /**
   * Carga la imagen optimizada
   */
  private loadImage(): void {
    const optimizedSrc = this.generateOptimizedImageUrl(this.originalSrc);

    this.loadingState.update((state) => ({
      ...state,
      isLoading: true,
    }));

    // Crear una nueva imagen para precargar
    const img = new Image();

    img.onload = () => {
      // Imagen cargada exitosamente, actualizar src
      this.imageElement.src = optimizedSrc;
      this.removePlaceholder();
    };

    img.onerror = () => {
      this.handleImageError();
    };

    // Configurar srcset si hay múltiples tamaños
    if (this.sizes) {
      const srcset = this.generateSrcSet(this.originalSrc);
      img.srcset = srcset;
      this.imageElement.srcset = srcset;
    }

    img.src = optimizedSrc;
  }

  /**
   * Genera URL optimizada para la imagen
   */
  private generateOptimizedImageUrl(src: string): string {
    // Si es una URL externa, retornar tal como está
    if (src.startsWith('http')) {
      return src;
    }

    const params = new URLSearchParams();

    // Agregar calidad
    if (this.quality && this.quality !== 75) {
      params.append('q', this.quality.toString());
    }

    // Agregar formato si no es auto
    if (this.format && this.format !== 'auto') {
      params.append('f', this.format);
    }

    // Agregar dimensiones
    if (this.width) {
      params.append('w', this.width.toString());
    }

    if (this.height) {
      params.append('h', this.height.toString());
    }

    // Si hay parámetros, agregar a la URL
    if (params.toString()) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}${params.toString()}`;
    }

    return src;
  }

  /**
   * Genera srcset para responsive images
   */
  private generateSrcSet(src: string): string {
    if (!this.width) return '';

    const breakpoints = [480, 768, 1024, 1200, 1920];
    const srcsetEntries: string[] = [];

    breakpoints.forEach((width) => {
      if (width <= this.width! * 2) {
        // No generar tamaños más grandes que 2x el original
        const optimizedUrl = this.generateOptimizedImageUrl(
          src.replace(/\.(jpg|jpeg|png|webp)$/i, `_${width}w.$1`)
        );
        srcsetEntries.push(`${optimizedUrl} ${width}w`);
      }
    });

    return srcsetEntries.join(', ');
  }

  /**
   * Maneja errores de carga de imagen
   */
  private handleImageError(event?: Event): void {
    this.loadAttempts++;

    if (this.loadAttempts < this.maxLoadAttempts) {
      // Reintentar con un formato diferente
      setTimeout(() => {
        this.loadImage();
      }, 1000 * this.loadAttempts);
      return;
    }

    this.loadingState.update((state) => ({
      ...state,
      isLoading: false,
      hasError: true,
      errorMessage: 'Error al cargar la imagen',
    }));

    // Mostrar imagen de fallback si está configurada
    this.showFallbackImage();
  }

  /**
   * Muestra imagen de fallback en caso de error
   */
  private showFallbackImage(): void {
    const fallbackSrc = '/assets/images/image-placeholder.svg';
    this.imageElement.src = fallbackSrc;
    this.imageElement.alt = `${this.alt} (imagen no disponible)`;
  }

  /**
   * Remueve placeholder después de cargar la imagen
   */
  private removePlaceholder(): void {
    if (this.blurPlaceholder) {
      this.imageElement.style.backgroundImage = '';
      this.imageElement.style.filter = '';
    }

    this.imageElement.classList.remove('has-placeholder');
  }

  /**
   * Actualiza clases CSS basado en el estado
   */
  private updateImageClasses(state: ImageLoadingState): void {
    // Remover clases de estado previas
    this.imageElement.classList.remove('loading', 'loaded', 'error');

    // Agregar clase basada en el estado actual
    if (state.isLoading) {
      this.imageElement.classList.add('loading');
    } else if (state.isLoaded) {
      this.imageElement.classList.add('loaded');
    } else if (state.hasError) {
      this.imageElement.classList.add('error');
    }
  }

  /**
   * Método público para recargar imagen
   */
  reload(): void {
    this.loadAttempts = 0;
    this.loadingState.update((state) => ({
      ...state,
      isLoading: false,
      isLoaded: false,
      hasError: false,
    }));

    this.loadImage();
  }

  /**
   * Método público para obtener métricas de performance
   */
  getPerformanceMetrics(): any {
    if (!this.isBrowser) return null;

    const entries = performance.getEntriesByName(this.imageElement.src);
    if (entries.length === 0) return null;

    const entry = entries[0] as PerformanceResourceTiming;
    return {
      loadTime: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    };
  }
}
