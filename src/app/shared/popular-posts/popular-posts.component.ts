import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { BlogService } from '../../core/services/blog.service';
import { BookmarkService } from '../../core/services/bookmark.service';
import { BlogPost } from '../../core/models/blog.interface';

interface PopularPostsConfig {
  title: string;
  limit: number;
  showThumbnails: boolean;
  showDate: boolean;
  showViews: boolean;
  showBookmark: boolean;
  showExcerpt: boolean;
  sortBy: 'views' | 'likes' | 'recent' | 'comments' | 'trending';
  timeframe: 'week' | 'month' | 'year' | 'all';
  categories?: string[];
  excludeCurrentPost?: boolean;
}

@Component({
  selector: 'app-popular-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './popular-posts.component.html',
  styleUrls: ['./popular-posts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopularPostsComponent implements OnInit, OnDestroy {
  private blogService = inject(BlogService);
  private bookmarkService = inject(BookmarkService);
  private platformId = inject(PLATFORM_ID);

  // Inputs
  @Input() config: Partial<PopularPostsConfig> = {};
  @Input() currentPostId: string = '';
  @Input() layout: 'list' | 'grid' | 'minimal' = 'list';
  @Input() variant: 'sidebar' | 'featured' | 'footer' = 'sidebar';

  // Outputs
  @Output() postClick = new EventEmitter<BlogPost>();
  @Output() bookmarkToggle = new EventEmitter<{
    post: BlogPost;
    bookmarked: boolean;
  }>();

  // Estado reactivo
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _posts = signal<BlogPost[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly posts = this._posts.asReadonly();

  // Configuración por defecto
  private readonly defaultConfig: PopularPostsConfig = {
    title: 'Artículos Populares',
    limit: 5,
    showThumbnails: true,
    showDate: true,
    showViews: true,
    showBookmark: true,
    showExcerpt: false,
    sortBy: 'views',
    timeframe: 'month',
    excludeCurrentPost: true,
  };

  // Configuración final computada
  readonly finalConfig = computed(
    (): PopularPostsConfig => ({
      ...this.defaultConfig,
      ...this.config,
    })
  );

  // Posts filtrados y procesados
  readonly filteredPosts = computed(() => {
    const posts = this.posts();
    const config = this.finalConfig();

    let filtered = [...posts];

    // Excluir post actual si está configurado
    if (config.excludeCurrentPost && this.currentPostId) {
      filtered = filtered.filter((post) => post.id !== this.currentPostId);
    }

    // Filtrar por categorías si están especificadas
    if (config.categories && config.categories.length > 0) {
      filtered = filtered.filter((post) =>
        post.categories?.some((cat) => config.categories!.includes(cat.slug))
      );
    }

    // Limitar cantidad
    return filtered.slice(0, config.limit);
  });

  // Estadísticas computadas
  readonly postsStats = computed(() => {
    const posts = this.filteredPosts();
    return {
      total: posts.length,
      totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
      totalLikes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
      avgReadingTime:
        posts.length > 0
          ? Math.round(
              posts.reduce((sum, post) => sum + post.readingTime, 0) /
                posts.length
            )
          : 0,
    };
  });

  // Bookmarks
  readonly bookmarkIds = computed(() => this.bookmarkService.bookmarkIds());

  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadPopularPosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los posts populares
   */
  private loadPopularPosts(): void {
    this._loading.set(true);
    this._error.set(null);

    const config = this.finalConfig();

    // En una implementación real, esto haría una llamada al BlogService
    // con los parámetros de configuración
    this.blogService
      .getPopularPosts({
        sortBy: config.sortBy,
        timeframe: config.timeframe,
        limit: config.limit + 5, // Pedir algunos extra por si necesitamos filtrar
        categories: config.categories,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this._posts.set(posts);
          this._loading.set(false);
        },
        error: (error) => {
          console.error('Error loading popular posts:', error);
          this._error.set('Error al cargar artículos populares');
          this._loading.set(false);
        },
      });
  }

  /**
   * Maneja el click en un post
   */
  onPostClick(post: BlogPost): void {
    this.postClick.emit(post);
  }

  /**
   * Maneja el toggle de bookmark
   */
  onBookmarkToggle(post: BlogPost): void {
    const isBookmarked = this.bookmarkService.toggleBookmark(post);
    this.bookmarkToggle.emit({ post, bookmarked: isBookmarked });
  }

  /**
   * Verifica si un post está bookmarkeado
   */
  isBookmarked(postId: string): boolean {
    return this.bookmarkIds().has(postId);
  }

  /**
   * Formatea el número de vistas
   */
  formatViews(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }

  /**
   * Formatea la fecha relativa
   */
  formatRelativeDate(date: Date): string {
    if (!this.isBrowser) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `hace ${diffMinutes} min`;
      }
      return `hace ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'ayer';
    } else if (diffDays < 7) {
      return `hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtiene las clases CSS del contenedor
   */
  getContainerClasses(): string {
    const baseClasses = ['popular-posts'];

    baseClasses.push(`layout-${this.layout}`);
    baseClasses.push(`variant-${this.variant}`);

    return baseClasses.join(' ');
  }

  /**
   * Obtiene las clases CSS de un item de post
   */
  getPostItemClasses(post: BlogPost, index: number): string {
    const baseClasses = ['post-item'];

    // Agregar clase de ranking
    if (index === 0) baseClasses.push('rank-first');
    else if (index === 1) baseClasses.push('rank-second');
    else if (index === 2) baseClasses.push('rank-third');

    // Agregar clase si está bookmarkeado
    if (this.isBookmarked(post.id)) {
      baseClasses.push('bookmarked');
    }

    return baseClasses.join(' ');
  }

  /**
   * Obtiene el ícono de ranking
   */
  getRankingIcon(index: number): string {
    const icons = {
      0: '🏆', // Oro
      1: '🥈', // Plata
      2: '🥉', // Bronce
    };

    return icons[index as keyof typeof icons] || `${index + 1}`;
  }

  /**
   * Recarga los posts populares
   */
  refresh(): void {
    this.loadPopularPosts();
  }

  /**
   * TrackBy function para optimización de ngFor
   */
  trackByPostId(index: number, post: BlogPost): string {
    return post.id;
  }
}
