import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// Core interfaces
import {
  BlogPost,
  BlogFilters,
  BlogSortBy,
} from '../../../core/models/blog.interface';
import { BlogCategory } from '../../../core/models/categoria.interface';

// Services
import { BlogService } from '../../../core/services/blog.service';
import { CategoriaService } from '../../../core/services/categoria.service';

// Shared components
import { BlogCardComponent } from '../../../shared/blog-card/blog-card.component';
import { BlogSidebarComponent } from '../../../shared/blog-sidebar/blog-sidebar.component';
import { BlogPaginationComponent } from '../../../shared/blog-pagination/blog-pagination.component';
import { BlogSearchComponent as SharedBlogSearchComponent } from '../../../shared/blog-search/blog-search.component';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

interface SearchFilters extends BlogFilters {
  query: string;
  categories: string[];
  authors?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  sortBy: BlogSortBy;
}

interface SearchSuggestion {
  type: 'query' | 'category' | 'tag' | 'author';
  value: string;
  label: string;
  count?: number;
}

interface SearchHighlight {
  field: 'title' | 'content' | 'excerpt';
  fragments: string[];
}

interface SearchStats {
  totalResults: number;
  searchTime: number;
  mostRelevant: number;
  categories: { [key: string]: number };
}

@Component({
  selector: 'app-blog-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BlogCardComponent,
    BlogSidebarComponent,
    BlogPaginationComponent,
    SharedBlogSearchComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './blog-search.component.html',
  styleUrls: ['./blog-search.component.css'],
})
export class BlogSearchComponent implements OnInit, OnDestroy {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private blogService = inject(BlogService);
  private categoriaService = inject(CategoriaService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  // Signals para estado reactivo
  searchQuery = signal<string>('');
  searchResults = signal<BlogPost[]>([]);
  filteredResults = signal<BlogPost[]>([]);
  categories = signal<BlogCategory[]>([]);
  searchFilters = signal<SearchFilters>({
    query: '',
    categories: [],
    tags: [],
    sortBy: 'publishedAt',
    dateRange: undefined,
  });
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  totalResults = signal<number>(0);
  isLoading = signal<boolean>(false);
  searchTime = signal<number>(0);
  suggestions = signal<SearchSuggestion[]>([]);
  highlights = signal<{ [postId: string]: SearchHighlight[] }>({});
  searchStats = signal<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    mostRelevant: 0,
    categories: {},
  });

  // Computed signals
  hasResults = computed(() => this.searchResults().length > 0);
  isEmptyQuery = computed(() => !this.searchQuery().trim());
  totalPages = computed(() => Math.ceil(this.totalResults() / this.pageSize()));
  resultRange = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(
      this.currentPage() * this.pageSize(),
      this.totalResults()
    );
    return { start, end };
  });

  // Configuration
  readonly itemsPerPage = [6, 12, 24, 48];
  readonly sortOptions = [
    { value: 'relevance', label: 'Relevancia' },
    { value: 'date_desc', label: 'Más recientes' },
    { value: 'date_asc', label: 'Más antiguos' },
    { value: 'views_desc', label: 'Más vistos' },
    { value: 'likes_desc', label: 'Más populares' },
    { value: 'title_asc', label: 'Título A-Z' },
  ];

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        const query = params['q'] || '';
        const categories = params['categories']
          ? params['categories'].split(',')
          : [];
        const sortBy = params['sort'] || 'relevance';
        const page = parseInt(params['page']) || 1;
        const size = parseInt(params['size']) || 12;

        // Actualizar signals
        this.searchQuery.set(query);
        this.currentPage.set(page);
        this.pageSize.set(size);
        this.searchFilters.update((filters) => ({
          ...filters,
          query,
          categories,
          sortBy: sortBy as BlogSortBy,
        }));

        if (query.trim()) {
          this.performSearch();
        }

        this.updateSEOTags();
      })
    );

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async loadCategories(): Promise<void> {
    try {
      const categoriesResponse = await this.categoriaService.getCategories().toPromise();
      if (categoriesResponse?.data) {
        this.categories.set(categoriesResponse.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  private async performSearch(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      this.filteredResults.set([]);
      this.totalResults.set(0);
      return;
    }

    this.isLoading.set(true);
    const startTime = performance.now();

    try {
      // Realizar búsqueda usando el servicio
      const results = await this.blogService.searchPosts(
        query,
        this.searchFilters()
      ).toPromise() || [];

      // Generar highlights
      const highlights = this.generateHighlights(results, query);
      this.highlights.set(highlights);

      // Aplicar filtros adicionales
      const filteredResults = this.applyAdvancedFilters(results);

      // Generar sugerencias
      const suggestions = this.generateSuggestions(query, results);
      this.suggestions.set(suggestions);

      // Calcular estadísticas
      const stats = this.calculateSearchStats(
        results,
        performance.now() - startTime
      );
      this.searchStats.set(stats);

      this.searchResults.set(results);
      this.filteredResults.set(filteredResults);
      this.totalResults.set(filteredResults.length);
    } catch (error) {
      console.error('Error performing search:', error);
      this.searchResults.set([]);
      this.filteredResults.set([]);
    } finally {
      this.isLoading.set(false);
      this.searchTime.set(performance.now() - startTime);
    }
  }

  private generateHighlights(
    posts: BlogPost[],
    query: string
  ): { [postId: string]: SearchHighlight[] } {
    const highlights: { [postId: string]: SearchHighlight[] } = {};
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .filter((term) => term.length > 2);

    posts.forEach((post) => {
      const postHighlights: SearchHighlight[] = [];

      // Highlight en título
      const titleHighlight = this.highlightText(post.title, searchTerms);
      if (titleHighlight.hasHighlight) {
        postHighlights.push({
          field: 'title',
          fragments: [titleHighlight.text],
        });
      }

      // Highlight en extracto
      const excerptHighlight = this.highlightText(post.excerpt, searchTerms);
      if (excerptHighlight.hasHighlight) {
        postHighlights.push({
          field: 'excerpt',
          fragments: [excerptHighlight.text],
        });
      }

      // Highlight en contenido (primeros fragmentos)
      const contentHighlight = this.highlightText(
        post.content.substring(0, 500),
        searchTerms
      );
      if (contentHighlight.hasHighlight) {
        postHighlights.push({
          field: 'content',
          fragments: [contentHighlight.text + '...'],
        });
      }

      if (postHighlights.length > 0) {
        highlights[post.id] = postHighlights;
      }
    });

    return highlights;
  }

  private highlightText(
    text: string,
    searchTerms: string[]
  ): { text: string; hasHighlight: boolean } {
    let highlightedText = text;
    let hasHighlight = false;

    searchTerms.forEach((term) => {
      const regex = new RegExp(`(${term})`, 'gi');
      if (regex.test(highlightedText)) {
        hasHighlight = true;
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
        );
      }
    });

    return { text: highlightedText, hasHighlight };
  }

  private applyAdvancedFilters(posts: BlogPost[]): BlogPost[] {
    let filtered = [...posts];
    const filters = this.searchFilters();

    // Filtrar por categorías
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((post) =>
        post.categories?.some((cat) => filters.categories!.includes(cat.slug))
      );
    }

    // Filtrar por autores
    if (filters.authors && filters.authors.length > 0) {
      filtered = filtered.filter((post) =>
        filters.authors!.includes(post.author?.slug || '')
      );
    }

    // Filtrar por tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((post) =>
        post.tags.some((tag) => filters.tags!.includes(tag))
      );
    }

    // Filtrar por rango de fechas
    if (filters.dateRange) {
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.publishedAt || post.createdAt);
        const start = filters.dateRange!.start;
        const end = filters.dateRange!.end;

        return (!start || postDate >= start) && (!end || postDate <= end);
      });
    }

    // Aplicar ordenamiento
    filtered = this.sortResults(filtered, filters.sortBy);

    return filtered;
  }

  private sortResults(posts: BlogPost[], sortBy: BlogSortBy): BlogPost[] {
    const sorted = [...posts];

    switch (sortBy) {
      case 'publishedAt':
        return sorted.sort(
          (a, b) =>
            new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime()
        );
      case 'createdAt':
        return sorted.sort(
          (a, b) =>
            new Date(a.publishedAt || a.createdAt).getTime() -
            new Date(b.publishedAt || b.createdAt).getTime()
        );
      case 'views':
        return sorted.sort((a, b) => b.views - a.views);
      case 'likes':
        return sorted.sort((a, b) => b.likes - a.likes);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'readingTime':
      default:
        // Por defecto ya viene ordenado por relevancia del servicio
        return sorted;
    }
  }

  private generateSuggestions(
    query: string,
    results: BlogPost[]
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Sugerencias de categorías frecuentes en resultados
    const categoryCount: { [key: string]: number } = {};
    results.forEach((post) => {
      post.categories?.forEach((cat) => {
        categoryCount[cat.slug] = (categoryCount[cat.slug] || 0) + 1;
      });
    });

    Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([slug, count]) => {
        const category = this.categories().find((cat) => cat.slug === slug);
        if (category) {
          suggestions.push({
            type: 'category',
            value: slug,
            label: `Buscar en ${category.name}`,
            count,
          });
        }
      });

    // Sugerencias de tags frecuentes
    const tagCount: { [key: string]: number } = {};
    results.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([tag, count]) => {
        suggestions.push({
          type: 'tag',
          value: tag,
          label: `Posts sobre "${tag}"`,
          count,
        });
      });

    return suggestions;
  }

  private calculateSearchStats(
    results: BlogPost[],
    searchTime: number
  ): SearchStats {
    const categoryStats: { [key: string]: number } = {};

    results.forEach((post) => {
      post.categories?.forEach((cat) => {
        categoryStats[cat.name] = (categoryStats[cat.name] || 0) + 1;
      });
    });

    return {
      totalResults: results.length,
      searchTime: Math.round(searchTime),
      mostRelevant: results.filter((post) => post.views > 1000)
        .length,
      categories: categoryStats,
    };
  }

  onPageChange(event: any): void {
    const page = typeof event === 'number' ? event : event.page;
    this.currentPage.set(page);
    this.updateURL();
    this.scrollToTop();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.updateURL();
  }

  onSortChange(sortBy: BlogSortBy): void {
    this.searchFilters.update((filters) => ({ ...filters, sortBy }));
    this.currentPage.set(1);
    this.updateURL();
    this.performSearch();
  }

  onFilterChange(filters: Partial<SearchFilters>): void {
    this.searchFilters.update((current) => ({ ...current, ...filters }));
    this.currentPage.set(1);
    this.updateURL();
    this.performSearch();
  }

  onNewSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchFilters.update((filters) => ({ ...filters, query }));
    this.currentPage.set(1);
    this.updateURL();
    this.performSearch();
  }

  onSearchPerformed(event: { query: string; filters: any; results: BlogPost[] }): void {
    this.searchQuery.set(event.query);
    this.searchResults.set(event.results);
    this.filteredResults.set(event.results);
    this.totalResults.set(event.results.length);
    this.currentPage.set(1);
    this.updateURL();
  }

  applySuggestion(suggestion: SearchSuggestion): void {
    switch (suggestion.type) {
      case 'category':
        this.searchFilters.update((filters) => ({
          ...filters,
          categories: [...filters.categories, suggestion.value],
        }));
        break;
      case 'tag':
        this.searchFilters.update((filters) => ({
          ...filters,
          tags: [...(filters.tags || []), suggestion.value],
        }));
        break;
      case 'query':
        this.searchQuery.set(suggestion.value);
        this.searchFilters.update((filters) => ({
          ...filters,
          query: suggestion.value,
        }));
        break;
    }

    this.currentPage.set(1);
    this.updateURL();
    this.performSearch();
  }

  clearFilters(): void {
    this.searchFilters.update((filters) => ({
      ...filters,
      categories: [],
      tags: [],
      authors: [],
      dateRange: undefined,
    }));
    this.currentPage.set(1);
    this.updateURL();
    this.performSearch();
  }

  private updateURL(): void {
    const filters = this.searchFilters();
    const queryParams: any = {};

    if (filters.query) queryParams['q'] = filters.query;
    if (filters.categories.length > 0)
      queryParams['categories'] = filters.categories.join(',');
    if (filters.sortBy !== 'publishedAt') queryParams['sort'] = filters.sortBy;
    if (this.currentPage() > 1) queryParams['page'] = this.currentPage();
    if (this.pageSize() !== 12) queryParams['size'] = this.pageSize();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace',
      replaceUrl: true,
    });
  }

  private updateSEOTags(): void {
    const query = this.searchQuery();
    const resultsCount = this.totalResults();

    const title = query
      ? `Resultados para "${query}" - ${resultsCount} posts encontrados`
      : 'Buscar en el Blog';

    const description = query
      ? `Encontrados ${resultsCount} artículos relacionados con "${query}". Explora nuestro contenido sobre diversos temas.`
      : 'Busca artículos en nuestro blog sobre tecnología, desarrollo, diseño y más.';

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: description,
    });

    if (query) {
      // Structured data para resultados de búsqueda
      this.updateStructuredData(query, resultsCount);
    }
  }

  private updateStructuredData(query: string, resultsCount: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      mainEntity: {
        '@type': 'SearchAction',
        query: query,
        result: {
          '@type': 'SearchResult',
          name: `Resultados para "${query}"`,
          description: `${resultsCount} artículos encontrados`,
          url: this.document.location.href,
        },
      },
    };

    // Remover structured data previo
    const existingScript = this.document.querySelector(
      'script[type="application/ld+json"][data-search]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Agregar nuevo structured data
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-search', 'true');
    script.textContent = JSON.stringify(structuredData);
    this.document.head.appendChild(script);
  }

  private scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Métodos auxiliares para el template
  getHighlightedTitle(post: BlogPost): string {
    const highlight = this.highlights()[post.id]?.find(
      (h) => h.field === 'title'
    );
    return highlight?.fragments[0] || post.title;
  }

  getHighlightedExcerpt(post: BlogPost): string {
    const highlight = this.highlights()[post.id]?.find(
      (h) => h.field === 'excerpt'
    );
    return highlight?.fragments[0] || post.excerpt;
  }

  getContentHighlight(post: BlogPost): SearchHighlight | null {
    return (
      this.highlights()[post.id]?.find((h) => h.field === 'content') || null
    );
  }

  getCategoryEntries(): [string, number][] {
    return Object.entries(this.searchStats().categories);
  }

  hasCategoryResults(): boolean {
    return Object.keys(this.searchStats().categories).length > 0;
  }

  // Método para trackBy en ngFor
  trackByPostId(index: number, post: BlogPost): string {
    return post.id;
  }

  trackBySuggestion(index: number, suggestion: SearchSuggestion): string {
    return `${suggestion.type}-${suggestion.value}`;
  }
}
