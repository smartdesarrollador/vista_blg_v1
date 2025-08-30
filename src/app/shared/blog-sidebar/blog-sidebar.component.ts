import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import type { BlogPost, BlogAuthor } from '../../core/models/blog.interface';
import type { BlogCategory } from '../../core/models/categoria.interface';
import { BlogService } from '../../core/services/blog.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { SSROptimizationService } from '../../core/services/ssr-optimization.service';

/**
 * Configuración de widgets del sidebar
 */
export interface SidebarWidgetConfig {
  popularPosts: {
    enabled: boolean;
    limit: number;
    showThumbnails: boolean;
    showDate: boolean;
    showViews: boolean;
  };
  categories: {
    enabled: boolean;
    limit: number;
    showCounts: boolean;
    showIcons: boolean;
    hierarchical: boolean;
  };
  tags: {
    enabled: boolean;
    limit: number;
    showAsCloud: boolean;
    minFontSize: number;
    maxFontSize: number;
  };
  aboutAuthor: {
    enabled: boolean;
    showBio: boolean;
    showSocialLinks: boolean;
    showStats: boolean;
  };
  newsletter: {
    enabled: boolean;
    showDescription: boolean;
  };
}

/**
 * Información del autor para el widget
 */
export interface AuthorInfo extends BlogAuthor {
  postsCount?: number;
  totalViews?: number;
  totalLikes?: number;
}

/**
 * Componente Blog Sidebar
 * Sidebar modular con widgets configurables para el blog
 */
@Component({
  selector: 'app-blog-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './blog-sidebar.component.html',
  styleUrls: ['./blog-sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogSidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  // Services
  private readonly blogService = inject(BlogService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ssrOptimization = inject(SSROptimizationService);
  private readonly elementRef = inject(ElementRef);

  // Inputs
  @Input() config: Partial<SidebarWidgetConfig> = {};
  @Input() featuredAuthor: AuthorInfo | null = null;
  @Input() isSticky: boolean = true;
  @Input() isMobile: boolean = false;

  // Outputs
  @Output() postClick = new EventEmitter<BlogPost>();
  @Output() categoryClick = new EventEmitter<BlogCategory>();
  @Output() tagClick = new EventEmitter<string>();
  @Output() authorClick = new EventEmitter<AuthorInfo>();
  @Output() newsletterSubmit = new EventEmitter<string>();

  // Estado reactivo
  private readonly _destroy$ = new Subject<void>();
  private readonly _popularPosts = signal<BlogPost[]>([]);
  private readonly _categories = signal<BlogCategory[]>([]);
  private readonly _allTags = signal<string[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Configuración por defecto
  private readonly _defaultConfig: SidebarWidgetConfig = {
    popularPosts: {
      enabled: true,
      limit: 5,
      showThumbnails: true,
      showDate: true,
      showViews: true,
    },
    categories: {
      enabled: true,
      limit: 8,
      showCounts: true,
      showIcons: true,
      hierarchical: false,
    },
    tags: {
      enabled: true,
      limit: 20,
      showAsCloud: true,
      minFontSize: 12,
      maxFontSize: 18,
    },
    aboutAuthor: {
      enabled: true,
      showBio: true,
      showSocialLinks: true,
      showStats: true,
    },
    newsletter: {
      enabled: true,
      showDescription: true,
    },
  };

  // Computed properties
  protected readonly finalConfig = computed<SidebarWidgetConfig>(() => ({
    ...this._defaultConfig,
    ...this.config,
  }));

  protected readonly popularPosts = this._popularPosts.asReadonly();
  protected readonly categories = this._categories.asReadonly();
  protected readonly allTags = this._allTags.asReadonly();
  protected readonly loading = this._loading.asReadonly();
  protected readonly error = this._error.asReadonly();

  // Tags para nube con tamaños calculados
  protected readonly tagCloud = computed(() => {
    const config = this.finalConfig().tags;
    const tags = this.allTags().slice(0, config.limit);

    if (!config.showAsCloud) {
      return tags.map((tag) => ({ name: tag, size: config.minFontSize }));
    }

    // Simular popularidad de tags (en producción vendría del backend)
    return tags
      .map((tag, index) => {
        const popularity = Math.random();
        const fontSize =
          config.minFontSize +
          (config.maxFontSize - config.minFontSize) * popularity;

        return {
          name: tag,
          size: Math.round(fontSize),
          popularity,
        };
      })
      .sort((a, b) => b.popularity - a.popularity);
  });

  protected readonly sidebarClasses = computed(() => {
    const baseClasses = ['blog-sidebar', 'space-y-6'];

    if (this.isSticky && !this.isMobile) {
      baseClasses.push('sticky', 'top-6');
    }

    if (this.isMobile) {
      baseClasses.push('mobile-sidebar');
    }

    return baseClasses.join(' ');
  });

  constructor() {}

  ngOnInit(): void {
    this._loadSidebarData();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Registrar componente para optimización SSR
    this.ssrOptimization.registerComponent(
      'blog-sidebar',
      this.elementRef.nativeElement
    );
  }

  // Métodos públicos para eventos
  protected onPostClick(post: BlogPost): void {
    this.postClick.emit(post);
  }

  protected onCategoryClick(category: BlogCategory): void {
    this.categoryClick.emit(category);
  }

  protected onTagClick(tag: string): void {
    this.tagClick.emit(tag);
  }

  protected onAuthorClick(): void {
    if (this.featuredAuthor) {
      this.authorClick.emit(this.featuredAuthor);
    }
  }

  protected onNewsletterSubmit(email: string): void {
    this.newsletterSubmit.emit(email);
  }

  // Utilidades para templates
  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  protected formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  protected truncateText(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }

  protected getTagFontSize(tag: { name: string; size: number }): string {
    return `${tag.size}px`;
  }

  protected getCategoryIcon(category: BlogCategory): string {
    return category.icon || '📁';
  }

  // TrackBy functions para optimización
  protected trackByPost(index: number, post: BlogPost): string {
    return post.id;
  }

  protected trackByCategory(index: number, category: BlogCategory): string {
    return category.id;
  }

  protected trackByTag(index: number, tag: string | { name: string }): string {
    return typeof tag === 'string' ? tag : tag.name;
  }

  // Métodos privados
  private _loadSidebarData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server-side
    }

    this._loading.set(true);

    const popularPosts$ = this.blogService.getPopularPosts(
      this.finalConfig().popularPosts.limit
    );
    const categories$ = this.categoriaService.getPopularCategories(
      this.finalConfig().categories.limit
    );
    const stats$ = this.blogService.getBlogStats();

    combineLatest([popularPosts$, categories$, stats$])
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: ([posts, categories, stats]) => {
          this._popularPosts.set(posts);
          this._categories.set(categories);

          // Extraer tags únicos de los posts populares
          const allTags = posts.reduce((tags: string[], post) => {
            return [...tags, ...post.tags];
          }, []);

          const uniqueTags = [...new Set(allTags)];
          this._allTags.set(uniqueTags);

          this._loading.set(false);
        },
        error: (error) => {
          console.error('Error loading sidebar data:', error);
          this._error.set('Error al cargar datos del sidebar');
          this._loading.set(false);
        },
      });
  }
}
