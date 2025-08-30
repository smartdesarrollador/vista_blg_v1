// Re-exportar interfaces principales de autores desde blog.interface.ts
export type { BlogAuthor, AuthorSocialLinks } from './blog.interface';

// Importar para uso interno
import type { BlogAuthor, AuthorSocialLinks } from './blog.interface';

/**
 * Datos para crear un nuevo autor
 */
export interface CreateAuthorData {
  /** Nombre completo del autor */
  name: string;

  /** Slug personalizado (opcional, se genera automáticamente) */
  slug?: string;

  /** Email del autor */
  email: string;

  /** Biografía */
  bio: string;

  /** URL del avatar */
  avatar?: string;

  /** Enlaces de redes sociales */
  socialLinks?: Partial<AuthorSocialLinks>;
}

/**
 * Datos para actualizar un autor
 */
export interface UpdateAuthorData {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Partial<AuthorSocialLinks>;
  isActive?: boolean;
}

/**
 * Estadísticas detalladas de un autor
 */
export interface AuthorStats {
  /** ID del autor */
  authorId: string;

  /** Total de posts */
  totalPosts: number;

  /** Posts publicados */
  publishedPosts: number;

  /** Posts en borrador */
  draftPosts: number;

  /** Total de vistas en todos sus posts */
  totalViews: number;

  /** Total de likes */
  totalLikes: number;

  /** Total de comentarios */
  totalComments: number;

  /** Promedio de vistas por post */
  avgViewsPerPost: number;

  /** Engagement rate */
  engagementRate: number;

  /** Posts más populares */
  topPosts: {
    id: string;
    title: string;
    slug: string;
    views: number;
    likes: number;
    publishedAt: Date;
  }[];

  /** Actividad reciente */
  recentActivity: {
    lastPostDate?: Date;
    postsThisMonth: number;
    postsThisYear: number;
  };

  /** Categorías más utilizadas */
  topCategories: {
    categoryId: string;
    categoryName: string;
    postCount: number;
  }[];

  /** Tags más utilizados */
  topTags: {
    tag: string;
    count: number;
  }[];
}

/**
 * Perfil extendido del autor
 */
export interface AuthorProfile extends BlogAuthor {
  /** Estadísticas del autor */
  stats: AuthorStats;

  /** Posts recientes */
  recentPosts: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    publishedAt: Date;
    views: number;
    likes: number;
  }[];

  /** Seguidores (si aplicable) */
  followers?: number;

  /** Siguiendo (si aplicable) */
  following?: number;

  /** Configuración de perfil */
  profileConfig: AuthorProfileConfig;
}

/**
 * Configuración del perfil del autor
 */
export interface AuthorProfileConfig {
  /** Si el perfil es público */
  isPublic: boolean;

  /** Si mostrar estadísticas */
  showStats: boolean;

  /** Si mostrar posts recientes */
  showRecentPosts: boolean;

  /** Si mostrar enlaces sociales */
  showSocialLinks: boolean;

  /** Si permitir contacto directo */
  allowContact: boolean;

  /** Email de contacto público */
  publicEmail?: string;

  /** Biografía extendida */
  extendedBio?: string;

  /** Especialidades/expertise */
  expertise: string[];

  /** Ubicación */
  location?: string;

  /** Zona horaria */
  timezone?: string;
}

/**
 * Respuesta paginada de autores
 */
export interface AuthorsResponse {
  /** Autores de la página actual */
  data: BlogAuthor[];

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
 * Filtros para búsqueda de autores
 */
export interface AuthorFilters {
  /** Término de búsqueda */
  search?: string;

  /** Solo autores activos */
  activeOnly?: boolean;

  /** Con posts publicados */
  withPublishedPosts?: boolean;

  /** Registrados en un período */
  registeredFrom?: Date;
  registeredTo?: Date;

  /** Ordenamiento */
  sortBy?: AuthorSortBy;

  /** Dirección del ordenamiento */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Opciones de ordenamiento para autores
 */
export type AuthorSortBy =
  | 'name'
  | 'joinedAt'
  | 'postsCount'
  | 'totalViews'
  | 'totalLikes'
  | 'lastActivity';

/**
 * Configuración para el widget de autores
 */
export interface AuthorWidgetConfig {
  /** Número de autores a mostrar */
  limit: number;

  /** Mostrar avatares */
  showAvatars: boolean;

  /** Mostrar biografía corta */
  showBio: boolean;

  /** Mostrar contadores de posts */
  showPostCounts: boolean;

  /** Mostrar enlaces sociales */
  showSocialLinks: boolean;

  /** Solo autores con posts recientes */
  recentAuthorsOnly: boolean;

  /** Período para "reciente" (días) */
  recentPeriodDays: number;

  /** Ordenamiento */
  sortBy: AuthorSortBy;

  /** Layout del widget */
  layout: 'list' | 'grid' | 'compact';
}

/**
 * Configuración para páginas de autor
 */
export interface AuthorPageConfig {
  /** Layout de la página */
  layout: 'grid' | 'list' | 'timeline';

  /** Posts por página */
  postsPerPage: number;

  /** Mostrar biografía completa */
  showFullBio: boolean;

  /** Mostrar estadísticas */
  showStats: boolean;

  /** Mostrar enlaces sociales */
  showSocialLinks: boolean;

  /** Permitir filtros de posts */
  allowPostFilters: boolean;

  /** Habilitar búsqueda en posts del autor */
  enableSearch: boolean;

  /** Mostrar información de contacto */
  showContactInfo: boolean;

  /** Metadatos personalizados */
  customMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Análiticas del autor
 */
export interface AuthorAnalytics {
  /** ID del autor */
  authorId: string;

  /** Período de análisis */
  period: {
    start: Date;
    end: Date;
  };

  /** Métricas de contenido */
  contentMetrics: {
    postsPublished: number;
    totalWords: number;
    avgWordsPerPost: number;
    avgReadingTime: number;
  };

  /** Métricas de engagement */
  engagementMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgEngagementRate: number;
    shareCount: number;
  };

  /** Rendimiento por categoría */
  categoryPerformance: {
    categoryId: string;
    categoryName: string;
    posts: number;
    views: number;
    engagement: number;
  }[];

  /** Tendencias temporales */
  timeTrends: {
    date: Date;
    views: number;
    likes: number;
    comments: number;
  }[];

  /** Audiencia */
  audienceInsights: {
    topCountries: { country: string; percentage: number }[];
    deviceTypes: { device: string; percentage: number }[];
    trafficSources: { source: string; percentage: number }[];
  };
}

/**
 * Configuración de notificaciones del autor
 */
export interface AuthorNotificationConfig {
  /** Notificar nuevos comentarios */
  newComments: boolean;

  /** Notificar likes en posts */
  postLikes: boolean;

  /** Notificar cuando se comparte un post */
  postShares: boolean;

  /** Notificar menciones */
  mentions: boolean;

  /** Resumen semanal de estadísticas */
  weeklyStats: boolean;

  /** Resumen mensual */
  monthlyReport: boolean;

  /** Canales de notificación */
  channels: {
    email: boolean;
    push: boolean;
    dashboard: boolean;
  };

  /** Frecuencia de notificaciones */
  frequency: 'immediate' | 'daily' | 'weekly';
}

/**
 * Colaboración entre autores
 */
export interface AuthorCollaboration {
  /** ID de la colaboración */
  id: string;

  /** Autores participantes */
  authors: {
    authorId: string;
    role: 'primary' | 'secondary' | 'contributor';
    contribution: string;
  }[];

  /** Post colaborativo */
  postId: string;

  /** Estado de la colaboración */
  status: 'draft' | 'in-review' | 'published';

  /** Fecha de creación */
  createdAt: Date;

  /** Fecha de publicación */
  publishedAt?: Date;
}

/**
 * Configuración del directorio de autores
 */
export interface AuthorDirectoryConfig {
  /** Título de la página */
  title: string;

  /** Descripción */
  description: string;

  /** Vista por defecto */
  defaultView: 'grid' | 'list' | 'cards';

  /** Permitir cambio de vista */
  allowViewChange: boolean;

  /** Habilitar búsqueda */
  enableSearch: boolean;

  /** Habilitar filtros */
  enableFilters: boolean;

  /** Autores por página */
  itemsPerPage: number;

  /** Mostrar estadísticas de autores */
  showAuthorStats: boolean;

  /** Agrupar por letra */
  groupByLetter: boolean;
}
