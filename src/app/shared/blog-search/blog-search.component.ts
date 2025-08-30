import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  catchError,
  tap,
  filter,
} from 'rxjs/operators';
import { Observable, of, combineLatest, fromEvent, merge } from 'rxjs';

// Servicios
import { BlogService } from '../../core/services/blog.service';
import { CategoriaService } from '../../core/services/categoria.service';

// Interfaces
import type {
  BlogPost,
  BlogFilters,
  BlogSortBy,
} from '../../core/models/blog.interface';
import type { BlogCategory } from '../../core/models/categoria.interface';

// Interfaces específicas para búsqueda
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'post' | 'category' | 'tag' | 'author';
  data?: any;
  popularity?: number;
}

export interface SearchFilters {
  categories: string[];
  tags: string[];
  authors: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: BlogSortBy;
  type: 'all' | 'posts' | 'categories';
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: Date;
  resultsCount: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  suggestions: SearchSuggestion[];
  history: SearchHistory[];
  isSearching: boolean;
  showSuggestions: boolean;
  showFilters: boolean;
  showHistory: boolean;
}

export interface SearchConfig {
  placeholder: string;
  maxSuggestions: number;
  maxHistory: number;
  debounceTime: number;
  minQueryLength: number;
  showQuickFilters: boolean;
  showAdvancedFilters: boolean;
  enableHistory: boolean;
  enableAutoComplete: boolean;
}

@Component({
  selector: 'app-blog-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blog-search.component.html',
  styleUrl: './blog-search.component.css',
})
export class BlogSearchComponent {
  // Referencias y servicios
  @ViewChild('searchInput', { static: true })
  searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchDropdown') searchDropdown!: ElementRef<HTMLDivElement>;

  private readonly blogService = inject(BlogService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  // Inputs y Outputs
  readonly config = input<Partial<SearchConfig>>({});
  readonly initialQuery = input<string>('');
  readonly initialFilters = input<Partial<SearchFilters>>({});

  readonly searchPerformed = output<{
    query: string;
    filters: SearchFilters;
    results: BlogPost[];
  }>();
  readonly filterChanged = output<SearchFilters>();
  readonly suggestionSelected = output<SearchSuggestion>();

  // Form Control
  readonly searchControl = new FormControl('', { nonNullable: true });

  // Signals para estado
  readonly searchState = signal<SearchState>({
    query: '',
    filters: {
      categories: [],
      tags: [],
      authors: [],
      sortBy: 'publishedAt',
      type: 'all',
    },
    suggestions: [],
    history: [],
    isSearching: false,
    showSuggestions: false,
    showFilters: false,
    showHistory: false,
  });

  readonly loadingStates = signal({
    suggestions: false,
    search: false,
    filters: false,
  });

  readonly errors = signal({
    search: null as string | null,
    suggestions: null as string | null,
    filters: null as string | null,
  });

  // Datos para filtros
  readonly categories = signal<BlogCategory[]>([]);
  readonly popularTags = signal<string[]>([]);
  readonly authors = signal<string[]>([]);

  // Configuración computada
  readonly searchConfig = computed<SearchConfig>(() => ({
    placeholder: 'Buscar posts, categorías, tags...',
    maxSuggestions: 8,
    maxHistory: 10,
    debounceTime: 300,
    minQueryLength: 2,
    showQuickFilters: true,
    showAdvancedFilters: true,
    enableHistory: true,
    enableAutoComplete: true,
    ...this.config(),
  }));

  // Estado computado
  readonly currentQuery = computed(() => this.searchState().query);
  readonly currentFilters = computed(() => this.searchState().filters);
  readonly isSearchActive = computed(
    () => this.currentQuery().length > 0 || this.hasActiveFilters()
  );
  readonly showSearchResults = computed(
    () => this.searchState().showSuggestions || this.searchState().showHistory
  );

  // Estado de carga computado
  readonly isLoading = computed(() => {
    const states = this.loadingStates();
    return states.suggestions || states.search || states.filters;
  });

  // Variables para SSR
  private isBrowser = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Efectos
    this.setupSearchEffect();
    this.setupKeyboardNavigation();
    this.setupClickOutside();
    this.setupUrlSync();
    this.loadInitialData();
  }

  // Setup de efectos
  private setupSearchEffect(): void {
    if (!this.isBrowser) return;

    // Efecto para búsqueda con debounce
    effect(() => {
      const query = this.searchControl.value;
      const config = this.searchConfig();

      if (query.length >= config.minQueryLength) {
        this.updateSearchState({ query, showSuggestions: true });
        this.loadSuggestions(query);
      } else {
        this.updateSearchState({
          query: '',
          showSuggestions: false,
          suggestions: [],
        });
      }
    });

    // Configurar form control con debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.searchConfig().debounceTime),
        distinctUntilChanged(),
        filter(
          (query) =>
            query.length >= this.searchConfig().minQueryLength ||
            query.length === 0
        )
      )
      .subscribe((query) => {
        if (query) {
          this.performSearch(query);
        }
      });
  }

  private setupKeyboardNavigation(): void {
    if (!this.isBrowser) return;

    fromEvent<KeyboardEvent>(
      this.searchInput?.nativeElement || document,
      'keydown'
    )
      .pipe(
        filter((event) =>
          ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)
        )
      )
      .subscribe((event) => this.handleKeyboardNavigation(event));
  }

  private setupClickOutside(): void {
    if (!this.isBrowser) return;

    fromEvent<MouseEvent>(document, 'click').subscribe((event) => {
      const target = event.target as HTMLElement;
      const isInsideSearch =
        this.searchInput?.nativeElement.contains(target) ||
        this.searchDropdown?.nativeElement?.contains(target);

      if (!isInsideSearch) {
        this.closeAllDropdowns();
      }
    });
  }

  private setupUrlSync(): void {
    // Sincronizar con parámetros de URL
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchControl.setValue(params['q'], { emitEvent: false });
        this.updateSearchState({ query: params['q'] });
      }

      if (params['category']) {
        this.updateFilters({ categories: [params['category']] });
      }
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.setLoadingState('filters', true);

      // Cargar categorías
      const categoriesData = await this.categoriaService
        .getCategories()
        .toPromise();
      if (categoriesData?.data) {
        this.categories.set(categoriesData.data);
      }

      // Cargar tags populares (desde el servicio de blog)
      // const tagsData = await this.blogService.getPopularTags().toPromise();
      // if (tagsData) {
      //   this.popularTags.set(tagsData);
      // }

      // Cargar autores (desde datos mock por ahora)
      this.authors.set([
        'Juan Pérez',
        'María García',
        'Carlos López',
        'Ana Martín',
      ]);

      // Cargar historial desde localStorage
      this.loadSearchHistory();

      // Aplicar filtros iniciales
      if (this.initialFilters()) {
        this.updateFilters(this.initialFilters());
      }

      // Aplicar query inicial
      if (this.initialQuery()) {
        this.searchControl.setValue(this.initialQuery());
      }
    } catch (error) {
      console.error('Error loading initial search data:', error);
      this.setError('filters', 'Error al cargar los filtros');
    } finally {
      this.setLoadingState('filters', false);
    }
  }

  // Métodos de búsqueda
  async performSearch(query: string): Promise<void> {
    if (!query.trim()) return;

    try {
      this.setLoadingState('search', true);
      this.clearError('search');

      const filters = this.currentFilters();

      // Realizar búsqueda
      const results = await this.blogService
        .searchPosts(query, {
          sortBy: filters.sortBy,
          categoryIds: filters.categories,
          authorId: filters.authors?.[0],
        })
        .toPromise();

      if (results) {
        // Emitir evento de búsqueda
        this.searchPerformed.emit({
          query,
          filters,
          results: results,
        });

        // Guardar en historial
        this.saveToHistory(query, filters, results.length);

        // Actualizar URL
        this.updateUrl(query, filters);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      this.setError('search', 'Error al realizar la búsqueda');
    } finally {
      this.setLoadingState('search', false);
      this.closeAllDropdowns();
    }
  }

  async loadSuggestions(query: string): Promise<void> {
    if (!this.searchConfig().enableAutoComplete) return;

    try {
      this.setLoadingState('suggestions', true);
      this.clearError('suggestions');

      const suggestions: SearchSuggestion[] = [];

      // Buscar posts que coincidan
      const postResults = await this.blogService
        .searchPosts(query, {})
        .toPromise();

      if (postResults) {
        postResults.slice(0, 4).forEach((post) => {
          suggestions.push({
            id: `post-${post.id}`,
            text: post.title,
            type: 'post',
            data: post,
            popularity: post.views,
          });
        });
      }

      // Buscar categorías que coincidan
      const categories = this.categories().filter((cat) =>
        cat.name.toLowerCase().includes(query.toLowerCase())
      );

      categories.slice(0, 2).forEach((category) => {
        suggestions.push({
          id: `category-${category.id}`,
          text: category.name,
          type: 'category',
          data: category,
          popularity: category.postsCount,
        });
      });

      // Buscar tags que coincidan
      const matchingTags = this.popularTags().filter((tag) =>
        tag.toLowerCase().includes(query.toLowerCase())
      );

      matchingTags.slice(0, 2).forEach((tag) => {
        suggestions.push({
          id: `tag-${tag}`,
          text: tag,
          type: 'tag',
          data: { name: tag },
        });
      });

      // Ordenar por popularidad y limitar
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, this.searchConfig().maxSuggestions);

      this.updateSearchState({ suggestions: sortedSuggestions });
    } catch (error) {
      console.error('Error loading suggestions:', error);
      this.setError('suggestions', 'Error al cargar sugerencias');
    } finally {
      this.setLoadingState('suggestions', false);
    }
  }

  // Métodos de filtros
  updateFilters(newFilters: Partial<SearchFilters>): void {
    const currentFilters = this.currentFilters();
    const updatedFilters = { ...currentFilters, ...newFilters };

    this.updateSearchState({ filters: updatedFilters });
    this.filterChanged.emit(updatedFilters);

    // Si hay query activo, realizar nueva búsqueda
    const query = this.currentQuery();
    if (query) {
      this.performSearch(query);
    }
  }

  addCategoryFilter(categoryId: string): void {
    const currentCategories = this.currentFilters().categories;
    if (!currentCategories.includes(categoryId)) {
      this.updateFilters({
        categories: [...currentCategories, categoryId],
      });
    }
  }

  removeCategoryFilter(categoryId: string): void {
    const currentCategories = this.currentFilters().categories;
    this.updateFilters({
      categories: currentCategories.filter((id) => id !== categoryId),
    });
  }

  addTagFilter(tag: string): void {
    const currentTags = this.currentFilters().tags;
    if (!currentTags.includes(tag)) {
      this.updateFilters({
        tags: [...currentTags, tag],
      });
    }
  }

  removeTagFilter(tag: string): void {
    const currentTags = this.currentFilters().tags;
    this.updateFilters({
      tags: currentTags.filter((t) => t !== tag),
    });
  }

  clearAllFilters(): void {
    this.updateFilters({
      categories: [],
      tags: [],
      authors: [],
      dateFrom: undefined,
      dateTo: undefined,
      type: 'all',
    });
  }

  // Métodos de interacción
  selectSuggestion(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);

    switch (suggestion.type) {
      case 'post':
        // Navegar al post
        this.router.navigate(['/blog/post', suggestion.data.slug]);
        break;
      case 'category':
        // Aplicar filtro de categoría
        this.addCategoryFilter(suggestion.data.id);
        break;
      case 'tag':
        // Aplicar filtro de tag
        this.addTagFilter(suggestion.data.name);
        break;
    }

    this.closeAllDropdowns();
  }

  selectFromHistory(historyItem: SearchHistory): void {
    this.searchControl.setValue(historyItem.query);
    this.updateSearchState({
      query: historyItem.query,
      filters: historyItem.filters,
    });
    this.performSearch(historyItem.query);
  }

  removeFromHistory(historyId: string): void {
    const currentHistory = this.searchState().history;
    const updatedHistory = currentHistory.filter(
      (item) => item.id !== historyId
    );
    this.updateSearchState({ history: updatedHistory });
    this.saveSearchHistory(updatedHistory);
  }

  clearSearchHistory(): void {
    this.updateSearchState({ history: [] });
    this.saveSearchHistory([]);
  }

  // Métodos de UI
  toggleFilters(): void {
    const current = this.searchState().showFilters;
    this.updateSearchState({ showFilters: !current });
  }

  toggleHistory(): void {
    const current = this.searchState().showHistory;
    this.updateSearchState({ showHistory: !current });

    if (!current) {
      this.loadSearchHistory();
    }
  }

  closeAllDropdowns(): void {
    this.updateSearchState({
      showSuggestions: false,
      showFilters: false,
      showHistory: false,
    });
  }

  focusSearchInput(): void {
    if (this.isBrowser && this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.updateSearchState({
      query: '',
      suggestions: [],
      showSuggestions: false,
    });
    this.router.navigate([], { queryParams: {} });
  }

  // Métodos de navegación por teclado
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const suggestions = this.searchState().suggestions;

    switch (event.key) {
      case 'Escape':
        this.closeAllDropdowns();
        break;
      case 'ArrowDown':
        event.preventDefault();
        // Lógica de navegación hacia abajo
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Lógica de navegación hacia arriba
        break;
      case 'Enter':
        event.preventDefault();
        const query = this.searchControl.value;
        if (query) {
          this.performSearch(query);
        }
        break;
    }
  }

  // Métodos de historial
  private saveToHistory(
    query: string,
    filters: SearchFilters,
    resultsCount: number
  ): void {
    if (!this.searchConfig().enableHistory) return;

    const historyItem: SearchHistory = {
      id: Date.now().toString(),
      query,
      filters: { ...filters },
      timestamp: new Date(),
      resultsCount,
    };

    const currentHistory = this.searchState().history;
    const updatedHistory = [
      historyItem,
      ...currentHistory.filter((item) => item.query !== query),
    ].slice(0, this.searchConfig().maxHistory);

    this.updateSearchState({ history: updatedHistory });
    this.saveSearchHistory(updatedHistory);
  }

  private loadSearchHistory(): void {
    if (!this.isBrowser || !this.searchConfig().enableHistory) return;

    try {
      const stored = localStorage.getItem('blog-search-history');
      if (stored) {
        const history = JSON.parse(stored);
        this.updateSearchState({ history });
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  private saveSearchHistory(history: SearchHistory[]): void {
    if (!this.isBrowser || !this.searchConfig().enableHistory) return;

    try {
      localStorage.setItem('blog-search-history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Métodos de URL
  private updateUrl(query: string, filters: SearchFilters): void {
    const queryParams: any = {};

    if (query) queryParams.q = query;
    if (filters.categories.length > 0)
      queryParams.category = filters.categories[0];
    if (filters.sortBy !== 'publishedAt') queryParams.sort = filters.sortBy;

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  // Métodos de utilidad
  updateSearchState(updates: Partial<SearchState>): void {
    this.searchState.update((current) => ({ ...current, ...updates }));
  }

  private setLoadingState(
    key: keyof { suggestions: boolean; search: boolean; filters: boolean; },
    loading: boolean
  ): void {
    this.loadingStates.update((current) => ({ ...current, [key]: loading }));
  }

  private setError(
    key: keyof { search: string | null; suggestions: string | null; filters: string | null; },
    error: string | null
  ): void {
    this.errors.update((current) => ({ ...current, [key]: error }));
  }

  private clearError(key: keyof { search: string | null; suggestions: string | null; filters: string | null; }): void {
    this.setError(key, null);
  }

  hasActiveFilters(): boolean {
    const filters = this.currentFilters();
    return (
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.authors.length > 0 ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined
    );
  }

  // Métodos para manejar cambios de fecha
  onDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.updateFilters({
      dateFrom: value ? new Date(value) : undefined,
    });
  }

  onDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.updateFilters({
      dateTo: value ? new Date(value) : undefined,
    });
  }

  // Métodos auxiliares para eventos del template
  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ sortBy: target.value as BlogSortBy });
  }

  onShowOnlyFeaturedChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Note: featured filter not currently supported in SearchFilters interface
    // this.updateFilters({ featured: target.checked });
  }

  onCategoryCheckboxChange(event: Event, categoryId: string): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.addCategoryFilter(categoryId);
    } else {
      this.removeCategoryFilter(categoryId);
    }
  }

  // Getters para el template
  getCategoryById(id: string): BlogCategory | undefined {
    return this.categories().find((cat) => cat.id === id);
  }

  getDateFromValue(): string {
    const date = this.currentFilters().dateFrom;
    return date ? date.toISOString().split('T')[0] : '';
  }

  getDateToValue(): string {
    const date = this.currentFilters().dateTo;
    return date ? date.toISOString().split('T')[0] : '';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  // Track by functions para performance
  trackBySuggestion(index: number, suggestion: SearchSuggestion): string {
    return suggestion.id;
  }

  trackByHistory(index: number, item: SearchHistory): string {
    return item.id;
  }

  trackByCategory(index: number, category: BlogCategory): string {
    return category.id;
  }
}
