import { Injectable, signal, computed } from '@angular/core';
import {
  Observable,
  BehaviorSubject,
  of,
  delay,
  map,
  catchError,
  throwError,
} from 'rxjs';
import type {
  BlogPost,
  BlogPostsResponse,
  BlogFilters,
  BlogPagination,
  BlogSortBy,
  BlogLoadingState,
} from '../models/blog.interface';
import {
  BLOG_POSTS_MOCK,
  getPostById,
  getPostBySlug,
  getPublishedPosts,
  getFeaturedPosts,
  getPostsByCategory,
  getPostsByAuthor,
  searchPosts,
  getRelatedPosts,
  getPopularPosts,
  getRecentPosts,
} from '../data/blog-mock.data';

/**
 * Servicio principal del blog
 * Maneja CRUD, búsqueda, filtrado, paginación y caché
 */
@Injectable({
  providedIn: 'root',
})
export class BlogService {
  // Estados reactivos con signals
  private _loadingState = signal<BlogLoadingState>({
    loading: false,
    error: false,
    errorMessage: undefined,
    initialLoad: true,
    loadingMore: false,
  });

  private _postsCache = new Map<string, BlogPost[]>();
  private _lastFetchTime = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Subjects para estado reactivo
  private _currentFilters = new BehaviorSubject<BlogFilters>({});
  private _currentPage = new BehaviorSubject<number>(1);

  // Getters públicos
  public readonly loadingState = this._loadingState.asReadonly();
  public readonly currentFilters$ = this._currentFilters.asObservable();
  public readonly currentPage$ = this._currentPage.asObservable();

  // Configuración por defecto
  private readonly DEFAULT_PAGE_SIZE = 12;
  private readonly SEARCH_DELAY = 300; // ms para debounce

  constructor() {}

  /**
   * Obtener posts con paginación y filtros
   */
  getPosts(
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
    filters: BlogFilters = {}
  ): Observable<BlogPostsResponse> {
    this._setLoading(true);

    const cacheKey = this._generateCacheKey(page, pageSize, filters);

    // Verificar caché
    if (this._isCacheValid(cacheKey)) {
      const cachedPosts = this._postsCache.get(cacheKey);
      if (cachedPosts) {
        this._setLoading(false);
        return of(this._buildResponse(cachedPosts, page, pageSize, filters));
      }
    }

    return of(null).pipe(
      delay(800), // Simular llamada API
      map(() => {
        let posts = getPublishedPosts();

        // Aplicar filtros
        posts = this._applyFilters(posts, filters);

        // Aplicar ordenamiento
        posts = this._applySorting(
          posts,
          filters.sortBy,
          filters.sortDirection
        );

        // Guardar en caché
        this._postsCache.set(cacheKey, posts);
        this._lastFetchTime.set(cacheKey, Date.now());

        // Aplicar paginación
        const paginatedPosts = this._applyPagination(posts, page, pageSize);

        this._setLoading(false);
        this._currentFilters.next(filters);
        this._currentPage.next(page);

        return this._buildResponse(
          paginatedPosts,
          page,
          pageSize,
          filters,
          posts.length
        );
      }),
      catchError((error) => {
        this._setError('Error al cargar posts');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener un post por ID
   */
  getPostById(id: string): Observable<BlogPost | null> {
    this._setLoading(true);

    return of(null).pipe(
      delay(400),
      map(() => {
        const post = getPostById(id);
        this._setLoading(false);
        return post || null;
      }),
      catchError((error) => {
        this._setError(`Error al cargar post con ID: ${id}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener un post por slug
   */
  getPostBySlug(slug: string): Observable<BlogPost | null> {
    this._setLoading(true);

    return of(null).pipe(
      delay(400),
      map(() => {
        const post = getPostBySlug(slug);
        this._setLoading(false);
        return post || null;
      }),
      catchError((error) => {
        this._setError(`Error al cargar post: ${slug}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener posts destacados
   */
  getFeaturedPosts(limit: number = 5): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(200),
      map(() => getFeaturedPosts().slice(0, limit))
    );
  }

  /**
   * Obtener posts populares
   */
  getPopularPosts(limit: number = 5): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(200),
      map(() => getPopularPosts(limit))
    );
  }

  /**
   * Obtener posts recientes
   */
  getRecentPosts(limit: number = 5): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(200),
      map(() => getRecentPosts(limit))
    );
  }

  /**
   * Obtener posts por categoría
   */
  getPostsByCategory(
    categoryId: string,
    limit?: number
  ): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const posts = getPostsByCategory(categoryId);
        return limit ? posts.slice(0, limit) : posts;
      })
    );
  }

  /**
   * Obtener posts por autor
   */
  getPostsByAuthor(authorId: string, limit?: number): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const posts = getPostsByAuthor(authorId);
        return limit ? posts.slice(0, limit) : posts;
      })
    );
  }

  /**
   * Buscar posts
   */
  searchPosts(term: string, filters: BlogFilters = {}): Observable<BlogPost[]> {
    if (!term.trim()) {
      return of([]);
    }

    this._setLoading(true);

    return of(null).pipe(
      delay(this.SEARCH_DELAY),
      map(() => {
        let posts = searchPosts(term);
        posts = this._applyFilters(posts, filters);
        posts = this._applySorting(
          posts,
          filters.sortBy,
          filters.sortDirection
        );

        this._setLoading(false);
        return posts;
      }),
      catchError((error) => {
        this._setError(`Error en búsqueda: ${term}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener posts relacionados
   */
  getRelatedPosts(postId: string, limit: number = 3): Observable<BlogPost[]> {
    return of(null).pipe(
      delay(200),
      map(() => getRelatedPosts(postId, limit))
    );
  }

  /**
   * Incrementar vistas de un post
   */
  incrementViews(postId: string): Observable<boolean> {
    return of(null).pipe(
      delay(100),
      map(() => {
        const post = getPostById(postId);
        if (post) {
          post.views += 1;
          return true;
        }
        return false;
      })
    );
  }

  /**
   * Toggle like en un post
   */
  toggleLike(
    postId: string
  ): Observable<{ liked: boolean; totalLikes: number }> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const post = getPostById(postId);
        if (post) {
          // Simular toggle like
          const liked = Math.random() > 0.5;
          post.likes += liked ? 1 : -1;

          return {
            liked,
            totalLikes: post.likes,
          };
        }

        throw new Error('Post no encontrado');
      })
    );
  }

  /**
   * Obtener estadísticas del blog
   */
  getBlogStats(): Observable<{
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgReadingTime: number;
  }> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const posts = getPublishedPosts();

        return {
          totalPosts: posts.length,
          totalViews: posts.reduce((sum, post) => sum + post.views, 0),
          totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
          totalComments: posts.reduce(
            (sum, post) => sum + post.commentsCount,
            0
          ),
          avgReadingTime: Math.round(
            posts.reduce((sum, post) => sum + post.readingTime, 0) /
              posts.length
          ),
        };
      })
    );
  }

  /**
   * Limpiar caché
   */
  clearCache(): void {
    this._postsCache.clear();
    this._lastFetchTime.clear();
  }

  /**
   * Resetear filtros
   */
  resetFilters(): void {
    this._currentFilters.next({});
    this._currentPage.next(1);
  }

  // MÉTODOS PRIVADOS

  /**
   * Aplicar filtros a los posts
   */
  private _applyFilters(posts: BlogPost[], filters: BlogFilters): BlogPost[] {
    let filteredPosts = [...posts];

    // Filtro por búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filtro por categorías
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filteredPosts = filteredPosts.filter((post) =>
        filters.categoryIds!.some((catId) => post.categoryIds.includes(catId))
      );
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      filteredPosts = filteredPosts.filter((post) =>
        filters.tags!.some((tag) => post.tags.includes(tag))
      );
    }

    // Filtro por autor
    if (filters.authorId) {
      filteredPosts = filteredPosts.filter(
        (post) => post.authorId === filters.authorId
      );
    }

    // Filtro por estado
    if (filters.status) {
      filteredPosts = filteredPosts.filter(
        (post) => post.status === filters.status
      );
    }

    // Filtro solo destacados
    if (filters.featured) {
      filteredPosts = filteredPosts.filter((post) => post.featured);
    }

    // Filtro por fechas
    if (filters.dateFrom) {
      filteredPosts = filteredPosts.filter(
        (post) => new Date(post.publishedAt!) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filteredPosts = filteredPosts.filter(
        (post) => new Date(post.publishedAt!) <= filters.dateTo!
      );
    }

    return filteredPosts;
  }

  /**
   * Aplicar ordenamiento
   */
  private _applySorting(
    posts: BlogPost[],
    sortBy: BlogSortBy = 'publishedAt',
    direction: 'asc' | 'desc' = 'desc'
  ): BlogPost[] {
    return [...posts].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'publishedAt':
          aValue = new Date(a.publishedAt!).getTime();
          bValue = new Date(b.publishedAt!).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'likes':
          aValue = a.likes;
          bValue = b.likes;
          break;
        case 'commentsCount':
          aValue = a.commentsCount;
          bValue = b.commentsCount;
          break;
        case 'readingTime':
          aValue = a.readingTime;
          bValue = b.readingTime;
          break;
        default:
          aValue = new Date(a.publishedAt!).getTime();
          bValue = new Date(b.publishedAt!).getTime();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  /**
   * Aplicar paginación
   */
  private _applyPagination(
    posts: BlogPost[],
    page: number,
    pageSize: number
  ): BlogPost[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return posts.slice(startIndex, endIndex);
  }

  /**
   * Construir respuesta con paginación
   */
  private _buildResponse(
    posts: BlogPost[],
    page: number,
    pageSize: number,
    filters: BlogFilters,
    totalItems?: number
  ): BlogPostsResponse {
    const total = totalItems ?? posts.length;
    const totalPages = Math.ceil(total / pageSize);

    const pagination: BlogPagination = {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: pageSize,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };

    return {
      data: posts,
      pagination,
      filters,
    };
  }

  /**
   * Generar clave de caché
   */
  private _generateCacheKey(
    page: number,
    pageSize: number,
    filters: BlogFilters
  ): string {
    return `${page}-${pageSize}-${JSON.stringify(filters)}`;
  }

  /**
   * Verificar si el caché es válido
   */
  private _isCacheValid(cacheKey: string): boolean {
    const lastFetch = this._lastFetchTime.get(cacheKey);
    if (!lastFetch) return false;

    return Date.now() - lastFetch < this.CACHE_DURATION;
  }

  /**
   * Establecer estado de carga
   */
  private _setLoading(loading: boolean): void {
    this._loadingState.update((state) => ({
      ...state,
      loading,
      error: false,
      errorMessage: undefined,
      initialLoad: state.initialLoad && !loading ? false : state.initialLoad,
    }));
  }

  /**
   * Establecer estado de error
   */
  private _setError(message: string): void {
    this._loadingState.update((state) => ({
      ...state,
      loading: false,
      error: true,
      errorMessage: message,
    }));
  }
}
