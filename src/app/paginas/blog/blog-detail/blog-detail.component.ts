import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, takeUntil, switchMap, combineLatest } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Componentes compartidos
import { BlogCardComponent } from '../../../shared/blog-card/blog-card.component';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

// Servicios
import { BlogService } from '../../../core/services/blog.service';

// Interfaces
import type { BlogPost } from '../../../core/models/blog.interface';

// Interfaces específicas para la página
export interface BlogDetailState {
  post: BlogPost | null;
  relatedPosts: BlogPost[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isContentLoaded: boolean;
}

export interface BlogDetailConfig {
  showRelatedPosts: boolean;
  maxRelatedPosts: number;
  showSocialShare: boolean;
  showAuthorBio: boolean;
  showTableOfContents: boolean;
  enableComments: boolean;
  showReadingProgress: boolean;
  enablePrintVersion: boolean;
}

export interface SocialShareConfig {
  platforms: SocialPlatform[];
  showCopyLink: boolean;
  showEmail: boolean;
}

export interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: string;
}

export interface ReadingProgress {
  percentage: number;
  estimatedTimeLeft: number;
  wordsRead: number;
  totalWords: number;
}

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BlogCardComponent, BreadcrumbComponent, NgOptimizedImage],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  // Referencias y servicios
  private readonly blogService = inject(BlogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly destroy$ = new Subject<void>();
  private isBrowser = false;
  private readingProgressInterval?: number;

  // Signals para estado
  readonly blogState = signal<BlogDetailState>({
    post: null,
    relatedPosts: [],
    isLoading: true,
    hasError: false,
    errorMessage: null,
    isContentLoaded: false,
  });

  readonly config = signal<BlogDetailConfig>({
    showRelatedPosts: true,
    maxRelatedPosts: 4,
    showSocialShare: true,
    showAuthorBio: true,
    showTableOfContents: true,
    enableComments: false,
    showReadingProgress: true,
    enablePrintVersion: true,
  });

  readonly readingProgress = signal<ReadingProgress>({
    percentage: 0,
    estimatedTimeLeft: 0,
    wordsRead: 0,
    totalWords: 0,
  });

  readonly uiState = signal({
    showShareModal: false,
    showTableOfContents: false,
    activeHeading: '',
    hasScrolled: false,
  });

  // Estado computado
  readonly currentPost = computed(() => this.blogState().post);
  readonly relatedPosts = computed(() => this.blogState().relatedPosts);
  readonly isLoading = computed(() => this.blogState().isLoading);
  readonly hasError = computed(() => this.blogState().hasError);
  readonly hasContent = computed(
    () => !!this.currentPost() && this.blogState().isContentLoaded
  );

  // Contenido sanitizado
  readonly sanitizedContent = computed(() => {
    const post = this.currentPost();
    if (!post?.content) return null;
    return this.sanitizer.bypassSecurityTrustHtml(post.content);
  });

  // Configuración de redes sociales
  readonly socialShareConfig = computed<SocialShareConfig>(() => {
    const post = this.currentPost();
    const currentUrl = this.isBrowser ? window.location.href : '';
    const title = post?.title || '';
    const description = post?.excerpt || '';

    return {
      platforms: [
        {
          name: 'Twitter',
          icon: 'twitter',
          color: 'bg-blue-500',
          shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title
          )}&url=${encodeURIComponent(currentUrl)}`,
        },
        {
          name: 'Facebook',
          icon: 'facebook',
          color: 'bg-blue-600',
          shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
          )}`,
        },
        {
          name: 'LinkedIn',
          icon: 'linkedin',
          color: 'bg-blue-700',
          shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            currentUrl
          )}`,
        },
        {
          name: 'WhatsApp',
          icon: 'whatsapp',
          color: 'bg-green-500',
          shareUrl: `https://wa.me/?text=${encodeURIComponent(
            title + ' ' + currentUrl
          )}`,
        },
      ],
      showCopyLink: true,
      showEmail: true,
    };
  });

  // Metadata para SEO
  readonly seoMetadata = computed(() => {
    const post = this.currentPost();
    if (!post) return null;

    return {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.excerpt,
      keywords: post.seo?.keywords?.join(', ') || post.tags?.join(', '),
      image: post.featuredImage,
      url: this.isBrowser ? window.location.href : '',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      author: post.author?.name || 'Anónimo',
      section: post.categories?.[0]?.name || 'Blog',
    };
  });

  // Table of Contents
  readonly tableOfContents = computed(() => {
    const post = this.currentPost();
    if (!post?.content) return [];

    // Extraer headings del contenido HTML
    const headings: Array<{ id: string; text: string; level: number }> = [];
    const parser = this.isBrowser ? new DOMParser() : null;

    if (parser) {
      const doc = parser.parseFromString(post.content, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

      headingElements.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || '';
        const id = heading.id || `heading-${index}`;

        headings.push({ id, text, level });
      });
    }

    return headings;
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.setupRouteSubscription();
    if (this.isBrowser) {
      this.setupScrollTracking();
      this.setupReadingProgress();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.readingProgressInterval) {
      clearInterval(this.readingProgressInterval);
    }
  }

  private setupRouteSubscription(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const slug = params['slug'];
          if (!slug) {
            this.router.navigate(['/blog']);
            return [];
          }
          return this.loadPostBySlug(slug);
        })
      )
      .subscribe();
  }

  private async loadPostBySlug(slug: string) {
    try {
      this.updateBlogState({
        isLoading: true,
        hasError: false,
        errorMessage: null,
      });

      // Cargar post principal
      const post = await this.blogService.getPostBySlug(slug).toPromise();

      if (!post) {
        this.updateBlogState({
          hasError: true,
          errorMessage: 'Post no encontrado',
          isLoading: false,
        });
        return;
      }

      // Incrementar contador de vistas
      this.blogService.incrementViews(post.id);

      // Cargar posts relacionados
      const relatedPosts = await this.loadRelatedPosts(post);

      this.updateBlogState({
        post,
        relatedPosts,
        isLoading: false,
        isContentLoaded: true,
      });

      // Configurar SEO
      this.setupSEO(post);

      // Configurar structured data
      this.setupStructuredData(post);
    } catch (error) {
      console.error('Error loading post:', error);
      this.updateBlogState({
        hasError: true,
        errorMessage: 'Error al cargar el artículo',
        isLoading: false,
      });
    }
  }

  private async loadRelatedPosts(currentPost: BlogPost): Promise<BlogPost[]> {
    try {
      if (!this.config().showRelatedPosts) return [];

      // Obtener posts relacionados por categoría y tags
      const relatedByCategory = await this.blogService
        .getPostsByCategory(
          currentPost.categories?.[0]?.id || '',
          this.config().maxRelatedPosts + 1
        )
        .toPromise();

      // Filtrar el post actual y limitar
      const related = (relatedByCategory || [])
        .filter((post: BlogPost) => post.id !== currentPost.id)
        .slice(0, this.config().maxRelatedPosts);

      // Si no hay suficientes, completar con posts populares
      if (related.length < this.config().maxRelatedPosts) {
        const popularPosts = await this.blogService
          .getPopularPosts(this.config().maxRelatedPosts - related.length)
          .toPromise();

        const additionalPosts = (popularPosts || []).filter(
          (post) =>
            post.id !== currentPost.id && !related.some((r) => r.id === post.id)
        );

        related.push(...additionalPosts);
      }

      return related;
    } catch (error) {
      console.error('Error loading related posts:', error);
      return [];
    }
  }

  private setupSEO(post: BlogPost): void {
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
      content: metadata.image,
    });
    this.metaService.updateTag({ property: 'og:url', content: metadata.url });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Blog' });
    this.metaService.updateTag({
      property: 'article:author',
      content: metadata.author,
    });
    this.metaService.updateTag({
      property: 'article:section',
      content: metadata.section,
    });
    if (metadata.publishedTime) {
      this.metaService.updateTag({
        property: 'article:published_time',
        content: metadata.publishedTime,
      });
    }
    this.metaService.updateTag({
      property: 'article:modified_time',
      content: metadata.modifiedTime,
    });

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
      content: metadata.image,
    });

    // Canonical URL
    this.metaService.updateTag({ rel: 'canonical', href: metadata.url });
  }

  private setupStructuredData(post: BlogPost): void {
    if (!this.isBrowser) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: [post.featuredImage],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: post.author?.name || 'Anónimo',
        image: post.author?.avatar,
        description: post.author?.bio,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Blog',
        logo: {
          '@type': 'ImageObject',
          url: '/assets/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
      wordCount: post.content?.split(' ').length || 0,
      timeRequired: `PT${post.readingTime}M`,
      keywords: post.tags?.join(','),
      articleSection: post.categories?.[0]?.name,
    };

    // Remover script anterior
    const existingScript = this.document.getElementById(
      'blog-post-structured-data'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Agregar nuevo script
    const script = this.document.createElement('script');
    script.id = 'blog-post-structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    this.document.head.appendChild(script);
  }

  private setupScrollTracking(): void {
    if (!this.isBrowser) return;

    // Tracking de scroll para reading progress
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 100;
      this.uiState.update((current) => ({ ...current, hasScrolled: scrolled }));

      // Actualizar heading activo
      this.updateActiveHeading();
    });
  }

  private setupReadingProgress(): void {
    if (!this.isBrowser || !this.config().showReadingProgress) return;

    this.readingProgressInterval = window.setInterval(() => {
      this.calculateReadingProgress();
    }, 1000);
  }

  private calculateReadingProgress(): void {
    if (!this.isBrowser) return;

    const post = this.currentPost();
    if (!post) return;

    const contentElement = this.document.querySelector('.blog-content');
    if (!contentElement) return;

    const scrollTop = window.scrollY;
    const scrollHeight = contentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrolled = scrollTop / (scrollHeight - clientHeight);
    const percentage = Math.min(100, Math.max(0, scrolled * 100));

    const totalWords = post.content?.split(' ').length || 0;
    const wordsRead = Math.floor((percentage / 100) * totalWords);
    const estimatedTimeLeft = Math.max(
      0,
      post.readingTime - Math.floor(wordsRead / 200)
    );

    this.readingProgress.set({
      percentage,
      estimatedTimeLeft,
      wordsRead,
      totalWords,
    });
  }

  private updateActiveHeading(): void {
    if (!this.isBrowser) return;

    const headings = this.document.querySelectorAll(
      '.blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6'
    );
    let activeHeading = '';

    for (const heading of Array.from(headings)) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 100) {
        activeHeading = heading.id || '';
      }
    }

    this.uiState.update((current) => ({ ...current, activeHeading }));
  }

  // Métodos públicos para el template
  onRelatedPostClick(post: BlogPost): void {
    this.router.navigate(['/blog/post', post.slug]);
  }

  onCategoryClick(event: { post: BlogPost; categoryId: string }): void {
    // Encontrar la categoría y navegar
    const post = this.currentPost();
    const category = post?.categories?.find((cat) => cat.id === event.categoryId);
    if (category) {
      this.router.navigate(['/blog/categoria', category.slug]);
    }
  }

  onTagClick(event: { post: BlogPost; tag: string }): void {
    this.router.navigate(['/blog'], {
      queryParams: { tag: event.tag },
    });
  }

  onAuthorClick(): void {
    const post = this.currentPost();
    if (post?.author) {
      this.router.navigate(['/blog'], {
        queryParams: { author: post.author.slug },
      });
    }
  }

  // Social sharing
  toggleShareModal(): void {
    this.uiState.update((current) => ({
      ...current,
      showShareModal: !current.showShareModal,
    }));
  }

  shareOnPlatform(platform: SocialPlatform): void {
    if (!this.isBrowser) return;

    window.open(
      platform.shareUrl,
      'share-dialog',
      'width=626,height=436,resizable=yes,scrollbars=yes'
    );

    this.toggleShareModal();
  }

  copyLinkToClipboard(): void {
    if (!this.isBrowser) return;

    navigator.clipboard.writeText(window.location.href).then(() => {
      // Mostrar notificación de éxito
      this.showNotification('Enlace copiado al portapapeles');
    });
  }

  shareViaEmail(): void {
    const post = this.currentPost();
    if (!post) return;

    const subject = encodeURIComponent(`Interesante artículo: ${post.title}`);
    const body = encodeURIComponent(`
Hola,

Te comparto este interesante artículo que encontré:

${post.title}
${post.excerpt}

Puedes leerlo completo aquí: ${this.isBrowser ? window.location.href : ''}

¡Saludos!
    `);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  // Table of Contents
  toggleTableOfContents(): void {
    this.uiState.update((current) => ({
      ...current,
      showTableOfContents: !current.showTableOfContents,
    }));
  }

  scrollToHeading(headingId: string): void {
    if (!this.isBrowser) return;

    const element = this.document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    this.toggleTableOfContents();
  }

  // Navegación entre posts
  goToPreviousPost(): void {
    // Implementar navegación al post anterior
    // Por ahora, navegar de vuelta a la lista
    this.router.navigate(['/blog']);
  }

  goToNextPost(): void {
    // Implementar navegación al siguiente post
    // Por ahora, navegar de vuelta a la lista
    this.router.navigate(['/blog']);
  }

  // Acciones de post
  toggleLike(): void {
    const post = this.currentPost();
    if (post) {
      this.blogService.toggleLike(post.id);
      // Actualizar el estado local
      this.updateBlogState({
        post: {
          ...post,
          likes: post.likes + 1, // Simplemente incrementar likes
        },
      });
    }
  }

  printPost(): void {
    if (this.isBrowser && this.config().enablePrintVersion) {
      window.print();
    }
  }

  // Métodos de utilidad
  private updateBlogState(updates: Partial<BlogDetailState>): void {
    this.blogState.update((current) => ({ ...current, ...updates }));
  }

  private showNotification(message: string): void {
    // Implementar sistema de notificaciones
    console.log('Notification:', message);
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  }

  // Track by functions
  trackByRelatedPost(index: number, post: BlogPost): string {
    return post.id;
  }

  trackByHeading(index: number, heading: any): string {
    return heading.id;
  }

  trackBySocialPlatform(index: number, platform: SocialPlatform): string {
    return platform.name;
  }
}
