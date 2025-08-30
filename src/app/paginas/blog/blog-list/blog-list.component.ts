import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import {
  Subject,
  takeUntil,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

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
import type { BlogCategory } from '../../../core/models/categoria.interface';

// Interfaces específicas para la página
export interface BlogListState {
  posts: BlogPost[];
  featuredPosts: BlogPost[];
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

export interface BlogListFilters extends BlogFilters {
  searchQuery: string;
  showFeaturedOnly: boolean;
  dateRange: 'all' | 'week' | 'month' | 'year';
  categories: string[];  // Agregado para compatibilidad
}

export interface BlogListConfig {
  postsPerPage: number;
  showHeroSection: boolean;
  showFilters: boolean;
  showSidebar: boolean;
  paginationType: 'numeric' | 'loadmore' | 'infinite';
  gridLayout: 'masonry' | 'grid' | 'list';
  enableInfiniteScroll: boolean;
  preloadNextPage: boolean;
}

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BlogCardComponent,
    BlogSidebarComponent,
    BlogPaginationComponent,
    BlogSearchComponent,
    BreadcrumbComponent,
    NgOptimizedImage,
  ],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.css',
})
export class BlogListComponent implements OnInit, OnDestroy {
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

  // Estado inicial
  readonly filters = signal<BlogListFilters>({
    searchQuery: '',
    categoryIds: [],
    tags: [],
    authorId: '',
    sortBy: 'publishedAt',
    showFeaturedOnly: false,
    dateRange: 'all',
    categories: [],
  });

  readonly config = signal<BlogListConfig>({
    postsPerPage: 12,
    showHeroSection: true,
    showFilters: true,
    showSidebar: true,
    paginationType: 'numeric',
    gridLayout: 'grid',
    enableInfiniteScroll: false,
    preloadNextPage: true,
  });

  readonly pageState = signal<BlogListState>({
    posts: [],
    featuredPosts: [],
    totalPosts: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    isLoading: true,
    hasError: false,
    errorMessage: null,
  });

  // Estado computado
  readonly currentPosts = computed(() => this.pageState().posts);
  readonly featuredPosts = computed(() => this.pageState().featuredPosts);
  readonly featuredPost = computed(() => this.pageState().featuredPosts[0] || null);
  readonly isLoading = computed(() => this.pageState().isLoading);
  readonly hasError = computed(() => this.pageState().hasError);
  readonly isEmpty = computed(
    () =>
      !this.isLoading() && !this.hasError() && this.currentPosts().length === 0
  );
  readonly hasResults = computed(() => this.currentPosts().length > 0);
  readonly blogState = computed(() => this.pageState());

  // Filtros activos computados
  readonly activeFilters = computed(() => {
    const currentFilters = this.filters();
    return {
      hasCategories: (currentFilters.categoryIds?.length || 0) > 0,
      hasTags: (currentFilters.tags?.length || 0) > 0,
      hasAuthor: !!currentFilters.authorId,
      hasSearch: !!currentFilters.searchQuery,
      hasFeatured: currentFilters.showFeaturedOnly,
      hasDateRange: currentFilters.dateRange !== 'all',
      totalActive: [
        (currentFilters.categoryIds?.length || 0) > 0,
        (currentFilters.tags?.length || 0) > 0,
        !!currentFilters.authorId,
        !!currentFilters.searchQuery,
        currentFilters.showFeaturedOnly,
        currentFilters.dateRange !== 'all',
      ].filter(Boolean).length,
    };
  });

  readonly hasActiveFilters = computed(
    () => this.activeFilters().totalActive > 0
  );

  // Datos adicionales
  readonly categories = signal<BlogCategory[]>([]);
  readonly popularTags = signal<string[]>([]);

  // Paginación computada
  readonly paginationInfo = computed(() => {
    const state = this.pageState();
    const config = this.config();

    return {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalItems: state.totalPosts,
      itemsPerPage: config.postsPerPage,
      hasNextPage: state.hasNextPage,
      hasPrevPage: state.currentPage > 1,
      startItem: (state.currentPage - 1) * config.postsPerPage + 1,
      endItem: Math.min(
        state.currentPage * config.postsPerPage,
        state.totalPosts
      ),
    };
  });

  // Layout computado
  readonly layoutClasses = computed(() => {
    const layout = this.config().gridLayout;
    const baseClasses = 'blog-posts-grid';

    switch (layout) {
      case 'masonry':
        return `${baseClasses} grid-masonry columns-1 md:columns-2 lg:columns-3 gap-6`;
      case 'list':
        return `${baseClasses} grid-list space-y-6`;
      case 'grid':
      default:
        return `${baseClasses} grid-standard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`;
    }
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.setupRouteSubscription();
    this.setupSEO();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteSubscription(): void {
    // Escuchar cambios en query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$), debounceTime(100), distinctUntilChanged())
      .subscribe((params) => {
        this.updateFiltersFromParams(params);
        this.loadPosts();
      });
  }

  private updateFiltersFromParams(params: any): void {
    const currentFilters = this.filters();

    this.filters.set({
      ...currentFilters,
      searchQuery: params['q'] || '',
      categoryIds: params['category'] ? [params['category']] : [],
      tags: params['tag'] ? [params['tag']] : [],
      sortBy: params['sort'] || 'publishedAt',
      dateRange: params['date'] || 'all',
    });

    const currentPage = parseInt(params['page']) || 1;
    this.updateBlogState({ currentPage });
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Cargar categorías
      const categoriesData = await this.categoriaService
        .getCategories()
        .toPromise();
      if (categoriesData?.data) {
        this.categories.set(categoriesData.data);
      }

      // Cargar tags populares
      const popularTags = [
        'Angular',
        'TypeScript',
        'JavaScript',
        'CSS',
        'HTML',
        'React',
        'Vue',
        'Node.js',
        'Programming',
        'Web Development',
      ];
      this.popularTags.set(popularTags);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  private async loadPosts(): Promise<void> {
    try {
      this.updateBlogState({
        isLoading: true,
        hasError: false,
        errorMessage: null,
      });

      const filters = this.filters();
      const state = this.pageState();
      const config = this.config();

      // Parámetros de filtros
      const filterParams: BlogFilters = {
        sortBy: filters.sortBy,
        categoryIds: filters.categoryIds,
        tags: filters.tags,
        authorId: filters.authorId,
      };

      let postsResponse: BlogPostsResponse | undefined;

      // Realizar búsqueda o obtener posts normales
      if (filters.searchQuery) {
        const searchResults = await this.blogService
          .searchPosts(filters.searchQuery, filterParams)
          .toPromise();

        // Convertir resultado de búsqueda a BlogPostsResponse
        postsResponse = {
          data: searchResults || [],
          pagination: {
            currentPage: state.currentPage,
            totalPages: Math.ceil(
              (searchResults?.length || 0) / config.postsPerPage
            ),
            totalItems: searchResults?.length || 0,
            itemsPerPage: config.postsPerPage,
            hasPrevious: state.currentPage > 1,
            hasNext:
              state.currentPage <
              Math.ceil((searchResults?.length || 0) / config.postsPerPage),
          },
          filters: filterParams,
        };
      } else {
        postsResponse = await this.blogService
          .getPosts(state.currentPage, config.postsPerPage, filterParams)
          .toPromise();
      }

      if (postsResponse) {
        // Cargar post destacado si es la primera página y no hay filtros
        let featuredPost: BlogPost | null = null;
        if (
          state.currentPage === 1 &&
          !this.hasActiveFilters() &&
          config.showHeroSection
        ) {
          const featuredPosts = await this.blogService
            .getFeaturedPosts(1)
            .toPromise();
          featuredPost =
            featuredPosts && featuredPosts.length > 0 ? featuredPosts[0] : null;
        }

        this.updateBlogState({
          posts: postsResponse.data,
          featuredPosts: featuredPost ? [featuredPost] : [],
          totalPosts: postsResponse.pagination.totalItems,
          totalPages: postsResponse.pagination.totalPages,
          isLoading: false,
        });

        // Precargar siguiente página si está habilitado
        if (
          config.preloadNextPage &&
          state.currentPage < postsResponse.pagination.totalPages
        ) {
          this.preloadNextPage();
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      this.updateBlogState({
        isLoading: false,
        hasError: true,
        errorMessage: 'Error al cargar los posts. Inténtalo de nuevo.',
      });
    }
  }

  private async preloadNextPage(): Promise<void> {
    try {
      const filters = this.filters();
      const state = this.pageState();
      const config = this.config();

      const nextPageFilters: BlogFilters = {
        sortBy: filters.sortBy,
        categoryIds: filters.categoryIds,
        tags: filters.tags,
        authorId: filters.authorId,
      };

      // Precargar en segundo plano
      if (filters.searchQuery) {
        this.blogService
          .searchPosts(filters.searchQuery, nextPageFilters)
          .toPromise();
      } else {
        this.blogService
          .getPosts(state.currentPage + 1, config.postsPerPage, nextPageFilters)
          .toPromise();
      }
    } catch (error) {
      // Silencioso, es solo precarga
      console.warn('Error preloading next page:', error);
    }
  }

  private setupSEO(): void {
    // SEO básico
    this.titleService.setTitle('Blog - Últimos Artículos y Tutoriales');

    this.metaService.updateTag({
      name: 'description',
      content:
        'Descubre los últimos artículos sobre desarrollo web, programación y tecnología. Tutoriales, guías y consejos prácticos para desarrolladores.',
    });

    this.metaService.updateTag({
      name: 'keywords',
      content:
        'blog, desarrollo web, programación, tutoriales, JavaScript, TypeScript, Angular',
    });

    // Open Graph
    this.metaService.updateTag({
      property: 'og:title',
      content: 'Blog - Últimos Artículos y Tutoriales',
    });
    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Descubre los últimos artículos sobre desarrollo web y programación',
    });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: 'Blog - Últimos Artículos y Tutoriales',
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content:
        'Descubre los últimos artículos sobre desarrollo web y programación',
    });
  }

  // Métodos públicos para el template
  onSearchPerformed(event: {
    query: string;
    filters: any;
    results: BlogPost[];
  }): void {
    this.filters.update((current) => ({
      ...current,
      searchQuery: event.query,
      categories: event.filters.categories || [],
      categoryIds: event.filters.categories || [],
      tags: event.filters.tags || [],
      sortBy: event.filters.sortBy || current.sortBy,
    }));

    this.updateUrlParams();
  }

  onFilterChanged(newFilters: Partial<BlogListFilters>): void {
    this.filters.update((current) => ({ ...current, ...newFilters }));
    this.updateBlogState({ currentPage: 1 });
    this.updateUrlParams();
    this.loadPosts();
  }

  onSortChanged(value: string): void {
    const sortBy = value as BlogSortBy;
    this.filters.update((current) => ({ ...current, sortBy }));
    this.updateBlogState({ currentPage: 1 });
    this.updateUrlParams();
    this.loadPosts();
  }

  onPageChanged(page: number): void {
    this.updateBlogState({ currentPage: page });
    this.updateUrlParams();
    this.loadPosts();

    // Scroll to top
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onLoadMore(): void {
    const state = this.pageState();
    if (state.currentPage < state.totalPages) {
      this.onPageChanged(state.currentPage + 1);
    }
  }

  onPostClick(post: BlogPost): void {
    this.router.navigate(['/blog/post', post.slug]);
  }

  onCategoryClick(event: { post: BlogPost; categoryId: string }): void {
    const category = this.categories().find((cat) => cat.id === event.categoryId);
    if (category) {
      this.router.navigate(['/blog/categoria', category.slug]);
    }
  }

  onCategoryDirectClick(categoryId: string): void {
    const category = this.categories().find((cat) => cat.id === categoryId);
    if (category) {
      this.router.navigate(['/blog/categoria', category.slug]);
    }
  }

  onTagClick(event: { post: BlogPost; tag: string }): void {
    this.filters.update((current) => ({
      ...current,
      tags: [event.tag],
      searchQuery: '',
    }));
    this.updateBlogState({ currentPage: 1 });
    this.updateUrlParams();
    this.loadPosts();
  }

  clearAllFilters(): void {
    this.filters.set({
      categoryIds: [],
      tags: [],
      authorId: '',
      searchQuery: '',
      sortBy: 'publishedAt',
      showFeaturedOnly: false,
      dateRange: 'all',
      categories: [],
    });
    this.updateBlogState({ currentPage: 1 });
    this.router.navigate([], { queryParams: {} });
  }

  // Sidebar event handlers
  onSidebarCategoryClick(category: BlogCategory): void {
    this.router.navigate(['/blog/categoria', category.slug]);
  }

  onSidebarTagClick(tag: string): void {
    this.filters.update((current) => ({
      ...current,
      tags: [tag],
      searchQuery: '',
    }));
    this.updateBlogState({ currentPage: 1 });
    this.updateUrlParams();
    this.loadPosts();
  }

  retryLoading(): void {
    this.loadPosts();
  }

  // Configuración de layout
  setLayoutMode(layout: string): void {
    const validLayout = layout as BlogListConfig['gridLayout'];
    this.config.update((current) => ({ ...current, gridLayout: validLayout }));

    // Guardar preferencia en localStorage
    if (this.isBrowser) {
      localStorage.setItem('blog-layout-preference', layout);
    }
  }

  // Métodos de utilidad
  private updateBlogState(updates: Partial<BlogListState>): void {
    this.pageState.update((current) => ({ ...current, ...updates }));
  }

  private updateUrlParams(): void {
    const filters = this.filters();
    const state = this.pageState();

    const queryParams: any = {};

    if (filters.searchQuery) queryParams.q = filters.searchQuery;
    if (filters.categoryIds && filters.categoryIds.length > 0)
      queryParams.category = filters.categoryIds[0];
    if (filters.tags && filters.tags.length > 0)
      queryParams.tag = filters.tags[0];
    if (filters.sortBy !== 'publishedAt') queryParams.sort = filters.sortBy;
    if (filters.dateRange !== 'all') queryParams.date = filters.dateRange;
    if (state.currentPage > 1) queryParams.page = state.currentPage;

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'replace',
    });
  }

  // Track by functions para performance
  trackByPost(index: number, post: BlogPost): string {
    return post.id;
  }

  trackByCategory(index: number, category: BlogCategory): string {
    return category.id;
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  // Métodos auxiliares para el template
  getCategoryName(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  removeCategoryFilter(categoryId: string): void {
    const newCategories =
      this.filters().categoryIds?.filter((id) => id !== categoryId) || [];
    this.onFilterChanged({ categoryIds: newCategories });
  }

  removeTagFilter(tag: string): void {
    const newTags = this.filters().tags?.filter((t) => t !== tag) || [];
    this.onFilterChanged({ tags: newTags });
  }

  // Getters para el template
  get currentLayoutIcon(): string {
    const layout = this.config().gridLayout;
    switch (layout) {
      case 'masonry':
        return 'view-columns';
      case 'list':
        return 'list-bullet';
      case 'grid':
      default:
        return 'squares-2x2';
    }
  }

  get sortOptions(): Array<{ value: BlogSortBy; label: string }> {
    return [
      { value: 'publishedAt', label: 'Más recientes' },
      { value: 'createdAt', label: 'Más antiguos' },
      { value: 'views', label: 'Más vistos' },
      { value: 'likes', label: 'Más valorados' },
      { value: 'title', label: 'Por título' },
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
}
