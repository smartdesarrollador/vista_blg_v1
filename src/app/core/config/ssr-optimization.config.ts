import { InjectionToken } from '@angular/core';

/**
 * Configuración de optimización SSR para el blog
 */
export interface SSROptimizationConfig {
  /** Rutas que deben ser prerenderizadas */
  prerenderRoutes: string[];

  /** Estrategia de hydration para componentes interactivos */
  hydrationStrategy: 'eager' | 'lazy' | 'manual';

  /** Configuración de caché para páginas */
  cacheConfig: {
    /** Tiempo de vida del caché en segundos */
    ttl: number;
    /** Estrategia de invalidación */
    invalidationStrategy: 'time' | 'content' | 'manual';
    /** Rutas que deben ser cacheadas */
    cacheableRoutes: string[];
  };

  /** Configuración de lazy loading */
  lazyLoadingConfig: {
    /** Umbral de intersección para lazy loading */
    intersectionThreshold: number;
    /** Margen para lazy loading */
    rootMargin: string;
    /** Componentes que deben usar lazy loading */
    lazyComponents: string[];
  };

  /** Configuración de bundle optimization */
  bundleOptimization: {
    /** Tamaño máximo de bundle por ruta (en KB) */
    maxBundleSize: number;
    /** Chunk splitting habilitado */
    enableChunkSplitting: boolean;
    /** Preload de recursos críticos */
    criticalResourcePreload: string[];
  };
}

/**
 * Configuración por defecto para optimización SSR
 */
export const DEFAULT_SSR_CONFIG: SSROptimizationConfig = {
  prerenderRoutes: [
    '/',
    '/about',
    '/blog',
    '/blog/search',
    '/blog/categoria/tecnologia',
    '/blog/categoria/desarrollo',
    '/blog/categoria/diseno',
    '/blog/categoria/programacion',
    '/blog/categoria/web',
  ],

  hydrationStrategy: 'lazy',

  cacheConfig: {
    ttl: 3600, // 1 hora
    invalidationStrategy: 'time',
    cacheableRoutes: ['/blog', '/blog/categoria/*', '/blog/*'],
  },

  lazyLoadingConfig: {
    intersectionThreshold: 0.1,
    rootMargin: '100px',
    lazyComponents: [
      'blog-sidebar',
      'blog-comments',
      'blog-related-posts',
      'blog-social-share',
    ],
  },

  bundleOptimization: {
    maxBundleSize: 250, // 250KB
    enableChunkSplitting: true,
    criticalResourcePreload: [
      '/assets/fonts/main.woff2',
      '/assets/css/critical.css',
    ],
  },
};

/**
 * Token de inyección para la configuración SSR
 */
export const SSR_OPTIMIZATION_CONFIG =
  new InjectionToken<SSROptimizationConfig>('SSR Optimization Configuration', {
    providedIn: 'root',
    factory: () => DEFAULT_SSR_CONFIG,
  });

/**
 * Configuración específica para diferentes entornos
 */
export const SSR_CONFIGS = {
  development: {
    ...DEFAULT_SSR_CONFIG,
    hydrationStrategy: 'eager' as const,
    cacheConfig: {
      ...DEFAULT_SSR_CONFIG.cacheConfig,
      ttl: 300, // 5 minutos en desarrollo
    },
  },

  production: {
    ...DEFAULT_SSR_CONFIG,
    hydrationStrategy: 'lazy' as const,
    cacheConfig: {
      ...DEFAULT_SSR_CONFIG.cacheConfig,
      ttl: 7200, // 2 horas en producción
    },
    bundleOptimization: {
      ...DEFAULT_SSR_CONFIG.bundleOptimization,
      maxBundleSize: 200, // Más estricto en producción
    },
  },
};

/**
 * Utilidades para trabajar con la configuración SSR
 */
export class SSROptimizationUtils {
  /**
   * Verifica si una ruta debe ser prerenderizada
   */
  static shouldPrerender(
    route: string,
    config: SSROptimizationConfig
  ): boolean {
    return config.prerenderRoutes.some((prerenderRoute) => {
      if (prerenderRoute.includes('*')) {
        const pattern = prerenderRoute.replace('*', '.*');
        return new RegExp(pattern).test(route);
      }
      return route === prerenderRoute;
    });
  }

  /**
   * Verifica si una ruta debe ser cacheada
   */
  static shouldCache(route: string, config: SSROptimizationConfig): boolean {
    return config.cacheConfig.cacheableRoutes.some((cacheableRoute) => {
      if (cacheableRoute.includes('*')) {
        const pattern = cacheableRoute.replace('*', '.*');
        return new RegExp(pattern).test(route);
      }
      return route === cacheableRoute;
    });
  }

  /**
   * Verifica si un componente debe usar lazy loading
   */
  static shouldLazyLoad(
    componentName: string,
    config: SSROptimizationConfig
  ): boolean {
    return config.lazyLoadingConfig.lazyComponents.includes(componentName);
  }

  /**
   * Obtiene la configuración para el entorno actual
   */
  static getConfigForEnvironment(
    environment: 'development' | 'production'
  ): SSROptimizationConfig {
    return SSR_CONFIGS[environment];
  }
}
