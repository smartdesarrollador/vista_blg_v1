import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BlogPost } from '../models/blog.interface';
import { BlogCategory } from '../models/categoria.interface';

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

interface StructuredDataArticle {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection: string;
  keywords: string[];
  wordCount?: number;
  timeRequired?: string;
}

interface StructuredDataBreadcrumb {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

interface StructuredDataWebsite {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  private isBrowser: boolean;
  private readonly defaultSEO = {
    siteName: 'Mi Blog',
    siteUrl: 'https://miblog.com',
    defaultImage: '/assets/images/default-og-image.jpg',
    twitterHandle: '@miblog',
    author: 'Mi Blog Team',
    locale: 'es_ES',
  };

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Actualiza todos los meta tags para SEO
   */
  updateSEO(seoData: SEOData): void {
    // Actualizar título
    this.titleService.setTitle(seoData.title);

    // Meta tags básicos
    this.metaService.updateTag({
      name: 'description',
      content: seoData.description,
    });
    this.metaService.updateTag({ name: 'keywords', content: seoData.keywords });

    // Canonical URL
    if (seoData.canonical) {
      this.updateCanonicalUrl(seoData.canonical);
    }

    // Open Graph
    this.updateOpenGraphTags(seoData);

    // Twitter Cards
    this.updateTwitterTags(seoData);

    // Meta tags adicionales
    if (seoData.author) {
      this.metaService.updateTag({ name: 'author', content: seoData.author });
    }

    if (seoData.publishedTime) {
      this.metaService.updateTag({
        name: 'article:published_time',
        content: seoData.publishedTime,
      });
    }

    if (seoData.modifiedTime) {
      this.metaService.updateTag({
        name: 'article:modified_time',
        content: seoData.modifiedTime,
      });
    }

    if (seoData.section) {
      this.metaService.updateTag({
        name: 'article:section',
        content: seoData.section,
      });
    }

    if (seoData.tags) {
      // Remover tags anteriores
      this.metaService.removeTag('name="article:tag"');

      // Agregar nuevos tags
      seoData.tags.forEach((tag) => {
        this.metaService.addTag({ name: 'article:tag', content: tag });
      });
    }

    // Robots meta
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
  }

  /**
   * Actualiza Open Graph tags
   */
  private updateOpenGraphTags(seoData: SEOData): void {
    const ogImage = seoData.ogImage || this.defaultSEO.defaultImage;
    const ogType = seoData.ogType || 'website';

    this.metaService.updateTag({
      property: 'og:title',
      content: seoData.title,
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: seoData.description,
    });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({
      property: 'og:url',
      content: seoData.canonical || this.getCurrentUrl(),
    });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({
      property: 'og:site_name',
      content: this.defaultSEO.siteName,
    });
    this.metaService.updateTag({
      property: 'og:locale',
      content: this.defaultSEO.locale,
    });

    // Open Graph para artículos
    if (ogType === 'article' && seoData.publishedTime) {
      this.metaService.updateTag({
        property: 'article:published_time',
        content: seoData.publishedTime,
      });
      if (seoData.modifiedTime) {
        this.metaService.updateTag({
          property: 'article:modified_time',
          content: seoData.modifiedTime,
        });
      }
      if (seoData.author) {
        this.metaService.updateTag({
          property: 'article:author',
          content: seoData.author,
        });
      }
      if (seoData.section) {
        this.metaService.updateTag({
          property: 'article:section',
          content: seoData.section,
        });
      }
    }
  }

  /**
   * Actualiza Twitter Card tags
   */
  private updateTwitterTags(seoData: SEOData): void {
    const twitterCard = seoData.twitterCard || 'summary_large_image';

    this.metaService.updateTag({ name: 'twitter:card', content: twitterCard });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: seoData.title,
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: seoData.description,
    });
    this.metaService.updateTag({
      name: 'twitter:image',
      content: seoData.ogImage || this.defaultSEO.defaultImage,
    });
    this.metaService.updateTag({
      name: 'twitter:site',
      content: this.defaultSEO.twitterHandle,
    });

    if (seoData.author) {
      this.metaService.updateTag({
        name: 'twitter:creator',
        content: this.defaultSEO.twitterHandle,
      });
    }
  }

  /**
   * Actualiza la URL canónica
   */
  private updateCanonicalUrl(url: string): void {
    if (!this.isBrowser) return;

    // Remover canonical existente
    const existingCanonical = this.document.querySelector(
      'link[rel="canonical"]'
    );
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Agregar nuevo canonical
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }

  /**
   * Genera structured data para un artículo
   */
  generateArticleStructuredData(post: BlogPost): StructuredDataArticle {
    const currentUrl = this.getCurrentUrl();

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: [post.featuredImage],
      datePublished:
        post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        '@type': 'Person',
        name: post.author?.name || this.defaultSEO.author,
        url: post.author?.website,
      },
      publisher: {
        '@type': 'Organization',
        name: this.defaultSEO.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.defaultSEO.siteUrl}/assets/images/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl,
      },
      articleSection: post.categories?.[0]?.name || 'Blog',
      keywords: [
        ...post.tags,
        ...(post.categories?.map((cat) => cat.name) || []),
      ],
      wordCount: this.estimateWordCount(post.content),
      timeRequired: `PT${post.readingTime}M`,
    };
  }

  /**
   * Genera structured data para breadcrumbs
   */
  generateBreadcrumbStructuredData(
    breadcrumbs: Array<{ name: string; url: string }>
  ): StructuredDataBreadcrumb {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Genera structured data para el sitio web
   */
  generateWebsiteStructuredData(): StructuredDataWebsite {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.defaultSEO.siteName,
      url: this.defaultSEO.siteUrl,
      description: 'Blog sobre tecnología, desarrollo y diseño web',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.defaultSEO.siteUrl}/blog/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /**
   * Inserta structured data en el DOM
   */
  insertStructuredData(data: any, id?: string): void {
    if (!this.isBrowser) return;

    // Remover structured data existente con el mismo ID
    if (id) {
      const existing = this.document.querySelector(
        `script[type="application/ld+json"][data-id="${id}"]`
      );
      if (existing) {
        existing.remove();
      }
    }

    // Crear nuevo script
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    if (id) {
      script.setAttribute('data-id', id);
    }
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  /**
   * Configura SEO para la página principal del blog
   */
  setupBlogHomeSEO(): void {
    const seoData: SEOData = {
      title: 'Blog | Últimos Artículos sobre Tecnología y Desarrollo',
      description:
        'Descubre los últimos artículos sobre tecnología, desarrollo web, programación y diseño. Tutoriales, guías y consejos para desarrolladores.',
      keywords:
        'blog, tecnología, desarrollo web, programación, angular, javascript, css, html',
      canonical: `${this.defaultSEO.siteUrl}/blog`,
      ogImage: `${this.defaultSEO.siteUrl}/assets/images/blog-og-image.jpg`,
      ogType: 'website',
    };

    this.updateSEO(seoData);

    // Structured data del sitio web
    const websiteData = this.generateWebsiteStructuredData();
    this.insertStructuredData(websiteData, 'website');
  }

  /**
   * Configura SEO para un artículo específico
   */
  setupArticleSEO(post: BlogPost): void {
    const seoData: SEOData = {
      title: `${post.title} | ${this.defaultSEO.siteName}`,
      description: post.excerpt,
      keywords: [
        ...post.tags,
        ...(post.categories?.map((cat) => cat.name) || []),
      ].join(', '),
      canonical: `${this.defaultSEO.siteUrl}/blog/${post.slug}`,
      ogImage: post.featuredImage,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      author: post.author?.name,
      publishedTime:
        post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.categories?.[0]?.name,
      tags: post.tags,
    };

    this.updateSEO(seoData);

    // Structured data del artículo
    const articleData = this.generateArticleStructuredData(post);
    this.insertStructuredData(articleData, 'article');

    // Breadcrumbs
    const breadcrumbs = [
      { name: 'Inicio', url: this.defaultSEO.siteUrl },
      { name: 'Blog', url: `${this.defaultSEO.siteUrl}/blog` },
      { name: post.title, url: `${this.defaultSEO.siteUrl}/blog/${post.slug}` },
    ];

    if (post.categories && post.categories.length > 0) {
      breadcrumbs.splice(-1, 0, {
        name: post.categories[0].name,
        url: `${this.defaultSEO.siteUrl}/blog/categoria/${post.categories[0].slug}`,
      });
    }

    const breadcrumbData = this.generateBreadcrumbStructuredData(breadcrumbs);
    this.insertStructuredData(breadcrumbData, 'breadcrumb');
  }

  /**
   * Configura SEO para una categoría
   */
  setupCategorySEO(category: BlogCategory, postsCount: number): void {
    const seoData: SEOData = {
      title: `${category.name} | Artículos de ${category.name} | ${this.defaultSEO.siteName}`,
      description: `${category.description} Encuentra ${postsCount} artículos sobre ${category.name}.`,
      keywords: `${category.name}, ${category.description}, artículos, blog`,
      canonical: `${this.defaultSEO.siteUrl}/blog/categoria/${category.slug}`,
      ogImage: `${this.defaultSEO.siteUrl}/assets/images/categories/${category.slug}-og.jpg`,
      ogType: 'website',
    };

    this.updateSEO(seoData);

    // Breadcrumbs para categoría
    const breadcrumbs = [
      { name: 'Inicio', url: this.defaultSEO.siteUrl },
      { name: 'Blog', url: `${this.defaultSEO.siteUrl}/blog` },
      {
        name: category.name,
        url: `${this.defaultSEO.siteUrl}/blog/categoria/${category.slug}`,
      },
    ];

    const breadcrumbData = this.generateBreadcrumbStructuredData(breadcrumbs);
    this.insertStructuredData(breadcrumbData, 'breadcrumb');
  }

  /**
   * Configura SEO para la página de búsqueda
   */
  setupSearchSEO(query?: string, resultCount?: number): void {
    const title = query
      ? `Resultados para "${query}" | ${this.defaultSEO.siteName}`
      : `Buscar en el Blog | ${this.defaultSEO.siteName}`;

    const description = query
      ? `${
          resultCount || 0
        } resultados encontrados para "${query}". Encuentra artículos relevantes en nuestro blog.`
      : 'Busca artículos sobre tecnología, desarrollo web, programación y más en nuestro blog.';

    const seoData: SEOData = {
      title,
      description,
      keywords: 'buscar, blog, artículos, tecnología, desarrollo',
      canonical: `${this.defaultSEO.siteUrl}/blog/search${
        query ? `?q=${encodeURIComponent(query)}` : ''
      }`,
      ogType: 'website',
    };

    this.updateSEO(seoData);

    // No indexar páginas de búsqueda con query
    if (query) {
      this.metaService.updateTag({
        name: 'robots',
        content: 'noindex, follow',
      });
    }
  }

  /**
   * Estima el número de palabras en el contenido
   */
  private estimateWordCount(content: string): number {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remover HTML tags
    return textContent.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Obtiene la URL actual
   */
  private getCurrentUrl(): string {
    if (!this.isBrowser) {
      return this.defaultSEO.siteUrl;
    }
    return this.document.location.href;
  }

  /**
   * Limpia structured data específico
   */
  clearStructuredData(id: string): void {
    if (!this.isBrowser) return;

    const element = this.document.querySelector(
      `script[type="application/ld+json"][data-id="${id}"]`
    );
    if (element) {
      element.remove();
    }
  }

  /**
   * Limpia todos los structured data
   */
  clearAllStructuredData(): void {
    if (!this.isBrowser) return;

    const elements = this.document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    elements.forEach((element) => element.remove());
  }
}
