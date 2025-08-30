import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil, switchMap, combineLatest } from 'rxjs';

// Componentes compartidos
import { BlogCardComponent } from '../../../shared/blog-card/blog-card.component';
import { BlogSidebarComponent } from '../../../shared/blog-sidebar/blog-sidebar.component';
import { BlogPaginationComponent } from '../../../shared/blog-pagination/blog-pagination.component';
import { BlogSearchComponent } from '../../../shared/blog-search/blog-search.component';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

// Servicios
import { BlogService } from '../../../core/services/blog.service';
import { CategoriaService } from '../../../core/services/categoria.service';

// Interfaces
import type {
  BlogPost,
  BlogFilters,
  BlogSortBy,
  BlogPostsResponse,
} from '../../../core/models/blog.interface';
import type {
  BlogCategory,
  CategoryStats,
} from '../../../core/models/categoria.interface';

// Interfaces específicas para la página
export interface CategoryPageState {
  category: BlogCategory | null;
  posts: BlogPost[];
  subcategories: BlogCategory[];
  relatedCategories: BlogCategory[];
  categoryStats: CategoryStats | null;
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

export interface CategoryPageConfig {
  postsPerPage: number;
  showSubcategories: boolean;
  showRelatedCategories: boolean;
  showCategoryStats: boolean;
  showFilters: boolean;
  showSidebar: boolean;
  gridLayout: 'grid' | 'list' | 'masonry';
  enableSEOOptimization: boolean;
}

export interface CategoryFilters extends BlogFilters {
  includeFeatured: boolean;
  dateRange: 'all' | 'week' | 'month' | 'year';
  minReadingTime?: number;
  maxReadingTime?: number;
}

@Component({
  selector: 'app-blog-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BlogCardComponent,
    BlogSidebarComponent,
    BlogPaginationComponent,
    BlogSearchComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './blog-category.component.html',
  styleUrl: './blog-category.component.css',
})
export class BlogCategoryComponent implements OnInit, OnDestroy {
  // Referencias y servicios
  private readonly blogService = inject(BlogService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly destroy$ = new Subject<void>();
  private isBrowser = false;

  // Signals para estado
  readonly pageState = signal<CategoryPageState>({
    category: null,
    posts: [],
    subcategories: [],
    relatedCategories: [],
    categoryStats: null,
    totalPosts: 0,
    currentPage: 1,
    totalPages: 0,
    isLoading: true,
    hasError: false,
    errorMessage: null,
  });

  readonly filters = signal<CategoryFilters>({
    categoryIds: [],
    tags: [],
    authorId: '',
    sortBy: 'publishedAt',
    includeFeatured: false,
    dateRange: 'all',
  });

  readonly config = signal<CategoryPageConfig>({
    postsPerPage: 12,
    showSubcategories: true,
    showRelatedCategories: true,
    showCategoryStats: true,
    showFilters: true,
    showSidebar: true,
    gridLayout: 'grid',
    enableSEOOptimization: true,
  });

  // Estado computado
  readonly currentCategory = computed(() => this.pageState().category);
  readonly currentPosts = computed(() => this.pageState().posts);
  readonly subcategories = computed(() => this.pageState().subcategories);
  readonly relatedCategories = computed(
    () => this.pageState().relatedCategories
  );
  readonly categoryStats = computed(() => this.pageState().categoryStats);
  readonly isLoading = computed(() => this.pageState().isLoading);
  readonly hasError = computed(() => this.pageState().hasError);
  readonly hasResults = computed(() => this.currentPosts().length > 0);
  readonly isEmpty = computed(
    () =>
      !this.isLoading() && !this.hasError() && this.currentPosts().length === 0
  );

  // Filtros activos computados
  readonly activeFilters = computed(() => {
    const currentFilters = this.filters();
    return {
      hasTags: (currentFilters.tags?.length || 0) > 0,
      hasAuthor: !!currentFilters.authorId,
      hasDateRange: currentFilters.dateRange !== 'all',
      hasFeatured: currentFilters.includeFeatured,
      hasReadingTime:
        currentFilters.minReadingTime !== undefined ||
        currentFilters.maxReadingTime !== undefined,
      totalActive: [
        (currentFilters.tags?.length || 0) > 0,
        !!currentFilters.authorId,
        currentFilters.dateRange !== 'all',
        currentFilters.includeFeatured,
        currentFilters.minReadingTime !== undefined ||
          currentFilters.maxReadingTime !== undefined,
      ].filter(Boolean).length,
    };
  });

  // Paginación computada
  readonly paginationInfo = computed(() => {
    const state = this.pageState();
    const config = this.config();

    return {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalItems: state.totalPosts,
      itemsPerPage: config.postsPerPage,
      hasNextPage: state.currentPage < state.totalPages,
      hasPrevPage: state.currentPage > 1,
      startItem: (state.currentPage - 1) * config.postsPerPage + 1,
      endItem: Math.min(
        state.currentPage * config.postsPerPage,
        state.totalPosts
      ),
    };
  });

  // SEO metadata computado
  readonly seoMetadata = computed(() => {
    const category = this.currentCategory();
    if (!category) return null;

    const stats = this.categoryStats();
    const postsCount = stats?.totalPosts || 0;

    return {
      title: `${category.name} - Blog`,
      description:
        category.description ||
        `Artículos sobre ${category.name}. ${postsCount} artículos disponibles.`,
      keywords: `${category.name}, blog, artículos`,
      canonicalUrl: this.isBrowser ? window.location.href : '',
      ogImage: category.image || '/assets/images/category-default.jpg',
      breadcrumbs: this.generateBreadcrumbs(category),
    };
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.setupRouteSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteSubscription(): void {
    // Combinar params y queryParams
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, queryParams]) => {
          const slug = params['slug'];
          if (!slug) {
            this.router.navigate(['/blog']);
            return [];
          }

          // Actualizar filtros desde query params
          this.updateFiltersFromParams(queryParams);

          return this.loadCategoryData(slug);
        })
      )
      .subscribe();
  }

  private updateFiltersFromParams(params: any): void {
    const currentFilters = this.filters();

    this.filters.set({
      ...currentFilters,
      tags: params['tag'] ? [params['tag']] : [],
      authorId: params['author'] || '',
      sortBy: params['sort'] || 'publishedAt',
      dateRange: params['date'] || 'all',
      includeFeatured: params['featured'] === 'true',
    });

    const currentPage = parseInt(params['page']) || 1;
    this.updatePageState({ currentPage });
  }

  private async loadCategoryData(slug: string) {
    try {
      this.updatePageState({
        isLoading: true,
        hasError: false,
        errorMessage: null,
      });

      // Cargar categoría principal
      const category = await this.loadCategoryBySlug(slug);
      if (!category) {
        this.updatePageState({
          hasError: true,
          errorMessage: 'Categoría no encontrada',
          isLoading: false,
        });
        return;
      }

      // Cargar datos relacionados en paralelo
      const [posts, subcategories, relatedCategories, stats] =
        await Promise.all([
          this.loadCategoryPosts(category.id),
          this.loadSubcategories(category.id),
          this.loadRelatedCategories(category.id),
          this.loadCategoryStats(category.id),
        ]);

      this.updatePageState({
        category,
        posts: posts?.data || [],
        subcategories,
        relatedCategories,
        categoryStats: stats,
        totalPosts: posts?.pagination?.totalItems || 0,
        totalPages: posts?.pagination?.totalPages || 0,
        isLoading: false,
      });

      // Configurar SEO
      if (this.config().enableSEOOptimization) {
        this.setupSEO(category, stats);
      }
    } catch (error) {
      console.error('Error loading category data:', error);
      this.updatePageState({
        hasError: true,
        errorMessage: 'Error al cargar la categoría',
        isLoading: false,
      });
    }
  }

  private async loadCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    try {
      const categoriesResponse = await this.categoriaService
        .getCategories()
        .toPromise();
      return categoriesResponse?.data?.find((cat) => cat.slug === slug) || null;
    } catch (error) {
      console.error('Error loading category:', error);
      return null;
    }
  }

  private async loadCategoryPosts(
    categoryId: string
  ): Promise<BlogPostsResponse | null> {
    try {
      const filters = this.filters();
      const state = this.pageState();
      const config = this.config();

      const blogFilters: BlogFilters = {
        categoryIds: [categoryId],
        tags: filters.tags,
        authorId: filters.authorId,
        sortBy: filters.sortBy,
      };

      return (
        (await this.blogService.getPosts(state.currentPage, config.postsPerPage, blogFilters).toPromise()) || null
      );
    } catch (error) {
      console.error('Error loading category posts:', error);
      return null;
    }
  }

  private async loadSubcategories(
    parentCategoryId: string
  ): Promise<BlogCategory[]> {
    try {
      if (!this.config().showSubcategories) return [];

      const categoriesResponse = await this.categoriaService
        .getCategories(1, 100)
        .toPromise();

      return categoriesResponse?.data || [];
    } catch (error) {
      console.error('Error loading subcategories:', error);
      return [];
    }
  }

  private async loadRelatedCategories(
    categoryId: string
  ): Promise<BlogCategory[]> {
    try {
      if (!this.config().showRelatedCategories) return [];

      // Obtener categorías relacionadas (simulado por ahora)
      const categoriesResponse = await this.categoriaService
        .getCategories()
        .toPromise();
      const allCategories = categoriesResponse?.data || [];

      // Filtrar la categoría actual y tomar las primeras 4
      return allCategories
        .filter((cat) => cat.id !== categoryId)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
    } catch (error) {
      console.error('Error loading related categories:', error);
      return [];
    }
  }

  private async loadCategoryStats(
    categoryId: string
  ): Promise<CategoryStats | null> {
    try {
      if (!this.config().showCategoryStats) return null;

      // Por ahora retornamos stats simuladas
      // En el futuro, esto vendría de la API
      return {
        categoryId: categoryId,
        totalPosts: 0, // Se actualiza después
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: Math.floor(Math.random() * 10000) + 1000,
        totalLikes: Math.floor(Math.random() * 1000) + 100,
        totalComments: Math.floor(Math.random() * 500) + 50,
        averageReadingTime: Math.floor(Math.random() * 10) + 5,
        growthRate: Math.random() * 50 + 10,
        popularPosts: [],
        trend: {
          postsGrowth: Math.floor(Math.random() * 20) - 10,
          viewsGrowth: Math.floor(Math.random() * 30) - 15,
          engagementGrowth: Math.floor(Math.random() * 25) - 12,
        },
      };
    } catch (error) {
      console.error('Error loading category stats:', error);
      return null;
    }
  }

  private setupSEO(category: BlogCategory, stats: CategoryStats | null): void {
    const metadata = this.seoMetadata();
    if (!metadata) return;

    // Title y meta description
    this.titleService.setTitle(metadata.title);
    this.metaService.updateTag({
      name: 'description',
      content: metadata.description,
    });
    this.metaService.updateTag({
      name: 'keywords',
      content: metadata.keywords,
    });

    // Open Graph
    this.metaService.updateTag({
      property: 'og:title',
      content: metadata.title,
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: metadata.description,
    });
    this.metaService.updateTag({
      property: 'og:image',
      content: metadata.ogImage,
    });
    this.metaService.updateTag({
      property: 'og:url',
      content: metadata.canonicalUrl,
    });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: metadata.title,
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: metadata.description,
    });
    this.metaService.updateTag({
      name: 'twitter:image',
      content: metadata.ogImage,
    });

    // Canonical URL
    if (this.isBrowser) {
      this.metaService.updateTag({
        rel: 'canonical',
        href: metadata.canonicalUrl,
      });
    }

    // Schema.org structured data
    this.setupStructuredData(category, stats);
  }

  private setupStructuredData(
    category: BlogCategory,
    stats: CategoryStats | null
  ): void {
    if (!this.isBrowser) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.description,
      url: window.location.href,
      mainEntity: {
        '@type': 'ItemList',
        name: `Artículos de ${category.name}`,
        numberOfItems: stats?.totalPosts || 0,
        itemListElement: this.currentPosts().map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.featuredImage,
            datePublished: post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.author?.name || 'Autor desconocido',
            },
          },
        })),
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: this.generateBreadcrumbs(category).map(
          (crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })
        ),
      },
    };

    // Remover script anterior
    const existingScript = document.getElementById('category-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Agregar nuevo script
    const script = document.createElement('script');
    script.id = 'category-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  private generateBreadcrumbs(
    category: BlogCategory
  ): Array<{ name: string; url: string }> {
    const breadcrumbs = [
      { name: 'Inicio', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: category.name, url: `/blog/categoria/${category.slug}` },
    ];

    // Si tiene categoría padre, agregarla
    if (category.parentId) {
      // Buscar categoría padre (simplificado)
      breadcrumbs.splice(-1, 0, {
        name: 'Categoría Padre',
        url: `/blog/categoria/parent-slug`,
      });
    }

    return breadcrumbs;
  }

  // Métodos públicos para el template
  onPostClick(post: BlogPost): void {
    this.router.navigate(['/blog/post', post.slug]);
  }

  onSubcategoryClick(event: { post: BlogPost; categoryId: string }): void {
    const category = this.subcategories().find(cat => cat.id === event.categoryId);
    if (category) {
      this.router.navigate(['/blog/categoria', category.slug]);
    }
  }

  onSubcategoryNavClick(subcategory: BlogCategory): void {
    this.router.navigate(['/blog/categoria', subcategory.slug]);
  }

  onRelatedCategoryClick(category: BlogCategory): void {
    this.router.navigate(['/blog/categoria', category.slug]);
  }

  onTagClick(event: { post: BlogPost; tag: string }): void {
    const tag = event.tag;
    this.filters.update((current) => ({
      ...current,
      tags: (current.tags || []).includes(tag)
        ? (current.tags || []).filter((t) => t !== tag)
        : [...(current.tags || []), tag],
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  onTagDirectClick(tag: string): void {
    this.filters.update((current) => ({
      ...current,
      tags: (current.tags || []).includes(tag)
        ? (current.tags || []).filter((t) => t !== tag)
        : [...(current.tags || []), tag],
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  onAuthorClick(author: string): void {
    this.filters.update((current) => ({
      ...current,
      authorId: current.authorId === author ? '' : author,
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  // Sidebar event handlers
  onSidebarCategoryClick(category: BlogCategory): void {
    this.router.navigate(['/blog/categoria', category.slug]);
  }

  onSidebarTagClick(tag: string): void {
    this.filters.update((current) => ({
      ...current,
      tags: (current.tags || []).includes(tag)
        ? (current.tags || []).filter((t) => t !== tag)
        : [...(current.tags || []), tag],
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  onSortChanged(sortBy: BlogSortBy): void {
    this.filters.update((current) => ({ ...current, sortBy }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  onFilterChanged(newFilters: Partial<CategoryFilters>): void {
    this.filters.update((current) => ({ ...current, ...newFilters }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  onPageChanged(page: number): void {
    this.updatePageState({ currentPage: page });
    this.updateUrlParams();
    this.reloadPosts();

    // Scroll to top
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleFeaturedFilter(): void {
    this.filters.update((current) => ({
      ...current,
      includeFeatured: !current.includeFeatured,
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  clearAllFilters(): void {
    this.filters.set({
      categoryIds: [this.currentCategory()?.id || ''],
      tags: [],
      authorId: '',
      sortBy: 'publishedAt',
      includeFeatured: false,
      dateRange: 'all',
    });
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  clearAuthorFilter(): void {
    this.filters.update((current) => ({
      ...current,
      authorId: '',
    }));
    this.updatePageState({ currentPage: 1 });
    this.updateUrlParams();
    this.reloadPosts();
  }

  setLayoutMode(layout: CategoryPageConfig['gridLayout']): void {
    this.config.update((current) => ({ ...current, gridLayout: layout }));

    // Guardar preferencia en localStorage
    if (this.isBrowser) {
      localStorage.setItem('category-layout-preference', layout);
    }
  }

  // Métodos privados
  private async reloadPosts(): Promise<void> {
    const category = this.currentCategory();
    if (!category) return;

    try {
      this.updatePageState({ isLoading: true });

      const posts = await this.loadCategoryPosts(category.id);

      this.updatePageState({
        posts: posts?.data || [],
        totalPosts: posts?.pagination?.totalItems || 0,
        totalPages: posts?.pagination?.totalPages || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error reloading posts:', error);
      this.updatePageState({ isLoading: false });
    }
  }

  private updatePageState(updates: Partial<CategoryPageState>): void {
    this.pageState.update((current) => ({ ...current, ...updates }));
  }

  private updateUrlParams(): void {
    const filters = this.filters();
    const state = this.pageState();

    const queryParams: any = {};

    if (filters.tags && filters.tags.length > 0) queryParams.tag = filters.tags[0];
    if (filters.authorId) queryParams.author = filters.authorId;
    if (filters.sortBy !== 'publishedAt') queryParams.sort = filters.sortBy;
    if (filters.dateRange !== 'all') queryParams.date = filters.dateRange;
    if (filters.includeFeatured) queryParams.featured = 'true';
    if (state.currentPage > 1) queryParams.page = state.currentPage;

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'replace',
    });
  }

  // Getters para el template
  get layoutClasses(): string {
    const layout = this.config().gridLayout;
    const baseClasses = 'posts-grid';

    switch (layout) {
      case 'masonry':
        return `${baseClasses} grid-masonry columns-1 md:columns-2 lg:columns-3 gap-6`;
      case 'list':
        return `${baseClasses} grid-list space-y-6`;
      case 'grid':
      default:
        return `${baseClasses} grid-standard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`;
    }
  }

  get sortOptions(): Array<{ value: BlogSortBy; label: string }> {
    return [
      { value: 'publishedAt', label: 'Más recientes' },
      { value: 'createdAt', label: 'Más antiguos' },
      { value: 'views', label: 'Más populares' },
      { value: 'views', label: 'Más vistos' },
      { value: 'likes', label: 'Más valorados' },
    ];
  }

  get dateRangeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'all', label: 'Todo el tiempo' },
      { value: 'week', label: 'Esta semana' },
      { value: 'month', label: 'Este mes' },
      { value: 'year', label: 'Este año' },
    ];
  }

  // Track by functions para performance
  trackByPost(index: number, post: BlogPost): string {
    return post.id;
  }

  trackByCategory(index: number, category: BlogCategory): string {
    return category.id;
  }

  // Métodos de utilidad
  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-ES').format(num);
  }

  formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
  }

  getCategoryIcon(category: BlogCategory): string {
    // Mapeo de iconos por categoría
    const iconMap: Record<string, string> = {
      tecnologia:
        'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      programacion:
        'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      design:
        'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z',
      default:
        'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    };

    return iconMap[category.slug] || iconMap['default'];
  }
}
