import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface TagItem {
  name: string;
  slug: string;
  count: number;
  description?: string;
  color?: string;
  popularity: number;
  category?: 'tecnologia' | 'desarrollo' | 'diseno' | 'herramientas' | 'otros';
}

interface TagCloud extends TagItem {
  fontSize: number;
  weight: number;
}

interface TagFilter {
  tags: string[];
  operator: 'AND' | 'OR';
}

@Component({
  selector: 'app-blog-tags',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-tags.component.html',
  styleUrls: ['./blog-tags.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogTagsComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  // Inputs
  @Input() tags: string[] = [];
  @Input() selectedTags: string[] = [];
  @Input() mode: 'list' | 'cloud' | 'inline' | 'filter' = 'list';
  @Input() maxTags: number = 50;
  @Input() minFontSize: number = 12;
  @Input() maxFontSize: number = 24;
  @Input() showCount: boolean = true;
  @Input() allowMultiSelect: boolean = true;
  @Input() showRelated: boolean = false;
  @Input() interactive: boolean = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'default' | 'outline' | 'filled' | 'gradient' = 'default';

  // Outputs
  @Output() tagClick = new EventEmitter<string>();
  @Output() tagSelect = new EventEmitter<string[]>();
  @Output() tagHover = new EventEmitter<TagItem>();
  @Output() relatedTagsRequest = new EventEmitter<string>();

  // Estado reactivo
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _hoveredTag = signal<string | null>(null);
  private readonly _searchQuery = signal<string>('');
  private readonly _sortBy = signal<'name' | 'count' | 'popularity'>(
    'popularity'
  );

  // Datos de tags
  private readonly _allTags = signal<TagItem[]>([]);
  private readonly _relatedTags = signal<TagItem[]>([]);

  // Computed signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hoveredTag = this._hoveredTag.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();

  // Tags procesados y filtrados
  readonly processedTags = computed(() => {
    const allTags = this._allTags();
    const query = this.searchQuery().toLowerCase();
    const sortBy = this.sortBy();

    let filtered = allTags;

    // Filtrar por búsqueda
    if (query) {
      filtered = filtered.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query) ||
          tag.description?.toLowerCase().includes(query)
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'count':
          return b.count - a.count;
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

    // Limitar cantidad
    return filtered.slice(0, this.maxTags);
  });

  // Tag cloud computado
  readonly tagCloud = computed(() => {
    const tags = this.processedTags();
    if (tags.length === 0) return [];

    const maxCount = Math.max(...tags.map((t) => t.count));
    const minCount = Math.min(...tags.map((t) => t.count));
    const countRange = maxCount - minCount || 1;

    return tags.map((tag) => {
      const normalizedCount = (tag.count - minCount) / countRange;
      const fontSize =
        this.minFontSize +
        (this.maxFontSize - this.minFontSize) * normalizedCount;
      const weight = Math.min(Math.max(normalizedCount * 900 + 100, 100), 900);

      return {
        ...tag,
        fontSize: Math.round(fontSize),
        weight: Math.round(weight),
      } as TagCloud;
    });
  });

  // Tags relacionados computados
  readonly relatedTags = computed(() => {
    const related = this._relatedTags();
    const selected = this.selectedTags;

    return related.filter((tag) => !selected.includes(tag.name));
  });

  // Estado de selección
  readonly isTagSelected = computed(() => {
    const selected = this.selectedTags;
    return (tagName: string) => selected.includes(tagName);
  });

  readonly hasSelectedTags = computed(() => this.selectedTags.length > 0);

  // Categorías de tags
  readonly tagCategories = computed(() => {
    const tags = this.processedTags();
    const categories = new Map<string, TagItem[]>();

    tags.forEach((tag) => {
      const category = tag.category || 'otros';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(tag);
    });

    return Array.from(categories.entries()).map(([name, items]) => ({
      name,
      items,
      count: items.length,
    }));
  });

  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadTags();

    if (this.showRelated && this.selectedTags.length > 0) {
      this.loadRelatedTags();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los tags principales
   */
  private loadTags(): void {
    this._loading.set(true);
    this._error.set(null);

    // Simular carga de tags
    setTimeout(() => {
      const mockTags = this.generateMockTags();
      this._allTags.set(mockTags);
      this._loading.set(false);
    }, 300);
  }

  /**
   * Carga tags relacionados
   */
  private loadRelatedTags(): void {
    if (this.selectedTags.length === 0) {
      this._relatedTags.set([]);
      return;
    }

    // Simular carga de tags relacionados
    setTimeout(() => {
      const related = this.generateRelatedTags(this.selectedTags);
      this._relatedTags.set(related);
    }, 200);
  }

  /**
   * Genera datos mock de tags
   */
  private generateMockTags(): TagItem[] {
    return [
      {
        name: 'Angular',
        slug: 'angular',
        count: 45,
        description: 'Framework de desarrollo web',
        color: '#dd0031',
        popularity: 0.9,
        category: 'desarrollo',
      },
      {
        name: 'TypeScript',
        slug: 'typescript',
        count: 38,
        description: 'Superset tipado de JavaScript',
        color: '#3178c6',
        popularity: 0.85,
        category: 'desarrollo',
      },
      {
        name: 'JavaScript',
        slug: 'javascript',
        count: 52,
        description: 'Lenguaje de programación web',
        color: '#f7df1e',
        popularity: 0.95,
        category: 'desarrollo',
      },
      {
        name: 'CSS',
        slug: 'css',
        count: 34,
        description: 'Hojas de estilo en cascada',
        color: '#1572b6',
        popularity: 0.8,
        category: 'diseno',
      },
      {
        name: 'Tailwind CSS',
        slug: 'tailwind-css',
        count: 28,
        description: 'Framework CSS utility-first',
        color: '#06b6d4',
        popularity: 0.75,
        category: 'diseno',
      },
      {
        name: 'HTML',
        slug: 'html',
        count: 41,
        description: 'Lenguaje de marcado de hipertexto',
        color: '#e34f26',
        popularity: 0.88,
        category: 'desarrollo',
      },
      {
        name: 'React',
        slug: 'react',
        count: 36,
        description: 'Biblioteca para interfaces de usuario',
        color: '#61dafb',
        popularity: 0.82,
        category: 'desarrollo',
      },
      {
        name: 'Vue.js',
        slug: 'vuejs',
        count: 25,
        description: 'Framework progresivo de JavaScript',
        color: '#4fc08d',
        popularity: 0.7,
        category: 'desarrollo',
      },
      {
        name: 'Node.js',
        slug: 'nodejs',
        count: 32,
        description: 'Runtime de JavaScript del lado servidor',
        color: '#339933',
        popularity: 0.78,
        category: 'desarrollo',
      },
      {
        name: 'Web Performance',
        slug: 'web-performance',
        count: 22,
        description: 'Optimización del rendimiento web',
        color: '#ff6b6b',
        popularity: 0.65,
        category: 'tecnologia',
      },
      {
        name: 'PWA',
        slug: 'pwa',
        count: 18,
        description: 'Progressive Web Applications',
        color: '#5a67d8',
        popularity: 0.6,
        category: 'tecnologia',
      },
      {
        name: 'SEO',
        slug: 'seo',
        count: 26,
        description: 'Search Engine Optimization',
        color: '#48bb78',
        popularity: 0.72,
        category: 'tecnologia',
      },
      {
        name: 'UX/UI',
        slug: 'ux-ui',
        count: 31,
        description: 'Experiencia y diseño de usuario',
        color: '#ed64a6',
        popularity: 0.77,
        category: 'diseno',
      },
      {
        name: 'Git',
        slug: 'git',
        count: 29,
        description: 'Control de versiones',
        color: '#f05032',
        popularity: 0.76,
        category: 'herramientas',
      },
      {
        name: 'VS Code',
        slug: 'vs-code',
        count: 15,
        description: 'Editor de código',
        color: '#007acc',
        popularity: 0.55,
        category: 'herramientas',
      },
      {
        name: 'API',
        slug: 'api',
        count: 33,
        description: 'Application Programming Interface',
        color: '#9f7aea',
        popularity: 0.79,
        category: 'desarrollo',
      },
      {
        name: 'Testing',
        slug: 'testing',
        count: 20,
        description: 'Pruebas de software',
        color: '#38b2ac',
        popularity: 0.63,
        category: 'desarrollo',
      },
      {
        name: 'DevOps',
        slug: 'devops',
        count: 17,
        description: 'Desarrollo y operaciones',
        color: '#4299e1',
        popularity: 0.58,
        category: 'tecnologia',
      },
      {
        name: 'Responsive Design',
        slug: 'responsive-design',
        count: 24,
        description: 'Diseño web adaptable',
        color: '#f56565',
        popularity: 0.68,
        category: 'diseno',
      },
      {
        name: 'Accessibility',
        slug: 'accessibility',
        count: 16,
        description: 'Accesibilidad web',
        color: '#68d391',
        popularity: 0.57,
        category: 'diseno',
      },
    ];
  }

  /**
   * Genera tags relacionados basados en los seleccionados
   */
  private generateRelatedTags(selectedTags: string[]): TagItem[] {
    const allTags = this._allTags();
    const relatedMap = new Map<string, string[]>();

    // Mapeo de relaciones de tags
    relatedMap.set('Angular', [
      'TypeScript',
      'JavaScript',
      'HTML',
      'CSS',
      'Testing',
    ]);
    relatedMap.set('React', [
      'JavaScript',
      'HTML',
      'CSS',
      'Node.js',
      'Testing',
    ]);
    relatedMap.set('Vue.js', ['JavaScript', 'HTML', 'CSS', 'Node.js']);
    relatedMap.set('TypeScript', ['JavaScript', 'Angular', 'React', 'Node.js']);
    relatedMap.set('CSS', [
      'HTML',
      'Tailwind CSS',
      'Responsive Design',
      'UX/UI',
    ]);
    relatedMap.set('JavaScript', ['HTML', 'CSS', 'Node.js', 'API', 'Testing']);

    const relatedTagNames = new Set<string>();

    selectedTags.forEach((tagName) => {
      const related = relatedMap.get(tagName) || [];
      related.forEach((relatedName) => {
        if (!selectedTags.includes(relatedName)) {
          relatedTagNames.add(relatedName);
        }
      });
    });

    return allTags.filter((tag) => relatedTagNames.has(tag.name));
  }

  /**
   * Maneja el click en un tag
   */
  onTagClick(tag: TagItem): void {
    if (!this.interactive) return;

    this.tagClick.emit(tag.name);

    if (this.allowMultiSelect) {
      const currentSelected = [...this.selectedTags];
      const tagIndex = currentSelected.indexOf(tag.name);

      if (tagIndex === -1) {
        currentSelected.push(tag.name);
      } else {
        currentSelected.splice(tagIndex, 1);
      }

      this.tagSelect.emit(currentSelected);
    } else {
      this.tagSelect.emit([tag.name]);
    }
  }

  /**
   * Remueve un tag por nombre (helper para el template)
   */
  removeTagByName(tagName: string): void {
    if (!this.interactive) return;

    const tagItem = this.processedTags().find((tag) => tag.name === tagName);
    if (tagItem) {
      this.onTagClick(tagItem);
    }
  }

  /**
   * Genera un ancho aleatorio para el skeleton loading
   */
  getRandomWidth(): number {
    return 60 + Math.random() * 40;

    // Cargar tags relacionados si es necesario
    if (this.showRelated) {
      this.loadRelatedTags();
    }
  }

  /**
   * Maneja el hover sobre un tag
   */
  onTagHover(tag: TagItem | null): void {
    this._hoveredTag.set(tag?.name || null);

    if (tag) {
      this.tagHover.emit(tag);
    }
  }

  /**
   * Solicita tags relacionados
   */
  onRequestRelated(tagName: string): void {
    this.relatedTagsRequest.emit(tagName);
  }

  /**
   * Actualiza la búsqueda
   */
  onSearchChange(query: string): void {
    this._searchQuery.set(query);
  }

  /**
   * Cambia el criterio de ordenamiento
   */
  onSortChange(sortBy: 'name' | 'count' | 'popularity'): void {
    this._sortBy.set(sortBy);
  }

  /**
   * Limpia la selección
   */
  clearSelection(): void {
    this.tagSelect.emit([]);
    this._relatedTags.set([]);
  }

  /**
   * Selecciona todos los tags visibles
   */
  selectAllVisible(): void {
    const visibleTags = this.processedTags().map((tag) => tag.name);
    this.tagSelect.emit(visibleTags);
  }

  /**
   * Obtiene la clase CSS para un tag
   */
  getTagClasses(tag: TagItem): string {
    const baseClasses = ['blog-tag'];
    const isSelected = this.selectedTags.includes(tag.name);
    const isHovered = this.hoveredTag() === tag.name;

    // Tamaño
    baseClasses.push(`tag-${this.size}`);

    // Variante
    baseClasses.push(`tag-${this.variant}`);

    // Estados
    if (isSelected) baseClasses.push('tag-selected');
    if (isHovered) baseClasses.push('tag-hovered');
    if (!this.interactive) baseClasses.push('tag-readonly');

    // Categoría
    if (tag.category) baseClasses.push(`tag-category-${tag.category}`);

    return baseClasses.join(' ');
  }

  /**
   * Obtiene el estilo inline para un tag en modo cloud
   */
  getTagCloudStyle(tag: TagCloud): any {
    if (this.mode !== 'cloud') return {};

    return {
      fontSize: `${tag.fontSize}px`,
      fontWeight: tag.weight,
      color: tag.color || undefined,
    };
  }

  /**
   * TrackBy function para optimización de ngFor
   */
  trackByTagName(index: number, tag: TagItem): string {
    return tag.name;
  }

  /**
   * TrackBy function para categorías
   */
  trackByCategoryName(index: number, category: any): string {
    return category.name;
  }
}
