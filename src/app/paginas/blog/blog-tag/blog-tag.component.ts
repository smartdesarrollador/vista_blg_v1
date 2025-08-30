import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil, combineLatest, switchMap } from 'rxjs';

import { BlogService } from '../../../core/services/blog.service';
import { SEOService } from '../../../core/services/seo.service';
import {
  BlogPost,
  BlogPostsResponse,
  BlogFilters,
} from '../../../core/models/blog.interface';
import { BlogCardComponent } from '../../../shared/blog-card/blog-card.component';
import { BlogPaginationComponent } from '../../../shared/blog-pagination/blog-pagination.component';
import { BlogTagsComponent } from '../../../shared/blog-tags/blog-tags.component';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

interface TagPageData {
  tag: string;
  description: string;
  count: number;
  relatedTags: string[];
  color?: string;
  category?: string;
}

@Component({
  selector: 'app-blog-tag',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BlogCardComponent,
    BlogPaginationComponent,
    BlogTagsComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './blog-tag.component.html',
  styleUrls: ['./blog-tag.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogTagComponent implements OnInit, OnDestroy {
  // Dependency injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private blogService = inject(BlogService);
  private seoService = inject(SEOService);
  private platformId = inject(PLATFORM_ID);

  // Estado reactivo
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _posts = signal<BlogPost[]>([]);
  private readonly _totalPosts = signal<number>(0);
  private readonly _currentPage = signal<number>(1);
  private readonly _tagData = signal<TagPageData | null>(null);
  private readonly _sortBy = signal<'newest' | 'oldest' | 'popular'>('newest');

  // Computed signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly posts = this._posts.asReadonly();
  readonly totalPosts = this._totalPosts.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly tagData = this._tagData.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();

  readonly pagination = computed(() => {
    const total = this.totalPosts();
    const current = this.currentPage();
    const postsPerPage = 12;

    return {
      currentPage: current,
      totalPages: Math.ceil(total / postsPerPage),
      totalItems: total,
      itemsPerPage: postsPerPage,
      hasNext: current * postsPerPage < total,
      hasPrevious: current > 1,
    };
  });

  readonly breadcrumbs = computed(() => {
    const tag = this.tagData();
    return [
      {
        label: 'Inicio',
        url: '/',
        isActive: false,
        isClickable: true,
        type: 'home' as const,
      },
      {
        label: 'Blog',
        url: '/blog',
        isActive: false,
        isClickable: true,
        type: 'page' as const,
      },
      {
        label: `Tag: ${tag?.tag || ''}`,
        url: '',
        isActive: true,
        isClickable: false,
        type: 'custom' as const,
      },
    ];
  });

  readonly pageTitle = computed(() => {
    const tag = this.tagData();
    const total = this.totalPosts();
    return tag ? `Artículos sobre ${tag.tag} (${total})` : 'Tag';
  });

  readonly relatedTags = computed(() => {
    const tagData = this.tagData();
    return tagData?.relatedTags || [];
  });

  readonly sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'popular', label: 'Más populares' },
  ];

  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

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

  /**
   * Configura la suscripción a los cambios de ruta
   */
  private setupRouteSubscription(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        const tagSlug = params.get('tag');
        const page = parseInt(queryParams.get('page') || '1', 10);
        const sortBy =
          (queryParams.get('sort') as 'newest' | 'oldest' | 'popular') ||
          'newest';

        if (!tagSlug) {
          this.router.navigate(['/blog']);
          return;
        }

        this._currentPage.set(page);
        this._sortBy.set(sortBy);

        this.loadTagData(tagSlug, page, sortBy);
      });
  }

  /**
   * Carga los datos del tag y sus posts
   */
  private loadTagData(tagSlug: string, page: number, sortBy: string) {
    this._loading.set(true);
    this._error.set(null);

    // Simular carga de datos del tag
    const tagData = this.getTagData(tagSlug);

    if (!tagData) {
      this._error.set('Tag no encontrado');
      this._loading.set(false);
      return [];
    }

    this._tagData.set(tagData);

    // Configurar SEO
    this.setupSEO(tagData);

    // Cargar posts del tag
    const filters: BlogFilters = {
      tags: [tagData.tag],
      sortBy: sortBy as any,
    };

    this.blogService
      .getPosts(page, 12, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: BlogPostsResponse) => {
          this._posts.set(response.data);
          this._totalPosts.set(response.pagination?.totalItems || 0);
          this._loading.set(false);
        },
        error: (error) => {
          console.error('Error loading tag posts:', error);
          this._error.set('Error al cargar los artículos');
          this._loading.set(false);
        },
      });
  }

  /**
   * Obtiene los datos mock del tag
   */
  private getTagData(tagSlug: string): TagPageData | null {
    const tagMap = new Map<string, TagPageData>([
      [
        'angular',
        {
          tag: 'Angular',
          description:
            'Framework de desarrollo web moderno creado por Google. Ideal para crear aplicaciones web escalables y mantenibles.',
          count: 45,
          relatedTags: ['TypeScript', 'JavaScript', 'RxJS', 'NgRx', 'Testing'],
          color: '#dd0031',
          category: 'desarrollo',
        },
      ],
      [
        'typescript',
        {
          tag: 'TypeScript',
          description:
            'Superset tipado de JavaScript que añade tipos estáticos opcionales y características avanzadas al lenguaje.',
          count: 38,
          relatedTags: ['JavaScript', 'Angular', 'React', 'Node.js'],
          color: '#3178c6',
          category: 'desarrollo',
        },
      ],
      [
        'javascript',
        {
          tag: 'JavaScript',
          description:
            'Lenguaje de programación interpretado, dialecto del estándar ECMAScript. Es el lenguaje de la web.',
          count: 52,
          relatedTags: ['TypeScript', 'Node.js', 'React', 'Vue.js', 'ES6'],
          color: '#f7df1e',
          category: 'desarrollo',
        },
      ],
      [
        'css',
        {
          tag: 'CSS',
          description:
            'Lenguaje de hojas de estilo utilizado para describir la presentación de documentos HTML y XML.',
          count: 34,
          relatedTags: ['HTML', 'Sass', 'Tailwind CSS', 'Responsive Design'],
          color: '#1572b6',
          category: 'diseno',
        },
      ],
      [
        'tailwind-css',
        {
          tag: 'Tailwind CSS',
          description:
            'Framework CSS utility-first que permite crear diseños personalizados sin salir del HTML.',
          count: 28,
          relatedTags: ['CSS', 'HTML', 'Responsive Design', 'PostCSS'],
          color: '#06b6d4',
          category: 'diseno',
        },
      ],
      [
        'react',
        {
          tag: 'React',
          description:
            'Biblioteca de JavaScript para construir interfaces de usuario, especialmente aplicaciones web de una sola página.',
          count: 36,
          relatedTags: ['JavaScript', 'JSX', 'Redux', 'Next.js', 'Hooks'],
          color: '#61dafb',
          category: 'desarrollo',
        },
      ],
      [
        'vue.js',
        {
          tag: 'Vue.js',
          description:
            'Framework progresivo de JavaScript para construir interfaces de usuario y aplicaciones de una sola página.',
          count: 25,
          relatedTags: ['JavaScript', 'Vuex', 'Nuxt.js', 'Vue Router'],
          color: '#4fc08d',
          category: 'desarrollo',
        },
      ],
      [
        'web-performance',
        {
          tag: 'Web Performance',
          description:
            'Técnicas y mejores prácticas para optimizar la velocidad y rendimiento de sitios y aplicaciones web.',
          count: 22,
          relatedTags: ['Core Web Vitals', 'Lighthouse', 'PWA', 'CDN'],
          color: '#ff6b6b',
          category: 'tecnologia',
        },
      ],
      [
        'seo',
        {
          tag: 'SEO',
          description:
            'Search Engine Optimization: técnicas para mejorar la visibilidad de sitios web en motores de búsqueda.',
          count: 26,
          relatedTags: [
            'Structured Data',
            'Meta Tags',
            'Sitemap',
            'Core Web Vitals',
          ],
          color: '#48bb78',
          category: 'tecnologia',
        },
      ],
      [
        'ux-ui',
        {
          tag: 'UX/UI',
          description:
            'Experiencia de Usuario y Diseño de Interfaz: disciplinas enfocadas en crear productos digitales usables y atractivos.',
          count: 31,
          relatedTags: [
            'Design Systems',
            'Figma',
            'Usability',
            'Accessibility',
          ],
          color: '#ed64a6',
          category: 'diseno',
        },
      ],
    ]);

    return tagMap.get(tagSlug) || null;
  }

  /**
   * Configura el SEO para la página del tag
   */
  private setupSEO(tagData: TagPageData): void {
    const title = `Artículos sobre ${tagData.tag} - Mi Blog`;
    const description = `${tagData.description} Descubre ${tagData.count} artículos sobre ${tagData.tag}.`;

    this.titleService.setTitle(title);

    // Meta tags básicos
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({
      name: 'keywords',
      content: `${tagData.tag}, ${tagData.relatedTags.join(
        ', '
      )}, blog, programación`,
    });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Cards
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: description,
    });

    // Usar SEO Service para configuración avanzada
    if (this.isBrowser) {
      this.seoService.setupCategorySEO(
        {
          name: tagData.tag,
          slug: tagData.tag.toLowerCase().replace(/\s+/g, '-'),
          description: tagData.description || '',
        } as any,
        tagData.count
      );
    }
  }

  /**
   * Maneja el cambio de página
   */
  onPageChange(page: number): void {
    this.updateQueryParams({ page: page.toString() });
  }

  /**
   * Maneja el cambio de ordenamiento
   */
  onSortChange(sortBy: 'newest' | 'oldest' | 'popular'): void {
    this.updateQueryParams({ sort: sortBy, page: '1' });
  }

  /**
   * Maneja el click en un tag relacionado
   */
  onRelatedTagClick(tagName: string): void {
    const tagSlug = tagName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    this.router.navigate(['/blog/tag', tagSlug]);
  }

  /**
   * Maneja el click en un post
   */
  onPostClick(post: BlogPost): void {
    this.router.navigate(['/blog', post.slug]);
  }

  /**
   * Actualiza los query parameters de la URL
   */
  private updateQueryParams(params: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Navega de vuelta al blog principal
   */
  goBackToBlog(): void {
    this.router.navigate(['/blog']);
  }

  /**
   * Comparte la página del tag
   */
  shareTag(): void {
    if (!this.isBrowser) return;

    const tagData = this.tagData();
    if (!tagData) return;

    const url = window.location.href;
    const title = `Artículos sobre ${tagData.tag}`;
    const text = `Descubre artículos sobre ${tagData.tag}: ${tagData.description}`;

    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        // Mostrar notificación (aquí podrías usar un servicio de notificaciones)
        console.log('URL copiada al portapapeles');
      });
    }
  }

  /**
   * TrackBy function para optimización de ngFor
   */
  trackByPostId(index: number, post: BlogPost): string {
    return post.id;
  }
}
