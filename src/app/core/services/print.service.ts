import { Injectable, inject, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BlogPost } from '../models/blog.interface';

interface PrintOptions {
  title?: string;
  includeImages?: boolean;
  includeComments?: boolean;
  includeSidebar?: boolean;
  includeNavigation?: boolean;
  includeFooter?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  pageOrientation?: 'portrait' | 'landscape';
  pageMargins?: 'narrow' | 'normal' | 'wide';
  colorMode?: 'color' | 'grayscale' | 'blackwhite';
}

interface PrintableContent {
  title: string;
  content: string;
  styles: string;
  metadata?: {
    author: string;
    date: string;
    url: string;
    readingTime: string;
    tags: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  private isBrowser: boolean;
  private printWindow: Window | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.addPrintStyles();
    }
  }

  /**
   * Añade estilos de impresión global al documento
   */
  private addPrintStyles(): void {
    if (!this.isBrowser) return;

    const existingStyle = this.document.getElementById('print-styles');
    if (existingStyle) return;

    const style = this.document.createElement('style');
    style.id = 'print-styles';
    style.textContent = this.getGlobalPrintStyles();
    this.document.head.appendChild(style);
  }

  /**
   * Obtiene los estilos globales de impresión
   */
  private getGlobalPrintStyles(): string {
    return `
      @media print {
        /* Reset básico para impresión */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Ocultar elementos no deseados */
        .no-print,
        nav,
        .navbar,
        .navigation,
        .sidebar,
        .comments-form,
        .social-share,
        .sticky-header,
        .floating-elements,
        .scroll-to-top,
        .cookie-banner,
        .modal,
        .popup,
        button:not(.print-friendly),
        .advertisement,
        .related-posts:not(.print-friendly),
        .newsletter-signup,
        .search-bar,
        .filters,
        .pagination:not(.print-friendly),
        .breadcrumb:not(.print-friendly) {
          display: none !important;
        }

        /* Elementos específicos del blog */
        .blog-header .actions,
        .blog-comments .comment-actions,
        .blog-sidebar:not(.print-friendly),
        .blog-search,
        .blog-filters,
        .share-buttons,
        .bookmark-btn,
        .like-btn,
        .comment-form,
        .load-more,
        .infinite-scroll {
          display: none !important;
        }

        /* Layout para impresión */
        body {
          font-family: "Times New Roman", serif !important;
          font-size: 12pt !important;
          line-height: 1.4 !important;
          color: #000 !important;
          background: white !important;
          margin: 0 !important;
          padding: 20pt !important;
        }

        /* Contenedor principal */
        .print-container,
        .blog-post,
        .post-content {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Títulos */
        h1, h2, h3, h4, h5, h6 {
          color: #000 !important;
          page-break-after: avoid;
          page-break-inside: avoid;
          margin-top: 20pt !important;
          margin-bottom: 10pt !important;
        }

        h1 {
          font-size: 20pt !important;
          font-weight: bold !important;
          border-bottom: 2pt solid #000 !important;
          padding-bottom: 5pt !important;
        }

        h2 {
          font-size: 16pt !important;
          font-weight: bold !important;
        }

        h3 {
          font-size: 14pt !important;
          font-weight: bold !important;
        }

        /* Párrafos */
        p {
          text-align: justify !important;
          margin-bottom: 12pt !important;
          line-height: 1.4 !important;
          orphans: 3;
          widows: 3;
        }

        /* Enlaces */
        a {
          color: #000 !important;
          text-decoration: underline !important;
        }

        a[href]:after {
          content: " (" attr(href) ")" !important;
          font-size: 9pt !important;
          color: #666 !important;
        }

        /* Enlaces internos - no mostrar URL */
        a[href^="/"]:after,
        a[href^="#"]:after,
        a.no-print-url:after {
          content: "" !important;
        }

        /* Listas */
        ul, ol {
          margin-left: 20pt !important;
          margin-bottom: 12pt !important;
        }

        li {
          margin-bottom: 6pt !important;
        }

        /* Blockquotes */
        blockquote {
          margin: 12pt 20pt !important;
          padding: 8pt 12pt !important;
          border-left: 3pt solid #000 !important;
          font-style: italic !important;
          background: #f5f5f5 !important;
        }

        /* Código */
        code {
          font-family: "Courier New", monospace !important;
          background: #f0f0f0 !important;
          padding: 2pt 4pt !important;
          border: 1pt solid #ccc !important;
          font-size: 10pt !important;
        }

        pre {
          font-family: "Courier New", monospace !important;
          background: #f0f0f0 !important;
          padding: 8pt !important;
          border: 1pt solid #ccc !important;
          font-size: 9pt !important;
          white-space: pre-wrap !important;
          page-break-inside: avoid;
        }

        /* Imágenes */
        img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid;
          margin: 12pt 0 !important;
        }

        /* Figuras */
        figure {
          page-break-inside: avoid;
          margin: 12pt 0 !important;
        }

        figcaption {
          font-size: 10pt !important;
          font-style: italic !important;
          text-align: center !important;
          margin-top: 6pt !important;
        }

        /* Tablas */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 12pt 0 !important;
          page-break-inside: avoid;
        }

        th, td {
          border: 1pt solid #000 !important;
          padding: 6pt !important;
          text-align: left !important;
        }

        th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
        }

        /* Metadatos del artículo */
        .post-meta,
        .article-meta {
          border-top: 1pt solid #ccc !important;
          border-bottom: 1pt solid #ccc !important;
          padding: 8pt 0 !important;
          margin: 12pt 0 !important;
          font-size: 10pt !important;
        }

        /* Tags y categorías */
        .post-tags,
        .post-categories {
          font-size: 10pt !important;
          margin: 6pt 0 !important;
        }

        .tag,
        .category {
          display: inline !important;
          background: transparent !important;
          border: 1pt solid #000 !important;
          padding: 2pt 4pt !important;
          margin-right: 4pt !important;
        }

        /* Control de saltos de página */
        .page-break-before {
          page-break-before: always;
        }

        .page-break-after {
          page-break-after: always;
        }

        .page-break-inside-avoid {
          page-break-inside: avoid;
        }

        /* Header y footer de impresión */
        @page {
          margin: 2cm;
          
          @top-right {
            content: counter(page);
            font-size: 10pt;
          }
          
          @bottom-left {
            content: "Impreso desde: " attr(data-url);
            font-size: 8pt;
            color: #666;
          }
          
          @bottom-right {
            content: "Página " counter(page) " de " counter(pages);
            font-size: 8pt;
            color: #666;
          }
        }

        /* Primera página sin header */
        @page :first {
          @top-right {
            content: "";
          }
        }

        /* Optimizaciones para diferentes tamaños */
        .print-small {
          font-size: 10pt !important;
        }

        .print-medium {
          font-size: 12pt !important;
        }

        .print-large {
          font-size: 14pt !important;
        }

        /* Modo escala de grises */
        .print-grayscale * {
          -webkit-filter: grayscale(100%) !important;
          filter: grayscale(100%) !important;
        }

        /* Modo blanco y negro */
        .print-blackwhite * {
          -webkit-filter: grayscale(100%) contrast(200%) !important;
          filter: grayscale(100%) contrast(200%) !important;
        }
      }
    `;
  }

  /**
   * Imprime la página actual
   */
  printCurrentPage(options: PrintOptions = {}): void {
    if (!this.isBrowser) return;

    this.preparePrintLayout(options);

    setTimeout(() => {
      window.print();
      this.restoreLayout();
    }, 100);
  }

  /**
   * Imprime un post específico
   */
  printPost(post: BlogPost, options: PrintOptions = {}): void {
    if (!this.isBrowser) return;

    const content = this.generatePrintableContent(post, options);
    this.openPrintWindow(content);
  }

  /**
   * Imprime contenido personalizado
   */
  printContent(content: string, options: PrintOptions = {}): void {
    if (!this.isBrowser) return;

    const printableContent: PrintableContent = {
      title: options.title || 'Contenido Imprimible',
      content,
      styles: this.generatePrintStyles(options),
    };

    this.openPrintWindow(printableContent);
  }

  /**
   * Genera contenido imprimible a partir de un post
   */
  private generatePrintableContent(
    post: BlogPost,
    options: PrintOptions
  ): PrintableContent {
    const metadata = {
      author: post.author?.name || 'Autor desconocido',
      date:
        post.publishedAt?.toLocaleDateString() ||
        post.createdAt.toLocaleDateString(),
      url: window.location.href,
      readingTime: `${post.readingTime} minutos de lectura`,
      tags: post.tags || [],
    };

    const contentSections = [];

    // Título
    contentSections.push(`<h1>${post.title}</h1>`);

    // Metadatos
    contentSections.push(`
      <div class="article-meta">
        <p><strong>Autor:</strong> ${metadata.author}</p>
        <p><strong>Fecha:</strong> ${metadata.date}</p>
        <p><strong>Tiempo de lectura:</strong> ${metadata.readingTime}</p>
        ${
          metadata.tags.length > 0
            ? `<p><strong>Tags:</strong> ${metadata.tags.join(', ')}</p>`
            : ''
        }
      </div>
    `);

    // Imagen destacada
    if (options.includeImages !== false && post.featuredImage) {
      contentSections.push(`
        <figure>
          <img src="${post.featuredImage}" alt="${post.title}" />
          <figcaption>Imagen del artículo: ${post.title}</figcaption>
        </figure>
      `);
    }

    // Contenido principal
    let content = post.content;

    // Limpiar contenido si es necesario
    if (options.includeImages === false) {
      content = content.replace(/<img[^>]*>/g, '');
      content = content.replace(/<figure[^>]*>.*?<\/figure>/gs, '');
    }

    contentSections.push(content);

    // URL de referencia
    contentSections.push(`
      <div class="print-footer page-break-before">
        <p><small>Artículo original disponible en: <a href="${
          metadata.url
        }" class="no-print-url">${metadata.url}</a></small></p>
        <p><small>Impreso el: ${new Date().toLocaleDateString()}</small></p>
      </div>
    `);

    return {
      title: post.title,
      content: contentSections.join('\n'),
      styles: this.generatePrintStyles(options),
      metadata,
    };
  }

  /**
   * Genera estilos específicos para impresión
   */
  private generatePrintStyles(options: PrintOptions): string {
    const baseStyles = this.getGlobalPrintStyles();
    const customStyles = [];

    // Tamaño de fuente
    if (options.fontSize) {
      customStyles.push(`
        @media print {
          body { font-size: ${
            options.fontSize === 'small'
              ? '10pt'
              : options.fontSize === 'large'
              ? '14pt'
              : '12pt'
          } !important; }
        }
      `);
    }

    // Modo de color
    if (options.colorMode === 'grayscale') {
      customStyles.push(`
        @media print {
          * { -webkit-filter: grayscale(100%) !important; filter: grayscale(100%) !important; }
        }
      `);
    } else if (options.colorMode === 'blackwhite') {
      customStyles.push(`
        @media print {
          * { -webkit-filter: grayscale(100%) contrast(200%) !important; filter: grayscale(100%) contrast(200%) !important; }
        }
      `);
    }

    // Márgenes de página
    if (options.pageMargins) {
      const margins = {
        narrow: '1cm',
        normal: '2cm',
        wide: '3cm',
      };

      customStyles.push(`
        @media print {
          @page { margin: ${margins[options.pageMargins]}; }
        }
      `);
    }

    // Orientación
    if (options.pageOrientation === 'landscape') {
      customStyles.push(`
        @media print {
          @page { size: landscape; }
        }
      `);
    }

    return baseStyles + customStyles.join('\n');
  }

  /**
   * Abre una ventana de impresión con contenido específico
   */
  private openPrintWindow(content: PrintableContent): void {
    if (!this.isBrowser) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${content.title} - Versión para imprimir</title>
          <style>${content.styles}</style>
        </head>
        <body data-url="${window.location.href}">
          <div class="print-container">
            ${content.content}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    this.printWindow = window.open('', '_blank', 'width=800,height=600');

    if (this.printWindow) {
      this.printWindow.document.write(printContent);
      this.printWindow.document.close();
    }
  }

  /**
   * Prepara el layout para impresión
   */
  private preparePrintLayout(options: PrintOptions): void {
    if (!this.isBrowser) return;

    const body = this.document.body;

    // Agregar clases de configuración
    if (options.fontSize) {
      body.classList.add(`print-${options.fontSize}`);
    }

    if (options.colorMode === 'grayscale') {
      body.classList.add('print-grayscale');
    } else if (options.colorMode === 'blackwhite') {
      body.classList.add('print-blackwhite');
    }

    // Ocultar elementos según configuración
    if (options.includeSidebar === false) {
      this.hideElements('.sidebar, .blog-sidebar');
    }

    if (options.includeNavigation === false) {
      this.hideElements('nav, .navbar, .navigation');
    }

    if (options.includeFooter === false) {
      this.hideElements('footer, .footer');
    }

    if (options.includeComments === false) {
      this.hideElements('.comments, .blog-comments');
    }
  }

  /**
   * Restaura el layout después de imprimir
   */
  private restoreLayout(): void {
    if (!this.isBrowser) return;

    const body = this.document.body;

    // Remover clases temporales
    body.classList.remove('print-small', 'print-medium', 'print-large');
    body.classList.remove('print-grayscale', 'print-blackwhite');

    // Restaurar elementos ocultos
    const hiddenElements = this.document.querySelectorAll('.print-hidden');
    hiddenElements.forEach((element) => {
      element.classList.remove('print-hidden');
      (element as HTMLElement).style.display = '';
    });
  }

  /**
   * Oculta elementos específicos
   */
  private hideElements(selector: string): void {
    const elements = this.document.querySelectorAll(selector);
    elements.forEach((element) => {
      element.classList.add('print-hidden');
      (element as HTMLElement).style.display = 'none';
    });
  }

  /**
   * Verifica si el navegador soporta impresión
   */
  canPrint(): boolean {
    return this.isBrowser && 'print' in window;
  }

  /**
   * Obtiene configuración de impresión recomendada para un tipo de contenido
   */
  getRecommendedPrintOptions(
    contentType: 'article' | 'list' | 'page'
  ): PrintOptions {
    const baseOptions: PrintOptions = {
      includeImages: true,
      includeComments: false,
      includeSidebar: false,
      includeNavigation: false,
      includeFooter: false,
      fontSize: 'medium',
      pageOrientation: 'portrait',
      pageMargins: 'normal',
      colorMode: 'color',
    };

    switch (contentType) {
      case 'article':
        return {
          ...baseOptions,
          includeImages: true,
          includeComments: false,
        };

      case 'list':
        return {
          ...baseOptions,
          includeImages: false,
          fontSize: 'small',
          pageOrientation: 'portrait',
        };

      case 'page':
        return {
          ...baseOptions,
          includeSidebar: true,
          includeFooter: true,
        };

      default:
        return baseOptions;
    }
  }
}
