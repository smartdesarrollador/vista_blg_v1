import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { BlogPost } from '../models/blog.interface';

interface BookmarkItem {
  id: string;
  postId: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: Date;
  bookmarkedAt: Date;
}

interface BookmarkStats {
  total: number;
  categories: Record<string, number>;
  recentCount: number;
  oldestBookmark?: Date;
  newestBookmark?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'blog_bookmarks_v1';

  // Estado reactivo con Signals
  private readonly _bookmarks = signal<BookmarkItem[]>([]);
  private readonly _loading = signal<boolean>(false);

  // Computed signals
  readonly bookmarks = this._bookmarks.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly bookmarkIds = computed(
    () => new Set(this.bookmarks().map((bookmark) => bookmark.postId))
  );

  readonly bookmarkCount = computed(() => this.bookmarks().length);

  readonly bookmarkStats = computed((): BookmarkStats => {
    const bookmarks = this.bookmarks();
    const categories: Record<string, number> = {};

    bookmarks.forEach((bookmark) => {
      categories[bookmark.category] = (categories[bookmark.category] || 0) + 1;
    });

    const sortedByDate = [...bookmarks].sort(
      (a, b) =>
        new Date(a.bookmarkedAt).getTime() - new Date(b.bookmarkedAt).getTime()
    );

    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 días
    const recentCount = bookmarks.filter(
      (b) => new Date(b.bookmarkedAt) > recentThreshold
    ).length;

    return {
      total: bookmarks.length,
      categories,
      recentCount,
      oldestBookmark: sortedByDate[0]?.bookmarkedAt,
      newestBookmark: sortedByDate[sortedByDate.length - 1]?.bookmarkedAt,
    };
  });

  readonly recentBookmarks = computed(() =>
    [...this.bookmarks()]
      .sort(
        (a, b) =>
          new Date(b.bookmarkedAt).getTime() -
          new Date(a.bookmarkedAt).getTime()
      )
      .slice(0, 10)
  );

  readonly bookmarksByCategory = computed(() => {
    const bookmarks = this.bookmarks();
    const grouped = new Map<string, BookmarkItem[]>();

    bookmarks.forEach((bookmark) => {
      if (!grouped.has(bookmark.category)) {
        grouped.set(bookmark.category, []);
      }
      grouped.get(bookmark.category)!.push(bookmark);
    });

    // Ordenar por cantidad de bookmarks por categoría
    return Array.from(grouped.entries())
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([category, items]) => ({
        category,
        items: items.sort(
          (a, b) =>
            new Date(b.bookmarkedAt).getTime() -
            new Date(a.bookmarkedAt).getTime()
        ),
        count: items.length,
      }));
  });

  // Observable para notificaciones de cambios
  private bookmarkChanges$ = new BehaviorSubject<{
    action: 'add' | 'remove' | 'clear' | 'init';
    bookmark?: BookmarkItem;
    total: number;
  }>({ action: 'init', total: 0 });

  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.loadBookmarks();
    }
  }

  /**
   * Carga los bookmarks desde localStorage
   */
  private loadBookmarks(): void {
    this._loading.set(true);

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Validar y convertir fechas
        const bookmarks = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          bookmarkedAt: new Date(item.bookmarkedAt),
        }));

        this._bookmarks.set(bookmarks);
        this.bookmarkChanges$.next({
          action: 'init',
          total: bookmarks.length,
        });
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.clearBookmarks();
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Guarda los bookmarks en localStorage
   */
  private saveBookmarks(): void {
    if (!this.isBrowser) return;

    try {
      const bookmarks = this._bookmarks();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      // Notificar error si el localStorage está lleno
      this.handleStorageError(error);
    }
  }

  /**
   * Maneja errores de almacenamiento
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      // Si el storage está lleno, eliminar bookmarks antiguos
      this.cleanOldBookmarks();
    }
  }

  /**
   * Limpia bookmarks antiguos para liberar espacio
   */
  private cleanOldBookmarks(): void {
    const bookmarks = this._bookmarks();
    const maxBookmarks = 100; // Límite máximo

    if (bookmarks.length > maxBookmarks) {
      // Mantener solo los más recientes
      const sorted = [...bookmarks].sort(
        (a, b) =>
          new Date(b.bookmarkedAt).getTime() -
          new Date(a.bookmarkedAt).getTime()
      );

      this._bookmarks.set(sorted.slice(0, maxBookmarks));
      this.saveBookmarks();
    }
  }

  /**
   * Convierte un BlogPost a BookmarkItem
   */
  private postToBookmarkItem(post: BlogPost): BookmarkItem {
    return {
      id: `bookmark_${post.id}_${Date.now()}`,
      postId: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: post.categories?.[0]?.name || 'Sin categoría',
      tags: post.tags,
      author: post.author?.name || 'Autor desconocido',
      createdAt: post.createdAt,
      bookmarkedAt: new Date(),
    };
  }

  /**
   * Verifica si un post está bookmarkeado
   */
  isBookmarked(postId: string): boolean {
    return this.bookmarkIds().has(postId);
  }

  /**
   * Añade un bookmark
   */
  addBookmark(post: BlogPost): boolean {
    if (this.isBookmarked(post.id)) {
      return false; // Ya está bookmarkeado
    }

    const bookmark = this.postToBookmarkItem(post);
    const currentBookmarks = this._bookmarks();

    this._bookmarks.set([bookmark, ...currentBookmarks]);
    this.saveBookmarks();

    this.bookmarkChanges$.next({
      action: 'add',
      bookmark,
      total: this._bookmarks().length,
    });

    return true;
  }

  /**
   * Elimina un bookmark
   */
  removeBookmark(postId: string): boolean {
    const currentBookmarks = this._bookmarks();
    const bookmark = currentBookmarks.find((b) => b.postId === postId);

    if (!bookmark) {
      return false; // No existe
    }

    const filtered = currentBookmarks.filter((b) => b.postId !== postId);
    this._bookmarks.set(filtered);
    this.saveBookmarks();

    this.bookmarkChanges$.next({
      action: 'remove',
      bookmark,
      total: filtered.length,
    });

    return true;
  }

  /**
   * Toggle bookmark (añadir/eliminar)
   */
  toggleBookmark(post: BlogPost): boolean {
    if (this.isBookmarked(post.id)) {
      this.removeBookmark(post.id);
      return false;
    } else {
      this.addBookmark(post);
      return true;
    }
  }

  /**
   * Obtiene un bookmark por ID de post
   */
  getBookmark(postId: string): BookmarkItem | undefined {
    return this._bookmarks().find((b) => b.postId === postId);
  }

  /**
   * Obtiene bookmarks filtrados
   */
  getBookmarks(options?: {
    category?: string;
    limit?: number;
    sortBy?: 'date' | 'title';
    search?: string;
  }): BookmarkItem[] {
    let bookmarks = [...this._bookmarks()];

    // Filtrar por categoría
    if (options?.category) {
      bookmarks = bookmarks.filter(
        (b) => b.category.toLowerCase() === options.category!.toLowerCase()
      );
    }

    // Filtrar por búsqueda
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      bookmarks = bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(searchTerm) ||
          b.excerpt.toLowerCase().includes(searchTerm) ||
          b.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Ordenar
    if (options?.sortBy === 'title') {
      bookmarks.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Por defecto ordenar por fecha (más recientes primero)
      bookmarks.sort(
        (a, b) =>
          new Date(b.bookmarkedAt).getTime() -
          new Date(a.bookmarkedAt).getTime()
      );
    }

    // Limitar cantidad
    if (options?.limit) {
      bookmarks = bookmarks.slice(0, options.limit);
    }

    return bookmarks;
  }

  /**
   * Busca bookmarks
   */
  searchBookmarks(query: string): BookmarkItem[] {
    return this.getBookmarks({ search: query });
  }

  /**
   * Obtiene bookmarks por categoría
   */
  getBookmarksByCategory(category: string): BookmarkItem[] {
    return this.getBookmarks({ category });
  }

  /**
   * Limpia todos los bookmarks
   */
  clearBookmarks(): void {
    this._bookmarks.set([]);

    if (this.isBrowser) {
      localStorage.removeItem(this.STORAGE_KEY);
    }

    this.bookmarkChanges$.next({
      action: 'clear',
      total: 0,
    });
  }

  /**
   * Exporta bookmarks como JSON
   */
  exportBookmarks(): string {
    return JSON.stringify(this._bookmarks(), null, 2);
  }

  /**
   * Importa bookmarks desde JSON
   */
  importBookmarks(jsonData: string): boolean {
    try {
      const bookmarks = JSON.parse(jsonData);

      // Validar estructura
      if (!Array.isArray(bookmarks)) {
        throw new Error('Invalid format: expected array');
      }

      // Validar cada bookmark
      const validBookmarks = bookmarks
        .filter(this.isValidBookmarkItem)
        .map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          bookmarkedAt: new Date(item.bookmarkedAt),
        }));

      this._bookmarks.set(validBookmarks);
      this.saveBookmarks();

      this.bookmarkChanges$.next({
        action: 'init',
        total: validBookmarks.length,
      });

      return true;
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      return false;
    }
  }

  /**
   * Valida la estructura de un bookmark item
   */
  private isValidBookmarkItem(item: any): boolean {
    return (
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.postId === 'string' &&
      typeof item.title === 'string' &&
      typeof item.slug === 'string' &&
      typeof item.excerpt === 'string' &&
      typeof item.featuredImage === 'string' &&
      typeof item.category === 'string' &&
      Array.isArray(item.tags) &&
      typeof item.author === 'string' &&
      item.createdAt &&
      item.bookmarkedAt
    );
  }

  /**
   * Observable para cambios en bookmarks
   */
  onBookmarkChanges(): Observable<{
    action: 'add' | 'remove' | 'clear' | 'init';
    bookmark?: BookmarkItem;
    total: number;
  }> {
    return this.bookmarkChanges$.asObservable();
  }

  /**
   * Obtiene el tamaño del storage utilizado
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isBrowser) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const available = 5 * 1024 * 1024; // Estimado 5MB límite típico
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Verifica si hay suficiente espacio para más bookmarks
   */
  hasStorageSpace(): boolean {
    const info = this.getStorageInfo();
    return info.percentage < 80; // 80% como límite de seguridad
  }
}
