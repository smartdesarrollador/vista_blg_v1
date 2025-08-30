import {
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import {
  SSROptimizationConfig,
  SSR_OPTIMIZATION_CONFIG,
  SSROptimizationUtils,
} from '../config/ssr-optimization.config';

interface HydrationState {
  isHydrated: boolean;
  hydrationTime: number;
  componentStatus: Map<string, boolean>;
}

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  hydrationTime: number;
}

@Injectable({
  providedIn: 'root',
})
export class SSROptimizationService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private config = inject(SSR_OPTIMIZATION_CONFIG);

  // Signals para estado reactivo
  private hydrationState = signal<HydrationState>({
    isHydrated: false,
    hydrationTime: 0,
    componentStatus: new Map(),
  });

  private performanceMetrics = signal<PerformanceMetrics>({
    hydrationTime: 0,
  });

  private currentRoute = signal<string>('');

  // Computed signals
  readonly isHydrated = computed(() => this.hydrationState().isHydrated);
  readonly hydrationProgress = computed(() => {
    const state = this.hydrationState();
    const total = state.componentStatus.size;
    const hydrated = Array.from(state.componentStatus.values()).filter(
      Boolean
    ).length;
    return total > 0 ? (hydrated / total) * 100 : 0;
  });

  readonly shouldPrerender = computed(() => {
    const route = this.currentRoute();
    return SSROptimizationUtils.shouldPrerender(route, this.config);
  });

  readonly shouldCache = computed(() => {
    const route = this.currentRoute();
    return SSROptimizationUtils.shouldCache(route, this.config);
  });

  private isBrowser: boolean;
  private hydrationStartTime = 0;
  private intersectionObserver?: IntersectionObserver;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.initializeRouteTracking();
      this.initializeHydrationTracking();
      this.initializePerformanceTracking();
      this.setupIntersectionObserver();
    }
  }

  /**
   * Inicializa el seguimiento de rutas
   */
  private initializeRouteTracking(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => (event as NavigationEnd).url),
        startWith(this.router.url)
      )
      .subscribe((url) => {
        this.currentRoute.set(url);
      });
  }

  /**
   * Inicializa el seguimiento de hydration
   */
  private initializeHydrationTracking(): void {
    if (!this.isBrowser) return;

    this.hydrationStartTime = performance.now();

    // Detectar cuando Angular ha terminado de hidratarse
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const hydrationTime = performance.now() - this.hydrationStartTime;
        this.hydrationState.update((state) => ({
          ...state,
          isHydrated: true,
          hydrationTime,
        }));

        this.performanceMetrics.update((metrics) => ({
          ...metrics,
          hydrationTime,
        }));
      });
    });
  }

  /**
   * Inicializa el seguimiento de performance
   */
  private initializePerformanceTracking(): void {
    if (!this.isBrowser || !('PerformanceObserver' in window)) return;

    try {
      // Observar métricas de Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.performanceMetrics.update((metrics) => ({
                  ...metrics,
                  fcp: entry.startTime,
                }));
              }
              break;

            case 'largest-contentful-paint':
              this.performanceMetrics.update((metrics) => ({
                ...metrics,
                lcp: entry.startTime,
              }));
              break;

            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                this.performanceMetrics.update((metrics) => ({
                  ...metrics,
                  cls: (metrics.cls || 0) + (entry as any).value,
                }));
              }
              break;

            case 'first-input':
              this.performanceMetrics.update((metrics) => ({
                ...metrics,
                fid: (entry as any).processingStart - entry.startTime,
              }));
              break;
          }
        });
      });

      // Observar diferentes tipos de entradas
      this.performanceObserver.observe({ entryTypes: ['paint'] });
      this.performanceObserver.observe({
        entryTypes: ['largest-contentful-paint'],
      });
      this.performanceObserver.observe({ entryTypes: ['layout-shift'] });
      this.performanceObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Error setting up performance observer:', error);
    }
  }

  /**
   * Configura el Intersection Observer para lazy loading
   */
  private setupIntersectionObserver(): void {
    if (!this.isBrowser || !('IntersectionObserver' in window)) return;

    const { intersectionThreshold, rootMargin } = this.config.lazyLoadingConfig;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const componentName = element.getAttribute('data-component');

            if (componentName) {
              this.hydrateComponent(componentName);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        threshold: intersectionThreshold,
        rootMargin,
      }
    );
  }

  /**
   * Registra un componente para hydration
   */
  registerComponent(componentName: string, element?: HTMLElement): void {
    if (!this.isBrowser) return;

    this.hydrationState.update((state) => {
      const newStatus = new Map(state.componentStatus);
      newStatus.set(componentName, false);
      return { ...state, componentStatus: newStatus };
    });

    // Si el componente debe usar lazy loading, agregarlo al observer
    if (
      SSROptimizationUtils.shouldLazyLoad(componentName, this.config) &&
      element
    ) {
      element.setAttribute('data-component', componentName);
      this.intersectionObserver?.observe(element);
    } else {
      // Hydrate inmediatamente si no es lazy
      this.hydrateComponent(componentName);
    }
  }

  /**
   * Marca un componente como hidratado
   */
  hydrateComponent(componentName: string): void {
    this.hydrationState.update((state) => {
      const newStatus = new Map(state.componentStatus);
      newStatus.set(componentName, true);
      return { ...state, componentStatus: newStatus };
    });
  }

  /**
   * Preload de recursos críticos
   */
  preloadCriticalResources(): void {
    if (!this.isBrowser) return;

    const { criticalResourcePreload } = this.config.bundleOptimization;

    criticalResourcePreload.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      // Determinar el tipo de recurso
      if (resource.endsWith('.woff2') || resource.endsWith('.woff')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Obtiene métricas de performance actuales
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics();
  }

  /**
   * Obtiene estadísticas de hydration
   */
  getHydrationStats() {
    const state = this.hydrationState();
    return {
      isHydrated: state.isHydrated,
      hydrationTime: state.hydrationTime,
      totalComponents: state.componentStatus.size,
      hydratedComponents: Array.from(state.componentStatus.values()).filter(
        Boolean
      ).length,
      progress: this.hydrationProgress(),
    };
  }

  /**
   * Verifica si el sitio cumple con Core Web Vitals
   */
  checkCoreWebVitals(): { passed: boolean; details: any } {
    const metrics = this.performanceMetrics();

    const thresholds = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      cls: 0.1, // 0.1
      fid: 100, // 100ms
    };

    const results = {
      fcp: metrics.fcp ? metrics.fcp <= thresholds.fcp : null,
      lcp: metrics.lcp ? metrics.lcp <= thresholds.lcp : null,
      cls: metrics.cls !== undefined ? metrics.cls <= thresholds.cls : null,
      fid: metrics.fid ? metrics.fid <= thresholds.fid : null,
    };

    const passed = Object.values(results).every(
      (result) => result === null || result === true
    );

    return {
      passed,
      details: {
        results,
        metrics,
        thresholds,
      },
    };
  }

  /**
   * Cleanup al destruir el servicio
   */
  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.performanceObserver?.disconnect();
  }
}
