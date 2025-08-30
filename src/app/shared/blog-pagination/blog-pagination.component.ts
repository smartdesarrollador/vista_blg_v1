import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import type { BlogPagination } from '../../core/models/blog.interface';

/**
 * Tipos de paginación disponibles
 */
export type PaginationType = 'numeric' | 'loadmore' | 'infinite';

/**
 * Configuración del componente de paginación
 */
export interface PaginationConfig {
  type: PaginationType;
  showFirstLast: boolean;
  showPrevNext: boolean;
  showInfo: boolean;
  showJumpTo: boolean;
  maxVisiblePages: number;
  loadMoreText: string;
  loadingText: string;
  compact: boolean;
  updateUrl: boolean;
  queryParam: string;
}

/**
 * Evento de cambio de página
 */
export interface PageChangeEvent {
  page: number;
  previousPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Componente Blog Pagination
 * Sistema de paginación avanzado con múltiples modos y navegación por teclado
 */
@Component({
  selector: 'app-blog-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-pagination.component.html',
  styleUrls: ['./blog-pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPaginationComponent implements OnChanges {
  // Services
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Required inputs
  @Input({ required: true }) pagination!: BlogPagination;

  // Optional inputs
  @Input() config: Partial<PaginationConfig> = {};
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;

  // Outputs
  @Output() pageChange = new EventEmitter<PageChangeEvent>();
  @Output() loadMore = new EventEmitter<void>();

  // Estados reactivos
  private readonly _selectedPage = signal<number>(1);
  private readonly _jumpToValue = signal<string>('');

  // Configuración por defecto
  private readonly _defaultConfig: PaginationConfig = {
    type: 'numeric',
    showFirstLast: true,
    showPrevNext: true,
    showInfo: true,
    showJumpTo: false,
    maxVisiblePages: 7,
    loadMoreText: 'Cargar más',
    loadingText: 'Cargando...',
    compact: false,
    updateUrl: true,
    queryParam: 'page',
  };

  // Computed properties
  protected readonly finalConfig = computed<PaginationConfig>(() => ({
    ...this._defaultConfig,
    ...this.config,
  }));

  protected readonly selectedPage = this._selectedPage.asReadonly();
  protected readonly jumpToValue = this._jumpToValue.asReadonly();

  // Páginas visibles calculadas
  protected readonly visiblePages = computed(() => {
    const config = this.finalConfig();
    const current = this.pagination?.currentPage || 1;
    const total = this.pagination?.totalPages || 1;
    const maxVisible = config.maxVisiblePages;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);

    // Ajustar inicio si estamos cerca del final
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages: (number | string)[] = [];

    // Primera página y elipsis
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // Páginas centrales
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Elipsis y última página
    if (end < total) {
      if (end < total - 1) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  });

  // Classes CSS computadas
  protected readonly containerClasses = computed(() => {
    const config = this.finalConfig();
    const baseClasses = [
      'blog-pagination',
      'flex',
      'items-center',
      'justify-center',
      'space-x-2',
    ];

    if (config.compact) {
      baseClasses.push('compact');
    }

    if (this.disabled || this.loading) {
      baseClasses.push('disabled');
    }

    return baseClasses.join(' ');
  });

  protected readonly pageButtonClasses = computed(() => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'px-3',
      'py-2',
      'text-sm',
      'font-medium',
      'border',
      'rounded-md',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:ring-offset-2',
    ];

    if (this.finalConfig().compact) {
      baseClasses.push('px-2', 'py-1', 'text-xs');
    }

    return baseClasses.join(' ');
  });

  constructor() {
    // Inicializar página seleccionada desde URL
    const pageFromUrl =
      this.route.snapshot.queryParams[this.finalConfig().queryParam];
    if (pageFromUrl && !isNaN(Number(pageFromUrl))) {
      this._selectedPage.set(Number(pageFromUrl));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagination'] && this.pagination) {
      this._selectedPage.set(this.pagination.currentPage);
    }
  }

  // Métodos de navegación
  protected handlePageClick(page: string | number): void {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  protected goToPage(page: number): void {
    if (this.disabled || this.loading || page === this.pagination.currentPage) {
      return;
    }

    if (page < 1 || page > this.pagination.totalPages) {
      return;
    }

    const previousPage = this.pagination.currentPage;
    this._selectedPage.set(page);

    // Actualizar URL si está habilitado
    if (this.finalConfig().updateUrl) {
      this._updateUrl(page);
    }

    // Emitir evento
    const event: PageChangeEvent = {
      page,
      previousPage,
      itemsPerPage: this.pagination.itemsPerPage,
      totalItems: this.pagination.totalItems,
      totalPages: this.pagination.totalPages,
    };

    this.pageChange.emit(event);
  }

  protected goToFirstPage(): void {
    this.goToPage(1);
  }

  protected goToLastPage(): void {
    this.goToPage(this.pagination.totalPages);
  }

  protected goToPreviousPage(): void {
    const prevPage = this.pagination.currentPage - 1;
    if (prevPage >= 1) {
      this.goToPage(prevPage);
    }
  }

  protected goToNextPage(): void {
    const nextPage = this.pagination.currentPage + 1;
    if (nextPage <= this.pagination.totalPages) {
      this.goToPage(nextPage);
    }
  }

  protected onLoadMore(): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.loadMore.emit();
  }

  // Jump to page functionality
  protected onJumpToChange(value: string): void {
    this._jumpToValue.set(value);
  }

  protected onJumpToSubmit(): void {
    const page = parseInt(this.jumpToValue(), 10);
    if (!isNaN(page) && page >= 1 && page <= this.pagination.totalPages) {
      this.goToPage(page);
      this._jumpToValue.set('');
    }
  }

  // Navegación por teclado
  protected onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || this.loading) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.goToPreviousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.goToNextPage();
        break;
      case 'Home':
        event.preventDefault();
        this.goToFirstPage();
        break;
      case 'End':
        event.preventDefault();
        this.goToLastPage();
        break;
    }
  }

  // Utilidades
  protected isCurrentPage(page: number | string): boolean {
    return typeof page === 'number' && page === this.pagination.currentPage;
  }

  protected isEllipsis(page: number | string): boolean {
    return page === '...';
  }

  protected getPageButtonClass(page: number | string): string {
    const baseClass = this.pageButtonClasses();

    if (this.isEllipsis(page)) {
      return `${baseClass} cursor-default border-transparent text-gray-500`;
    }

    if (this.isCurrentPage(page)) {
      return `${baseClass} bg-blue-600 border-blue-600 text-white hover:bg-blue-700`;
    }

    return `${baseClass} bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`;
  }

  protected getNavigationButtonClass(disabled: boolean): string {
    const baseClass = this.pageButtonClasses();

    if (disabled || this.disabled || this.loading) {
      return `${baseClass} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500`;
    }

    return `${baseClass} bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`;
  }

  protected formatItemsInfo(): string {
    if (!this.pagination) return '';

    const { currentPage, itemsPerPage, totalItems } = this.pagination;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return `Mostrando ${start} - ${end} de ${totalItems} resultados`;
  }

  // TrackBy para optimización
  protected trackByPage(index: number, page: number | string): number | string {
    return page;
  }

  // Métodos privados
  private _updateUrl(page: number): void {
    const queryParams = { ...this.route.snapshot.queryParams };

    if (page === 1) {
      delete queryParams[this.finalConfig().queryParam];
    } else {
      queryParams[this.finalConfig().queryParam] = page;
    }

    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
