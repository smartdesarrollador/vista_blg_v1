import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map, catchError, throwError } from 'rxjs';
import type {
  BlogCategory,
  CategoriesResponse,
  CategoryFilters,
  CategorySortBy,
  CategoryStats,
  CategoryTree,
} from '../models/categoria.interface';
import {
  CATEGORIES_MOCK,
  getCategoryById,
  getCategoryBySlug,
  getMainCategories,
  getSubcategories,
  getActiveCategories,
  getRandomCategory,
  getRandomCategories,
  searchCategories,
  getCategoriesByPopularity,
  buildCategoryTree,
} from '../data/categorias-mock.data';
import { getPostsByCategory } from '../data/blog-mock.data';

/**
 * Servicio de gestión de categorías
 * Maneja jerarquías, estadísticas y funcionalidades avanzadas
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  // Estado de carga reactivo
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Cache simple para categorías
  private _categoriesCache: BlogCategory[] | null = null;
  private _lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  // Getters públicos
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  constructor() {}

  /**
   * Obtener todas las categorías con filtros y paginación
   */
  getCategories(
    page: number = 1,
    pageSize: number = 10,
    filters: CategoryFilters = {}
  ): Observable<CategoriesResponse> {
    this._setLoading(true);

    return of(null).pipe(
      delay(400),
      map(() => {
        let categories = this._getCachedCategories();

        // Aplicar filtros
        categories = this._applyFilters(categories, filters);

        // Aplicar ordenamiento
        categories = this._applySorting(
          categories,
          filters.sortBy,
          filters.sortDirection
        );

        // Aplicar paginación
        const paginatedCategories = this._applyPagination(
          categories,
          page,
          pageSize
        );

        this._setLoading(false);

        return {
          data: paginatedCategories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(categories.length / pageSize),
            totalItems: categories.length,
            itemsPerPage: pageSize,
            hasNext: page * pageSize < categories.length,
            hasPrevious: page > 1,
          },
        };
      }),
      catchError((error) => {
        this._setError('Error al cargar categorías');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener una categoría por ID
   */
  getCategoryById(id: string): Observable<BlogCategory | null> {
    this._setLoading(true);

    return of(null).pipe(
      delay(200),
      map(() => {
        const category = getCategoryById(id);
        this._setLoading(false);
        return category || null;
      }),
      catchError((error) => {
        this._setError(`Error al cargar categoría con ID: ${id}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener una categoría por slug
   */
  getCategoryBySlug(slug: string): Observable<BlogCategory | null> {
    this._setLoading(true);

    return of(null).pipe(
      delay(200),
      map(() => {
        const category = getCategoryBySlug(slug);
        this._setLoading(false);
        return category || null;
      }),
      catchError((error) => {
        this._setError(`Error al cargar categoría: ${slug}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener categorías principales (sin padre)
   */
  getMainCategories(): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(300),
      map(() => getMainCategories())
    );
  }

  /**
   * Obtener subcategorías de una categoría padre
   */
  getSubcategories(parentId: string): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(250),
      map(() => getSubcategories(parentId))
    );
  }

  /**
   * Obtener categorías activas
   */
  getActiveCategories(): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(200),
      map(() => getActiveCategories())
    );
  }

  /**
   * Obtener categorías más populares
   */
  getPopularCategories(limit: number = 8): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(300),
      map(() => getCategoriesByPopularity().slice(0, limit))
    );
  }

  /**
   * Obtener categorías aleatorias
   */
  getRandomCategories(count: number = 5): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(200),
      map(() => getRandomCategories(count))
    );
  }

  /**
   * Buscar categorías
   */
  searchCategories(term: string): Observable<BlogCategory[]> {
    if (!term.trim()) {
      return of([]);
    }

    this._setLoading(true);

    return of(null).pipe(
      delay(300),
      map(() => {
        const results = searchCategories(term);
        this._setLoading(false);
        return results;
      }),
      catchError((error) => {
        this._setError(`Error en búsqueda de categorías: ${term}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Construir árbol jerárquico de categorías
   */
  getCategoryTree(): Observable<CategoryTree[]> {
    this._setLoading(true);

    return of(null).pipe(
      delay(400),
      map(() => {
        const tree = this._buildAdvancedCategoryTree();
        this._setLoading(false);
        return tree;
      }),
      catchError((error) => {
        this._setError('Error al construir árbol de categorías');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener estadísticas de una categoría
   */
  getCategoryStats(categoryId: string): Observable<CategoryStats> {
    this._setLoading(true);

    return of(null).pipe(
      delay(500),
      map(() => {
        const category = getCategoryById(categoryId);
        if (!category) {
          throw new Error('Categoría no encontrada');
        }

        const posts = getPostsByCategory(categoryId);
        const publishedPosts = posts.filter(
          (post) => post.status === 'published'
        );
        const draftPosts = posts.filter((post) => post.status === 'draft');

        const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
        const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = posts.reduce(
          (sum, post) => sum + post.commentsCount,
          0
        );

        // Posts más populares
        const popularPosts = posts
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)
          .map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            views: post.views,
          }));

        // Calcular tiempo promedio de lectura
        const averageReadingTime = posts.length > 0 
          ? posts.reduce((sum, post) => sum + post.readingTime, 0) / posts.length 
          : 0;

        // Calcular tasa de crecimiento (simulada)
        const growthRate = Math.floor(Math.random() * 30) - 15; // -15% a +15%

        // Calcular tendencias (simuladas)
        const postsGrowth = Math.floor(Math.random() * 20) - 10; // -10 a +10
        const viewsGrowth = Math.floor(Math.random() * 30) - 15; // -15 a +15
        const engagementGrowth = Math.floor(Math.random() * 25) - 12; // -12 a +13

        this._setLoading(false);

        return {
          categoryId,
          totalPosts: posts.length,
          publishedPosts: publishedPosts.length,
          draftPosts: draftPosts.length,
          totalViews,
          totalLikes,
          totalComments,
          averageReadingTime,
          growthRate,
          popularPosts,
          trend: {
            postsGrowth,
            viewsGrowth,
            engagementGrowth,
          },
        };
      }),
      catchError((error) => {
        this._setError(
          `Error al cargar estadísticas de categoría: ${categoryId}`
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener breadcrumb para una categoría
   */
  getCategoryBreadcrumb(categoryId: string): Observable<{
    items: { name: string; url: string; level: number }[];
    current: BlogCategory;
  }> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const category = getCategoryById(categoryId);
        if (!category) {
          throw new Error('Categoría no encontrada');
        }

        const breadcrumbItems: { name: string; url: string; level: number }[] =
          [];
        let currentCategory: BlogCategory | undefined = category;
        let level = 0;

        // Construir breadcrumb desde la categoría actual hacia arriba
        while (currentCategory) {
          breadcrumbItems.unshift({
            name: currentCategory.name,
            url: `/blog/categoria/${currentCategory.slug}`,
            level,
          });

          if (currentCategory.parentId) {
            currentCategory = getCategoryById(currentCategory.parentId);
            level++;
          } else {
            break;
          }
        }

        return {
          items: breadcrumbItems,
          current: category,
        };
      })
    );
  }

  /**
   * Obtener categorías relacionadas
   */
  getRelatedCategories(
    categoryId: string,
    limit: number = 4
  ): Observable<BlogCategory[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const category = getCategoryById(categoryId);
        if (!category) return [];

        let related: BlogCategory[] = [];

        // Si tiene padre, incluir hermanas
        if (category.parentId) {
          const siblings = getSubcategories(category.parentId).filter(
            (cat) => cat.id !== categoryId
          );
          related.push(...siblings);
        }

        // Si es padre, incluir hijas
        const children = getSubcategories(categoryId);
        related.push(...children);

        // Completar con categorías aleatorias si no hay suficientes
        if (related.length < limit) {
          const random = getRandomCategories(limit - related.length).filter(
            (cat) =>
              cat.id !== categoryId && !related.some((r) => r.id === cat.id)
          );
          related.push(...random);
        }

        return related.slice(0, limit);
      })
    );
  }

  /**
   * Limpiar caché de categorías
   */
  clearCache(): void {
    this._categoriesCache = null;
    this._lastCacheTime = 0;
  }

  // MÉTODOS PRIVADOS

  /**
   * Obtener categorías desde caché o datos mock
   */
  private _getCachedCategories(): BlogCategory[] {
    const now = Date.now();

    if (
      this._categoriesCache &&
      now - this._lastCacheTime < this.CACHE_DURATION
    ) {
      return this._categoriesCache;
    }

    this._categoriesCache = [...CATEGORIES_MOCK];
    this._lastCacheTime = now;

    return this._categoriesCache;
  }

  /**
   * Aplicar filtros a las categorías
   */
  private _applyFilters(
    categories: BlogCategory[],
    filters: CategoryFilters
  ): BlogCategory[] {
    let filtered = [...categories];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm) ||
          cat.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.activeOnly) {
      filtered = filtered.filter((cat) => cat.isActive);
    }

    if (filters.parentOnly) {
      filtered = filtered.filter((cat) => !cat.parentId);
    }

    if (filters.parentId) {
      filtered = filtered.filter((cat) => cat.parentId === filters.parentId);
    }

    if (filters.color) {
      filtered = filtered.filter((cat) => cat.color === filters.color);
    }

    return filtered;
  }

  /**
   * Aplicar ordenamiento
   */
  private _applySorting(
    categories: BlogCategory[],
    sortBy: CategorySortBy = 'order',
    direction: 'asc' | 'desc' = 'asc'
  ): BlogCategory[] {
    return [...categories].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'postsCount':
          aValue = a.postsCount;
          bValue = b.postsCount;
          break;
        case 'order':
          aValue = a.order;
          bValue = b.order;
          break;
        case 'createdAt':
          aValue = new Date(a.name).getTime(); // Fallback ya que no tenemos createdAt en mock
          bValue = new Date(b.name).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.name).getTime(); // Fallback
          bValue = new Date(b.name).getTime();
          break;
        default:
          aValue = a.order;
          bValue = b.order;
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
    categories: BlogCategory[],
    page: number,
    pageSize: number
  ): BlogCategory[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return categories.slice(startIndex, endIndex);
  }

  /**
   * Construir árbol jerárquico avanzado
   */
  private _buildAdvancedCategoryTree(): CategoryTree[] {
    const mainCategories = getMainCategories();

    return mainCategories.map((category) =>
      this._buildCategoryNode(category, 0, [])
    );
  }

  /**
   * Construir nodo del árbol de categorías
   */
  private _buildCategoryNode(
    category: BlogCategory,
    level: number,
    path: string[]
  ): CategoryTree {
    const children = getSubcategories(category.id);
    const currentPath = [...path, category.name];

    // Calcular posts totales incluyendo subcategorías
    let totalPostsWithChildren = category.postsCount;
    children.forEach((child) => {
      totalPostsWithChildren += child.postsCount;
    });

    return {
      category,
      children: children.map((child) =>
        this._buildCategoryNode(child, level + 1, currentPath)
      ),
      level,
      path: currentPath,
      hasChildren: children.length > 0,
      totalPostsWithChildren,
    };
  }

  /**
   * Establecer estado de carga
   */
  private _setLoading(loading: boolean): void {
    this._loading.set(loading);
    if (loading) {
      this._error.set(null);
    }
  }

  /**
   * Establecer error
   */
  private _setError(message: string): void {
    this._error.set(message);
    this._loading.set(false);
  }
}
