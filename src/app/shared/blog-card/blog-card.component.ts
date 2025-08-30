import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { BlogPost } from '../../core/models/blog.interface';

/**
 * Tipos de layout disponibles para el blog card
 */
export type BlogCardLayout = 'grid' | 'list' | 'featured' | 'compact';

/**
 * Configuración del blog card
 */
export interface BlogCardConfig {
  layout: BlogCardLayout;
  showExcerpt: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showCategories: boolean;
  showTags: boolean;
  showReadingTime: boolean;
  showCounters: boolean;
  enableHover: boolean;
  enableAnimations: boolean;
}

/**
 * Componente Blog Card
 * Tarjeta responsive para mostrar posts del blog con múltiples layouts
 */
@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCardComponent {
  // Inputs
  @Input({ required: true }) post!: BlogPost;
  @Input() config: Partial<BlogCardConfig> = {};
  @Input() priority: boolean = false; // Para NgOptimizedImage
  @Input() loading: 'eager' | 'lazy' = 'lazy';

  // Outputs
  @Output() cardClick = new EventEmitter<BlogPost>();
  @Output() authorClick = new EventEmitter<BlogPost>();
  @Output() categoryClick = new EventEmitter<{
    post: BlogPost;
    categoryId: string;
  }>();
  @Output() tagClick = new EventEmitter<{ post: BlogPost; tag: string }>();
  @Output() likeClick = new EventEmitter<BlogPost>();
  @Output() shareClick = new EventEmitter<BlogPost>();

  // Estados reactivos
  private _isHovered = signal<boolean>(false);
  private _isLiked = signal<boolean>(false);
  private _imageLoaded = signal<boolean>(false);
  private _imageError = signal<boolean>(false);

  // Configuración por defecto
  private _defaultConfig: BlogCardConfig = {
    layout: 'grid',
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showCategories: true,
    showTags: false,
    showReadingTime: true,
    showCounters: false,
    enableHover: true,
    enableAnimations: true,
  };

  // Computed properties
  protected readonly finalConfig = computed<BlogCardConfig>(() => ({
    ...this._defaultConfig,
    ...this.config,
  }));

  protected readonly isHovered = this._isHovered.asReadonly();
  protected readonly isLiked = this._isLiked.asReadonly();
  protected readonly imageLoaded = this._imageLoaded.asReadonly();
  protected readonly imageError = this._imageError.asReadonly();

  // CSS classes computadas
  protected readonly cardClasses = computed(() => {
    const config = this.finalConfig();
    const baseClasses = [
      'blog-card',
      'group',
      'relative',
      'overflow-hidden',
      'bg-white',
      'dark:bg-gray-800',
      'border',
      'border-gray-200',
      'dark:border-gray-700',
      'transition-all',
      'duration-300',
      'ease-in-out',
    ];

    // Layout específico
    switch (config.layout) {
      case 'grid':
        baseClasses.push(
          'rounded-xl',
          'shadow-sm',
          'hover:shadow-lg',
          'hover:-translate-y-1'
        );
        break;
      case 'list':
        baseClasses.push(
          'rounded-lg',
          'shadow-sm',
          'hover:shadow-md',
          'flex',
          'flex-col',
          'md:flex-row'
        );
        break;
      case 'featured':
        baseClasses.push(
          'rounded-2xl',
          'shadow-lg',
          'hover:shadow-xl',
          'hover:-translate-y-2',
          'border-2',
          'border-blue-100',
          'dark:border-blue-900'
        );
        break;
      case 'compact':
        baseClasses.push(
          'rounded-lg',
          'shadow-sm',
          'hover:shadow-md',
          'hover:scale-105'
        );
        break;
    }

    // Estados
    if (config.enableHover && this.isHovered()) {
      baseClasses.push('scale-[1.02]');
    }

    if (config.enableAnimations) {
      baseClasses.push('animate-fadeInUp');
    }

    return baseClasses.join(' ');
  });

  protected readonly imageClasses = computed(() => {
    const config = this.finalConfig();
    const baseClasses = [
      'w-full',
      'object-cover',
      'transition-transform',
      'duration-500',
      'group-hover:scale-110',
    ];

    // Altura según layout
    switch (config.layout) {
      case 'grid':
        baseClasses.push('aspect-[16/9]', 'h-48');
        break;
      case 'list':
        baseClasses.push('aspect-[4/3]', 'md:w-1/3', 'h-48', 'md:h-auto');
        break;
      case 'featured':
        baseClasses.push('aspect-[16/9]', 'h-64');
        break;
      case 'compact':
        baseClasses.push('aspect-[16/9]', 'h-32');
        break;
    }

    return baseClasses.join(' ');
  });

  // Métodos del componente
  protected onCardClick(event: Event): void {
    event.preventDefault();
    this.cardClick.emit(this.post);
  }

  protected onAuthorClick(event: Event): void {
    event.stopPropagation();
    this.authorClick.emit(this.post);
  }

  protected onCategoryClick(event: Event, categoryId: string): void {
    event.stopPropagation();
    this.categoryClick.emit({ post: this.post, categoryId });
  }

  protected onTagClick(event: Event, tag: string): void {
    event.stopPropagation();
    this.tagClick.emit({ post: this.post, tag });
  }

  protected onLikeClick(event: Event): void {
    event.stopPropagation();
    this._isLiked.update((liked) => !liked);
    this.likeClick.emit(this.post);
  }

  protected onShareClick(event: Event): void {
    event.stopPropagation();
    this.shareClick.emit(this.post);
  }

  protected onMouseEnter(): void {
    if (this.finalConfig().enableHover) {
      this._isHovered.set(true);
    }
  }

  protected onMouseLeave(): void {
    if (this.finalConfig().enableHover) {
      this._isHovered.set(false);
    }
  }

  protected onImageLoad(): void {
    this._imageLoaded.set(true);
  }

  protected onImageError(): void {
    this._imageError.set(true);
  }

  // Utilidades
  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  protected getReadingTimeText(minutes: number): string {
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
  }

  protected getCategoryColor(categoryId: string): string {
    const category = this.post.categories?.find((cat) => cat.id === categoryId);
    return category?.color || '#6B7280';
  }

  protected truncateText(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }

  // Método para optimizar trackBy en ngFor
  protected trackByCategory(index: number, categoryId: string): string {
    return categoryId;
  }

  protected trackByTag(index: number, tag: string): string {
    return tag;
  }
}
