/**
 * Interfaz principal para los posts del blog
 * Diseñada para ser compatible con SSR y optimizada para SEO
 */
export interface BlogPost {
  /** ID único del post */
  id: string;

  /** Título del post */
  title: string;

  /** Slug para URL amigable (ej: mi-primer-post) */
  slug: string;

  /** Contenido principal del post en formato HTML */
  content: string;

  /** Excerpt/resumen del post para listados */
  excerpt: string;

  /** URL de la imagen destacada */
  featuredImage: string;

  /** Alt text para la imagen destacada */
  featuredImageAlt: string;

  /** Estado de publicación del post */
  status: BlogPostStatus;

  /** ID del autor */
  authorId: string;

  /** Información del autor (populated) */
  author?: BlogAuthor;

  /** IDs de las categorías */
  categoryIds: string[];

  /** Categorías (populated) */
  categories?: BlogCategory[];

  /** Tags/etiquetas del post */
  tags: string[];

  /** Tiempo estimado de lectura en minutos */
  readingTime: number;

  /** Número de vistas */
  views: number;

  /** Número de likes */
  likes: number;

  /** Número de comentarios */
  commentsCount: number;

  /** Si el post permite comentarios */
  allowComments: boolean;

  /** Si el post está destacado */
  featured: boolean;

  /** Fecha de creación */
  createdAt: Date;

  /** Fecha de última actualización */
  updatedAt: Date;

  /** Fecha de publicación */
  publishedAt?: Date;

  /** Metadata para SEO */
  seo: BlogSeoMetadata;

  /** Configuración de social sharing */
  social: BlogSocialConfig;
}

/**
 * Estados posibles de un post
 */
export type BlogPostStatus = 'draft' | 'published' | 'archived' | 'scheduled';

/**
 * Metadata SEO para cada post
 */
export interface BlogSeoMetadata {
  /** Meta title (si es diferente al title) */
  metaTitle?: string;

  /** Meta description */
  metaDescription: string;

  /** Keywords/palabras clave */
  keywords: string[];

  /** URL canónica */
  canonicalUrl?: string;

  /** Si debe ser indexado por buscadores */
  noIndex: boolean;

  /** Si los enlaces deben ser seguidos */
  noFollow: boolean;

  /** Open Graph title */
  ogTitle?: string;

  /** Open Graph description */
  ogDescription?: string;

  /** Open Graph image */
  ogImage?: string;

  /** Twitter card type */
  twitterCard: 'summary' | 'summary_large_image' | 'app' | 'player';

  /** Twitter title */
  twitterTitle?: string;

  /** Twitter description */
  twitterDescription?: string;

  /** Twitter image */
  twitterImage?: string;

  /** Structured data adicional */
  structuredData?: any;
}

/**
 * Configuración de social sharing
 */
export interface BlogSocialConfig {
  /** Si se puede compartir en redes sociales */
  allowSharing: boolean;

  /** Plataformas habilitadas para compartir */
  enabledPlatforms: SocialPlatform[];

  /** Texto personalizado para compartir */
  shareText?: string;

  /** Hashtags sugeridos */
  suggestedHashtags: string[];
}

/**
 * Plataformas de redes sociales
 */
export type SocialPlatform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'telegram'
  | 'email'
  | 'copy-link';

/**
 * Interfaz para el autor del blog
 */
export interface BlogAuthor {
  /** ID único del autor */
  id: string;

  /** Nombre completo */
  name: string;

  /** Slug para URL del autor */
  slug: string;

  /** Email del autor */
  email: string;

  /** Biografía corta */
  bio: string;

  /** Avatar/foto del autor */
  avatar: string;

  /** Redes sociales del autor */
  socialLinks: AuthorSocialLinks;

  /** Si el autor está activo */
  isActive: boolean;

  /** Fecha de registro */
  joinedAt: Date;
}

/**
 * Enlaces de redes sociales del autor
 */
export interface AuthorSocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
}

/**
 * Interfaz para las categorías del blog
 */
export interface BlogCategory {
  /** ID único de la categoría */
  id: string;

  /** Nombre de la categoría */
  name: string;

  /** Slug para URL */
  slug: string;

  /** Descripción de la categoría */
  description: string;

  /** Color hexadecimal para la categoría */
  color: string;

  /** Icono de la categoría */
  icon?: string;

  /** Imagen destacada de la categoría */
  image?: string;

  /** ID de la categoría padre (para subcategorías) */
  parentId?: string;

  /** Categoría padre (populated) */
  parent?: BlogCategory;

  /** Subcategorías */
  children?: BlogCategory[];

  /** Número de posts en esta categoría */
  postsCount: number;

  /** Si la categoría está activa */
  isActive: boolean;

  /** Orden de visualización */
  order: number;

  /** Metadata SEO de la categoría */
  seo: CategorySeoMetadata;
}

/**
 * Metadata SEO para categorías
 */
export interface CategorySeoMetadata {
  metaTitle?: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
  noIndex: boolean;
}

/**
 * Respuesta paginada de posts
 */
export interface BlogPostsResponse {
  /** Posts de la página actual */
  data: BlogPost[];

  /** Información de paginación */
  pagination: BlogPagination;

  /** Filtros aplicados */
  filters?: BlogFilters;
}

/**
 * Información de paginación
 */
export interface BlogPagination {
  /** Página actual */
  currentPage: number;

  /** Total de páginas */
  totalPages: number;

  /** Total de elementos */
  totalItems: number;

  /** Elementos por página */
  itemsPerPage: number;

  /** Si hay página anterior */
  hasPrevious: boolean;

  /** Si hay página siguiente */
  hasNext: boolean;
}

/**
 * Filtros para búsqueda de posts
 */
export interface BlogFilters {
  /** Término de búsqueda */
  search?: string;

  /** IDs de categorías */
  categoryIds?: string[];

  /** Tags */
  tags?: string[];

  /** ID del autor */
  authorId?: string;

  /** Estado del post */
  status?: BlogPostStatus;

  /** Solo posts destacados */
  featured?: boolean;

  /** Fecha desde */
  dateFrom?: Date;

  /** Fecha hasta */
  dateTo?: Date;

  /** Ordenamiento */
  sortBy?: BlogSortBy;

  /** Dirección del ordenamiento */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Opciones de ordenamiento
 */
export type BlogSortBy =
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'views'
  | 'likes'
  | 'commentsCount'
  | 'readingTime';

/**
 * Configuración para el componente de lista de posts
 */
export interface BlogListConfig {
  /** Número de posts por página */
  itemsPerPage: number;

  /** Layout de visualización */
  layout: 'grid' | 'list' | 'masonry';

  /** Columnas en vista grid */
  gridColumns: number;

  /** Si mostrar excerpt */
  showExcerpt: boolean;

  /** Si mostrar autor */
  showAuthor: boolean;

  /** Si mostrar fecha */
  showDate: boolean;

  /** Si mostrar categorías */
  showCategories: boolean;

  /** Si mostrar tags */
  showTags: boolean;

  /** Si mostrar tiempo de lectura */
  showReadingTime: boolean;

  /** Si mostrar contadores (views, likes) */
  showCounters: boolean;
}

/**
 * Estados de carga para componentes
 */
export interface BlogLoadingState {
  /** Si está cargando */
  loading: boolean;

  /** Si hay error */
  error: boolean;

  /** Mensaje de error */
  errorMessage?: string;

  /** Si es la primera carga */
  initialLoad: boolean;

  /** Si está cargando más elementos */
  loadingMore: boolean;
}
