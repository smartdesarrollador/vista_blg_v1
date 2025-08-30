import {
  Component,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { filter, startWith, map, distinctUntilChanged } from 'rxjs/operators';
import { Subject, takeUntil, combineLatest } from 'rxjs';

// Servicios
import { BlogService } from '../../core/services/blog.service';
import { CategoriaService } from '../../core/services/categoria.service';

// Interfaces
import type { BlogPost } from '../../core/models/blog.interface';
import type { BlogCategory } from '../../core/models/categoria.interface';

// Interfaces específicas para breadcrumb
export interface BreadcrumbItem {
  label: string;
  url: string;
  icon?: string;
  isActive: boolean;
  isClickable: boolean;
  data?: any;
  type: 'home' | 'category' | 'post' | 'page' | 'custom';
}

export interface BreadcrumbConfig {
  showHome: boolean;
  homeLabel: string;
  homeIcon: string;
  separator: 'arrow' | 'slash' | 'chevron' | 'custom';
  customSeparator?: string;
  maxItems: number;
  showStructuredData: boolean;
  enableClickTracking: boolean;
  responsiveBreakpoint: 'sm' | 'md' | 'lg';
  compactOnMobile: boolean;
  showIcons: boolean;
}

export interface StructuredDataItem {
  '@type': string;
  name: string;
  item: string;
  position: number;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  itemListElement: StructuredDataItem[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  // Referencias y servicios
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly destroy$ = new Subject<void>();
  private isBrowser = false;

  // Inputs y Outputs
  readonly config = input<Partial<BreadcrumbConfig>>({});
  readonly customItems = input<BreadcrumbItem[]>([]);
  readonly excludePaths = input<string[]>([]);

  readonly itemClicked = output<BreadcrumbItem>();
  readonly breadcrumbGenerated = output<BreadcrumbItem[]>();
  readonly structuredDataGenerated = output<StructuredData>();

  // Signals para estado
  readonly breadcrumbItems = signal<BreadcrumbItem[]>([]);
  readonly structuredData = signal<StructuredData | null>(null);
  readonly isLoading = signal(false);
  readonly currentPath = signal('');

  // Configuración computada
  readonly breadcrumbConfig = computed<BreadcrumbConfig>(() => ({
    showHome: true,
    homeLabel: 'Inicio',
    homeIcon: 'home',
    separator: 'chevron',
    maxItems: 6,
    showStructuredData: true,
    enableClickTracking: true,
    responsiveBreakpoint: 'md',
    compactOnMobile: true,
    showIcons: true,
    ...this.config(),
  }));

  // Estado computado
  readonly visibleItems = computed(() => {
    const items = this.breadcrumbItems();
    const config = this.breadcrumbConfig();

    if (items.length <= config.maxItems) {
      return items;
    }

    // Si hay demasiados elementos, mostrar primero, último y algunos del medio
    const first = items[0];
    const last = items[items.length - 1];
    const middle = items.slice(1, -1);

    if (middle.length <= config.maxItems - 2) {
      return items;
    }

    // Crear elemento de ellipsis
    const ellipsis: BreadcrumbItem = {
      label: '...',
      url: '',
      isActive: false,
      isClickable: false,
      type: 'custom',
    };

    return [first, ellipsis, ...middle.slice(-2), last];
  });

  readonly hasMultipleItems = computed(() => this.breadcrumbItems().length > 1);
  readonly shouldShowStructuredData = computed(
    () => this.breadcrumbConfig().showStructuredData && this.hasMultipleItems()
  );

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.setupRouterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouterSubscription(): void {
    // Escuchar cambios de ruta
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.activatedRoute),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.generateBreadcrumbs();
      });
  }

  private async generateBreadcrumbs(): Promise<void> {
    this.isLoading.set(true);

    try {
      const url = this.router.url;
      this.currentPath.set(url);

      // Verificar si la ruta actual debe ser excluida
      if (this.shouldExcludePath(url)) {
        this.breadcrumbItems.set([]);
        this.structuredData.set(null);
        return;
      }

      const breadcrumbs = await this.buildBreadcrumbsFromRoute(url);

      // Agregar items customizados si existen
      const customItems = this.customItems();
      if (customItems.length > 0) {
        breadcrumbs.push(...customItems);
      }

      this.breadcrumbItems.set(breadcrumbs);

      // Generar structured data
      if (this.breadcrumbConfig().showStructuredData) {
        const structuredData = this.generateStructuredData(breadcrumbs);
        this.structuredData.set(structuredData);
        this.injectStructuredData(structuredData);
      }

      // Emitir eventos
      this.breadcrumbGenerated.emit(breadcrumbs);
      if (this.structuredData()) {
        this.structuredDataGenerated.emit(this.structuredData()!);
      }
    } catch (error) {
      console.error('Error generating breadcrumbs:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async buildBreadcrumbsFromRoute(
    url: string
  ): Promise<BreadcrumbItem[]> {
    const segments = url.split('/').filter((segment) => segment.length > 0);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Agregar home si está habilitado
    if (this.breadcrumbConfig().showHome) {
      breadcrumbs.push({
        label: this.breadcrumbConfig().homeLabel,
        url: '/',
        icon: this.breadcrumbConfig().homeIcon,
        isActive: segments.length === 0,
        isClickable: true,
        type: 'home',
      });
    }

    // Construir breadcrumbs para cada segmento
    let currentUrl = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentUrl += `/${segment}`;
      const isLast = i === segments.length - 1;

      const breadcrumbItem = await this.createBreadcrumbItem(
        segment,
        currentUrl,
        isLast,
        segments,
        i
      );

      if (breadcrumbItem) {
        breadcrumbs.push(breadcrumbItem);
      }
    }

    return breadcrumbs;
  }

  private async createBreadcrumbItem(
    segment: string,
    url: string,
    isLast: boolean,
    allSegments: string[],
    index: number
  ): Promise<BreadcrumbItem | null> {
    // Mapeo de rutas conocidas
    const routeMap: Record<
      string,
      { label: string; icon?: string; type: BreadcrumbItem['type'] }
    > = {
      blog: { label: 'Blog', icon: 'newspaper', type: 'page' },
      about: { label: 'Acerca de', icon: 'info-circle', type: 'page' },
      contact: { label: 'Contacto', icon: 'envelope', type: 'page' },
      cuenta: { label: 'Mi Cuenta', icon: 'user', type: 'page' },
      categoria: { label: 'Categoría', icon: 'tag', type: 'category' },
      tag: { label: 'Etiqueta', icon: 'hashtag', type: 'category' },
      autor: { label: 'Autor', icon: 'user-circle', type: 'page' },
      buscar: { label: 'Búsqueda', icon: 'search', type: 'page' },
    };

    // Si es una ruta conocida
    if (routeMap[segment]) {
      const route = routeMap[segment];
      return {
        label: route.label,
        url,
        icon: route.icon,
        isActive: isLast,
        isClickable: !isLast,
        type: route.type,
      };
    }

    // Casos especiales según el contexto
    const prevSegment = index > 0 ? allSegments[index - 1] : null;

    // Si es una categoría de blog
    if (prevSegment === 'categoria') {
      try {
        const category = await this.getCategoryBySlug(segment);
        return {
          label: category ? category.name : this.formatSegment(segment),
          url,
          icon: 'tag',
          isActive: isLast,
          isClickable: !isLast,
          type: 'category',
          data: category,
        };
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    }

    // Si es un post de blog
    if (prevSegment === 'blog' || prevSegment === 'post') {
      try {
        const post = await this.getPostBySlug(segment);
        return {
          label: post ? post.title : this.formatSegment(segment),
          url,
          icon: 'document-text',
          isActive: isLast,
          isClickable: !isLast,
          type: 'post',
          data: post,
        };
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    }

    // Formato por defecto
    return {
      label: this.formatSegment(segment),
      url,
      isActive: isLast,
      isClickable: !isLast,
      type: 'custom',
    };
  }

  private async getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    try {
      const categories = await this.categoriaService
        .getCategories()
        .toPromise();
      return categories?.data?.find((cat) => cat.slug === slug) || null;
    } catch (error) {
      return null;
    }
  }

  private async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const post = await this.blogService.getPostBySlug(slug).toPromise();
      return post || null;
    } catch (error) {
      return null;
    }
  }

  private formatSegment(segment: string): string {
    // Decodificar URL y formatear
    const decoded = decodeURIComponent(segment);

    // Reemplazar guiones y guiones bajos con espacios
    const formatted = decoded.replace(/[-_]/g, ' ');

    // Capitalizar primera letra de cada palabra
    return formatted.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private shouldExcludePath(url: string): boolean {
    const excludePaths = this.excludePaths();
    return excludePaths.some((path) => {
      if (path.endsWith('*')) {
        return url.startsWith(path.slice(0, -1));
      }
      return url === path;
    });
  }

  private generateStructuredData(
    breadcrumbs: BreadcrumbItem[]
  ): StructuredData {
    const itemListElement: StructuredDataItem[] = breadcrumbs
      .filter((item) => item.isClickable || item.isActive)
      .map((item, index) => ({
        '@type': 'ListItem',
        name: item.label,
        item: this.getAbsoluteUrl(item.url),
        position: index + 1,
      }));

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };
  }

  private getAbsoluteUrl(relativeUrl: string): string {
    if (!this.isBrowser) return relativeUrl;

    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }

    const base = `${window.location.protocol}//${window.location.host}`;
    return `${base}${relativeUrl}`;
  }

  private injectStructuredData(structuredData: StructuredData): void {
    if (!this.isBrowser) return;

    // Remover structured data previo
    const existingScript = document.getElementById(
      'breadcrumb-structured-data'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Crear nuevo script
    const script = document.createElement('script');
    script.id = 'breadcrumb-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  // Métodos públicos para el template
  onItemClick(item: BreadcrumbItem, event?: Event): void {
    if (!item.isClickable) {
      event?.preventDefault();
      return;
    }

    // Tracking de clicks si está habilitado
    if (this.breadcrumbConfig().enableClickTracking) {
      this.trackBreadcrumbClick(item);
    }

    this.itemClicked.emit(item);
  }

  getSeparatorIcon(): string {
    const separator = this.breadcrumbConfig().separator;

    switch (separator) {
      case 'arrow':
        return 'M8.25 4.5l7.5 7.5-7.5 7.5';
      case 'chevron':
        return 'M9 5l7 7-7 7';
      case 'slash':
        return 'M12 5l7 7-7 7';
      default:
        return 'M9 5l7 7-7 7';
    }
  }

  getItemIcon(item: BreadcrumbItem): string | null {
    if (!this.breadcrumbConfig().showIcons || !item.icon) {
      return null;
    }

    const iconMap: Record<string, string> = {
      home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      newspaper:
        'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
      tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      'document-text':
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'info-circle':
        'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      envelope:
        'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'user-circle':
        'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      hashtag: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
      search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    };

    return iconMap[item.icon] || null;
  }

  private trackBreadcrumbClick(item: BreadcrumbItem): void {
    // Implementar tracking (Google Analytics, etc.)
    if (this.isBrowser && (window as any).gtag) {
      (window as any).gtag('event', 'breadcrumb_click', {
        breadcrumb_position: this.breadcrumbItems().indexOf(item) + 1,
        breadcrumb_label: item.label,
        breadcrumb_url: item.url,
        breadcrumb_type: item.type,
      });
    }
  }

  // Track by functions para performance
  trackByBreadcrumb(index: number, item: BreadcrumbItem): string {
    return `${item.url}-${item.label}`;
  }

  // Métodos de utilidad
  getCompactLabel(label: string, maxLength: number = 20): string {
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength - 3)}...`;
  }

  isResponsiveBreakpoint(): boolean {
    if (!this.isBrowser) return false;

    const breakpoint = this.breadcrumbConfig().responsiveBreakpoint;
    const width = window.innerWidth;

    switch (breakpoint) {
      case 'sm':
        return width < 640;
      case 'md':
        return width < 768;
      case 'lg':
        return width < 1024;
      default:
        return false;
    }
  }
}
