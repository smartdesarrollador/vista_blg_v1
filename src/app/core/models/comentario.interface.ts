/**
 * Interfaz para los comentarios del blog
 * Soporta comentarios anidados y sistema de moderación
 */
export interface BlogComment {
  /** ID único del comentario */
  id: string;

  /** ID del post al que pertenece */
  postId: string;

  /** ID del comentario padre (para respuestas) */
  parentId?: string;

  /** Comentario padre (populated) */
  parent?: BlogComment;

  /** Respuestas a este comentario */
  replies?: BlogComment[];

  /** Contenido del comentario */
  content: string;

  /** Información del autor del comentario */
  author: CommentAuthor;

  /** Estado del comentario */
  status: CommentStatus;

  /** Número de likes */
  likes: number;

  /** Número de dislikes */
  dislikes: number;

  /** Si el comentario está marcado como spam */
  isSpam: boolean;

  /** Si el comentario fue editado */
  isEdited: boolean;

  /** Nivel de anidamiento (0 = comentario principal) */
  level: number;

  /** Fecha de creación */
  createdAt: Date;

  /** Fecha de última actualización */
  updatedAt: Date;

  /** Información de moderación */
  moderation?: CommentModeration;

  /** Metadata adicional */
  metadata: CommentMetadata;
}

/**
 * Estados posibles de un comentario
 */
export type CommentStatus =
  | 'pending' // Pendiente de moderación
  | 'approved' // Aprobado y visible
  | 'rejected' // Rechazado
  | 'spam' // Marcado como spam
  | 'archived'; // Archivado

/**
 * Información del autor del comentario
 */
export interface CommentAuthor {
  /** Nombre del autor */
  name: string;

  /** Email del autor */
  email: string;

  /** Sitio web del autor (opcional) */
  website?: string;

  /** Avatar/Gravatar del autor */
  avatar: string;

  /** Si es un usuario registrado */
  isRegistered: boolean;

  /** ID del usuario registrado (si aplica) */
  userId?: string;

  /** Si es el autor del post */
  isPostAuthor: boolean;

  /** Si es un moderador/admin */
  isModerator: boolean;
}

/**
 * Información de moderación del comentario
 */
export interface CommentModeration {
  /** ID del moderador que revisó */
  moderatorId?: string;

  /** Nombre del moderador */
  moderatorName?: string;

  /** Fecha de moderación */
  moderatedAt?: Date;

  /** Razón de la moderación */
  reason?: string;

  /** Notas internas del moderador */
  moderatorNotes?: string;

  /** Score de spam (0-1) */
  spamScore: number;

  /** Flags/reportes de usuarios */
  userReports: CommentReport[];
}

/**
 * Reporte de usuario sobre un comentario
 */
export interface CommentReport {
  /** ID del reporte */
  id: string;

  /** ID del usuario que reporta */
  reporterId: string;

  /** Razón del reporte */
  reason: CommentReportReason;

  /** Descripción adicional */
  description?: string;

  /** Fecha del reporte */
  reportedAt: Date;

  /** Estado del reporte */
  status: 'pending' | 'reviewed' | 'dismissed';
}

/**
 * Razones de reporte de comentarios
 */
export type CommentReportReason =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'hate-speech'
  | 'misinformation'
  | 'copyright'
  | 'other';

/**
 * Metadata adicional del comentario
 */
export interface CommentMetadata {
  /** IP del usuario (para moderación) */
  userIP?: string;

  /** User Agent del navegador */
  userAgent?: string;

  /** URL de referencia */
  referrer?: string;

  /** Geolocalización aproximada */
  location?: CommentLocation;

  /** Si fue creado desde mobile */
  isMobile: boolean;

  /** Tiempo que tardó en escribir el comentario */
  writingTime?: number;
}

/**
 * Información de ubicación del comentario
 */
export interface CommentLocation {
  /** País */
  country?: string;

  /** Código de país */
  countryCode?: string;

  /** Ciudad */
  city?: string;

  /** Zona horaria */
  timezone?: string;
}

/**
 * Respuesta paginada de comentarios
 */
export interface CommentsResponse {
  /** Comentarios de la página actual */
  data: BlogComment[];

  /** Información de paginación */
  pagination: CommentsPagination;

  /** Estadísticas de comentarios */
  stats: CommentsStats;
}

/**
 * Paginación específica para comentarios
 */
export interface CommentsPagination {
  /** Página actual */
  currentPage: number;

  /** Total de páginas */
  totalPages: number;

  /** Total de comentarios */
  totalComments: number;

  /** Comentarios por página */
  commentsPerPage: number;

  /** Si hay más comentarios */
  hasMore: boolean;

  /** Cursor para paginación infinita */
  cursor?: string;
}

/**
 * Estadísticas de comentarios
 */
export interface CommentsStats {
  /** Total de comentarios */
  total: number;

  /** Comentarios aprobados */
  approved: number;

  /** Comentarios pendientes */
  pending: number;

  /** Comentarios marcados como spam */
  spam: number;

  /** Comentarios principales (no respuestas) */
  topLevel: number;

  /** Total de respuestas */
  replies: number;
}

/**
 * Configuración para el sistema de comentarios
 */
export interface CommentsConfig {
  /** Si los comentarios están habilitados */
  enabled: boolean;

  /** Si requiere moderación */
  requireModeration: boolean;

  /** Si requiere registro para comentar */
  requireRegistration: boolean;

  /** Nivel máximo de anidamiento */
  maxNestingLevel: number;

  /** Longitud máxima del comentario */
  maxLength: number;

  /** Longitud mínima del comentario */
  minLength: number;

  /** Si permite edición de comentarios */
  allowEditing: boolean;

  /** Tiempo límite para editar (en minutos) */
  editTimeLimit: number;

  /** Si permite eliminación por el autor */
  allowDeletion: boolean;

  /** Si permite sistema de likes/dislikes */
  allowVoting: boolean;

  /** Si permite reportes de usuarios */
  allowReporting: boolean;

  /** Ordenamiento por defecto */
  defaultSort: CommentSortBy;

  /** Filtros de palabras prohibidas */
  bannedWords: string[];

  /** URLs permitidas en comentarios */
  allowedDomains: string[];
}

/**
 * Opciones de ordenamiento para comentarios
 */
export type CommentSortBy =
  | 'newest' // Más recientes primero
  | 'oldest' // Más antiguos primero
  | 'popular' // Más likes primero
  | 'controversial'; // Más controvertidos

/**
 * Filtros para comentarios
 */
export interface CommentsFilters {
  /** Filtrar por estado */
  status?: CommentStatus;

  /** Filtrar por autor */
  authorName?: string;

  /** Filtrar por email del autor */
  authorEmail?: string;

  /** Fecha desde */
  dateFrom?: Date;

  /** Fecha hasta */
  dateTo?: Date;

  /** Solo comentarios principales */
  topLevelOnly?: boolean;

  /** Ordenamiento */
  sortBy?: CommentSortBy;

  /** Término de búsqueda */
  search?: string;
}

/**
 * Datos para crear un nuevo comentario
 */
export interface CreateCommentData {
  /** ID del post */
  postId: string;

  /** ID del comentario padre (opcional) */
  parentId?: string;

  /** Contenido del comentario */
  content: string;

  /** Información del autor */
  author: {
    name: string;
    email: string;
    website?: string;
  };

  /** Metadata del cliente */
  metadata?: Partial<CommentMetadata>;
}

/**
 * Datos para actualizar un comentario
 */
export interface UpdateCommentData {
  /** Nuevo contenido */
  content?: string;

  /** Nuevo estado (para moderadores) */
  status?: CommentStatus;

  /** Notas de moderación */
  moderatorNotes?: string;
}

/**
 * Estadísticas en tiempo real de comentarios
 */
export interface CommentRealtimeStats {
  /** Comentarios nuevos en las últimas 24h */
  last24h: number;

  /** Comentarios pendientes de moderación */
  pendingModeration: number;

  /** Comentarios reportados */
  reported: number;

  /** Tasa de aprobación (%) */
  approvalRate: number;

  /** Comentarios por hora promedio */
  averagePerHour: number;
}

/**
 * Configuración de notificaciones para comentarios
 */
export interface CommentNotificationConfig {
  /** Notificar al autor del post */
  notifyPostAuthor: boolean;

  /** Notificar respuestas a comentarios */
  notifyReplies: boolean;

  /** Notificar nuevos comentarios */
  notifyNewComments: boolean;

  /** Notificar moderación necesaria */
  notifyModerationNeeded: boolean;

  /** Canales de notificación */
  channels: NotificationChannel[];
}

/**
 * Canales de notificación
 */
export type NotificationChannel = 'email' | 'push' | 'webhook' | 'dashboard';

/**
 * Threading/anidamiento de comentarios
 */
export interface CommentThread {
  /** Comentario principal */
  main: BlogComment;

  /** Todas las respuestas en orden jerárquico */
  replies: BlogComment[];

  /** Profundidad máxima del hilo */
  maxDepth: number;

  /** Total de respuestas */
  totalReplies: number;

  /** Si el hilo está colapsado */
  collapsed: boolean;
}
