// Re-exportar interfaces principales de categorías desde blog.interface.ts
export type { BlogCategory, CategorySeoMetadata } from './blog.interface';

// Importar para uso interno
import type { BlogCategory, CategorySeoMetadata } from './blog.interface';

/**
 * Datos para crear una nueva categoría
 */
export interface CreateCategoryData {
  /** Nombre de la categoría */
  name: string;

  /** Slug personalizado (opcional, se genera automáticamente) */
  slug?: string;

  /** Descripción de la categoría */
  description: string;

  /** Color en formato hexadecimal */
  color: string;

  /** Icono (nombre de icon library) */
  icon?: string;

  /** ID de la categoría padre */
  parentId?: string;

  /** Orden de visualización */
  order?: number;

  /** Metadata SEO */
  seo: {
    metaDescription: string;
    keywords: string[];
    metaTitle?: string;
  };
}

/**
 * Datos para actualizar una categoría
 */
export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  seo?: Partial<CategorySeoMetadata>;
}

/**
 * Estadísticas de una categoría
 */
export interface CategoryStats {
  /** ID de la categoría */
  categoryId: string;

  /** Total de posts */
  totalPosts: number;

  /** Posts publicados */
  publishedPosts: number;

  /** Posts en borrador */
  draftPosts: number;

  /** Views totales de todos los posts */
  totalViews: number;

  /** Likes totales */
  totalLikes: number;

  /** Comentarios totales */
  totalComments: number;

  /** Tiempo promedio de lectura en minutos */
  averageReadingTime: number;

  /** Tasa de crecimiento (porcentaje) */
  growthRate: number;

  /** Posts más populares */
  popularPosts: {
    id: string;
    title: string;
    slug: string;
    views: number;
  }[];

  /** Tendencia (últimos 30 días) */
  trend: {
    postsGrowth: number;
    viewsGrowth: number;
    engagementGrowth: number;
  };
}

/**
 * Respuesta paginada de categorías
 */
export interface CategoriesResponse {
  /** Categorías de la página actual */
  data: BlogCategory[];

  /** Información de paginación */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Filtros para búsqueda de categorías
 */
export interface CategoryFilters {
  /** Término de búsqueda */
  search?: string;

  /** Solo categorías activas */
  activeOnly?: boolean;

  /** Solo categorías padre (sin parentId) */
  parentOnly?: boolean;

  /** ID de la categoría padre */
  parentId?: string;

  /** Color específico */
  color?: string;

  /** Ordenamiento */
  sortBy?: CategorySortBy;

  /** Dirección del ordenamiento */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Opciones de ordenamiento para categorías
 */
export type CategorySortBy =
  | 'name'
  | 'postsCount'
  | 'order'
  | 'createdAt'
  | 'updatedAt';

/**
 * Árbol jerárquico de categorías
 */
export interface CategoryTree {
  /** Categoría principal */
  category: BlogCategory;

  /** Categorías hijas */
  children: CategoryTree[];

  /** Nivel de anidamiento */
  level: number;

  /** Ruta completa de la categoría */
  path: string[];

  /** Si tiene hijos */
  hasChildren: boolean;

  /** Total de posts incluyendo subcategorías */
  totalPostsWithChildren: number;
}

/**
 * Configuración para el widget de categorías
 */
export interface CategoryWidgetConfig {
  /** Mostrar como lista */
  showAsList: boolean;

  /** Mostrar como nube de tags */
  showAsCloud: boolean;

  /** Mostrar contadores de posts */
  showPostCounts: boolean;

  /** Mostrar colores */
  showColors: boolean;

  /** Mostrar iconos */
  showIcons: boolean;

  /** Límite de categorías a mostrar */
  limit: number;

  /** Ordenamiento */
  sortBy: CategorySortBy;

  /** Solo categorías con posts */
  onlyWithPosts: boolean;

  /** Incluir subcategorías */
  includeChildren: boolean;
}

/**
 * Navegación breadcrumb para categorías
 */
export interface CategoryBreadcrumb {
  /** Elementos del breadcrumb */
  items: CategoryBreadcrumbItem[];

  /** Categoría actual */
  current: BlogCategory;

  /** URL base para las categorías */
  baseUrl: string;
}

/**
 * Item individual del breadcrumb
 */
export interface CategoryBreadcrumbItem {
  /** Nombre de la categoría */
  name: string;

  /** URL de la categoría */
  url: string;

  /** Si es la categoría actual */
  isCurrent: boolean;

  /** Nivel en la jerarquía */
  level: number;
}

/**
 * Configuración para páginas de categoría
 */
export interface CategoryPageConfig {
  /** Layout de la página */
  layout: 'grid' | 'list' | 'masonry';

  /** Posts por página */
  postsPerPage: number;

  /** Mostrar descripción de la categoría */
  showDescription: boolean;

  /** Mostrar subcategorías */
  showSubcategories: boolean;

  /** Mostrar estadísticas */
  showStats: boolean;

  /** Permitir filtros adicionales */
  allowFilters: boolean;

  /** Habilitar búsqueda */
  enableSearch: boolean;

  /** Metadatos personalizados */
  customMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Análiticas de categoría
 */
export interface CategoryAnalytics {
  /** ID de la categoría */
  categoryId: string;

  /** Período de análisis */
  period: {
    start: Date;
    end: Date;
  };

  /** Métricas principales */
  metrics: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgTimeOnPage: number;
    clickThroughRate: number;
  };

  /** Posts más populares */
  topPosts: {
    id: string;
    title: string;
    views: number;
    engagement: number;
  }[];

  /** Fuentes de tráfico */
  trafficSources: {
    source: string;
    visitors: number;
    percentage: number;
  }[];

  /** Dispositivos */
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

/**
 * Configuración de la página de archivo de categorías
 */
export interface CategoryArchiveConfig {
  /** Título de la página */
  title: string;

  /** Descripción */
  description: string;

  /** Mostrar categorías vacías */
  showEmptyCategories: boolean;

  /** Agrupar por letra */
  groupByLetter: boolean;

  /** Vista por defecto */
  defaultView: 'grid' | 'list' | 'tree';

  /** Permitir cambio de vista */
  allowViewChange: boolean;

  /** Habilitar búsqueda */
  enableSearch: boolean;

  /** Categorías por página */
  itemsPerPage: number;
}
