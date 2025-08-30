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
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  BlogComment,
  CommentStatus,
  CreateCommentData,
} from '../../core/models/comentario.interface';
import { BlogPost } from '../../core/models/blog.interface';

interface CommentTree extends BlogComment {
  replies: CommentTree[];
  level: number;
  isExpanded: boolean;
}

interface CommentFormState {
  isVisible: boolean;
  parentId: string | null;
  isEditing: boolean;
  editingCommentId: string | null;
}

@Component({
  selector: 'app-blog-comments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './blog-comments.component.html',
  styleUrls: ['./blog-comments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogCommentsComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  // Inputs
  @Input() postId!: string;
  @Input() post?: BlogPost;
  @Input() allowComments: boolean = true;
  @Input() showTitle: boolean = true;
  @Input() maxDepth: number = 5;
  @Input() commentsPerPage: number = 10;

  // Outputs
  @Output() commentSubmitted = new EventEmitter<CreateCommentData>();
  @Output() commentLiked = new EventEmitter<{
    commentId: string;
    liked: boolean;
  }>();
  @Output() commentReported = new EventEmitter<string>();

  // ViewChild para scroll automático
  @ViewChild('commentsContainer') commentsContainer!: ElementRef;

  // Estado reactivo con Signals
  private readonly _comments = signal<BlogComment[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _submitting = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentPage = signal<number>(1);
  private readonly _sortBy = signal<'newest' | 'oldest' | 'popular'>('newest');

  // Estado del formulario
  private readonly _formState = signal<CommentFormState>({
    isVisible: false,
    parentId: null,
    isEditing: false,
    editingCommentId: null,
  });

  // Computed signals
  readonly comments = this._comments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly formState = this._formState.asReadonly();

  // Árbol de comentarios computado
  readonly commentTree = computed(() => {
    const comments = this.comments();
    return this.buildCommentTree(comments);
  });

  // Estadísticas computadas
  readonly commentsStats = computed(() => {
    const comments = this.comments();
    return {
      total: comments.length,
      approved: comments.filter((c) => c.status === 'approved').length,
      pending: comments.filter((c) => c.status === 'pending').length,
      replies: comments.filter((c) => c.parentId).length,
    };
  });

  readonly canLoadMore = computed(() => {
    const total = this.commentsStats().total;
    const loaded = this.currentPage() * this.commentsPerPage;
    return loaded < total;
  });

  // Reactive Form
  commentForm!: FormGroup;

  // Configuración
  readonly sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'popular', label: 'Más populares' },
  ];

  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initializeForm(): void {
    this.commentForm = this.fb.group({
      content: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(1000),
        ],
      ],
      authorName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      authorEmail: ['', [Validators.required, Validators.email]],
      authorWebsite: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      isAnonymous: [false],
    });
  }

  /**
   * Carga los comentarios (mock)
   */
  private loadComments(): void {
    this._loading.set(true);
    this._error.set(null);

    // Simular carga de comentarios
    setTimeout(() => {
      const mockComments = this.generateMockComments();
      this._comments.set(mockComments);
      this._loading.set(false);
    }, 500);
  }

  /**
   * Genera comentarios mock para demostración
   */
  private generateMockComments(): BlogComment[] {
    const baseComments: BlogComment[] = [
      {
        id: '1',
        postId: this.postId,
        content:
          'Excelente artículo! Me ha sido muy útil para entender mejor estos conceptos. ¿Podrías profundizar más en algunos ejemplos prácticos?',
        author: {
          name: 'María González',
          email: 'maria@example.com',
          avatar:
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
        },
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00'),
        status: 'approved',
        parentId: null,
        likes: 12,
        dislikes: 1,
        isLikedByUser: false,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          isEdited: false,
        },
      },
      {
        id: '2',
        postId: this.postId,
        content:
          'Totalmente de acuerdo con María. Sería genial ver algunos casos de uso reales.',
        author: {
          name: 'Carlos Rodríguez',
          email: 'carlos@example.com',
          avatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
        },
        createdAt: new Date('2024-01-15T14:45:00'),
        updatedAt: new Date('2024-01-15T14:45:00'),
        status: 'approved',
        parentId: '1',
        likes: 8,
        dislikes: 0,
        isLikedByUser: true,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          isEdited: false,
        },
      },
      {
        id: '3',
        postId: this.postId,
        content:
          'Gracias por compartir este conocimiento. Como desarrollador junior, estos artículos me ayudan mucho en mi aprendizaje.',
        author: {
          name: 'Ana Martínez',
          email: 'ana@example.com',
          avatar:
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
        },
        createdAt: new Date('2024-01-16T09:15:00'),
        updatedAt: new Date('2024-01-16T09:15:00'),
        status: 'approved',
        parentId: null,
        likes: 15,
        dislikes: 0,
        isLikedByUser: false,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.3',
          userAgent: 'Mozilla/5.0...',
          isEdited: false,
        },
      },
      {
        id: '4',
        postId: this.postId,
        content:
          'Me gustaría sugerir agregar información sobre las mejores prácticas de performance.',
        author: {
          name: 'Luis Chen',
          email: 'luis@example.com',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
        },
        createdAt: new Date('2024-01-16T16:20:00'),
        updatedAt: new Date('2024-01-16T16:20:00'),
        status: 'pending',
        parentId: null,
        likes: 3,
        dislikes: 1,
        isLikedByUser: false,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.4',
          userAgent: 'Mozilla/5.0...',
          isEdited: false,
        },
      },
      {
        id: '5',
        postId: this.postId,
        content:
          '¡Excelente sugerencia Luis! También pienso que sería muy valioso.',
        author: {
          name: 'Diana Torres',
          email: 'diana@example.com',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face',
        },
        createdAt: new Date('2024-01-17T11:10:00'),
        updatedAt: new Date('2024-01-17T11:10:00'),
        status: 'approved',
        parentId: '4',
        likes: 5,
        dislikes: 0,
        isLikedByUser: false,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.5',
          userAgent: 'Mozilla/5.0...',
          isEdited: false,
        },
      },
    ];

    return baseComments;
  }

  /**
   * Construye el árbol jerárquico de comentarios
   */
  private buildCommentTree(comments: BlogComment[]): CommentTree[] {
    const commentMap = new Map<string, CommentTree>();
    const rootComments: CommentTree[] = [];

    // Primero, crear todos los nodos del árbol
    comments.forEach((comment) => {
      const treeNode: CommentTree = {
        ...comment,
        replies: [],
        level: 0,
        isExpanded: true,
      };
      commentMap.set(comment.id, treeNode);
    });

    // Luego, construir la jerarquía
    comments.forEach((comment) => {
      const treeNode = commentMap.get(comment.id)!;

      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId)!;
        treeNode.level = Math.min(parent.level + 1, this.maxDepth);
        parent.replies.push(treeNode);
      } else {
        rootComments.push(treeNode);
      }
    });

    // Ordenar comentarios según la opción seleccionada
    return this.sortComments(rootComments);
  }

  /**
   * Ordena los comentarios según el criterio seleccionado
   */
  private sortComments(comments: CommentTree[]): CommentTree[] {
    const sortBy = this.sortBy();

    const sortedComments = [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'popular':
          return b.likes - b.dislikes - (a.likes - a.dislikes);
        default:
          return 0;
      }
    });

    // Recursivamente ordenar las respuestas
    sortedComments.forEach((comment) => {
      if (comment.replies.length > 0) {
        comment.replies = this.sortComments(comment.replies);
      }
    });

    return sortedComments;
  }

  /**
   * Envía un nuevo comentario
   */
  onSubmitComment(): void {
    if (this.commentForm.invalid || this.submitting()) {
      this.markFormGroupTouched();
      return;
    }

    this._submitting.set(true);
    this._error.set(null);

    const formValue = this.commentForm.value;
    const formState = this.formState();

    const newCommentData: CreateCommentData = {
      postId: this.postId,
      content: formValue.content,
      parentId: formState.parentId,
      author: {
        name: formValue.authorName,
        email: formValue.authorEmail,
        website: formValue.authorWebsite || undefined,
      },
      isAnonymous: formValue.isAnonymous,
    };

    // Simular envío
    setTimeout(() => {
      const newComment: BlogComment = {
        id: Date.now().toString(),
        ...newCommentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending', // Los nuevos comentarios necesitan moderación
        likes: 0,
        dislikes: 0,
        isLikedByUser: false,
        isDislikedByUser: false,
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: navigator.userAgent,
          isEdited: false,
        },
      };

      // Agregar al array de comentarios
      this._comments.update((comments) => [...comments, newComment]);

      // Emitir evento
      this.commentSubmitted.emit(newCommentData);

      // Resetear formulario
      this.resetCommentForm();
      this._submitting.set(false);

      // Scroll al comentario nuevo si está en el navegador
      if (this.isBrowser) {
        setTimeout(() => this.scrollToComment(newComment.id), 100);
      }
    }, 1000);
  }

  /**
   * Marca todos los campos del formulario como touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.commentForm.controls).forEach((key) => {
      this.commentForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Resetea el formulario de comentarios
   */
  private resetCommentForm(): void {
    this.commentForm.reset();
    this._formState.set({
      isVisible: false,
      parentId: null,
      isEditing: false,
      editingCommentId: null,
    });
  }

  /**
   * Maneja el like/unlike de un comentario
   */
  onToggleLike(comment: BlogComment): void {
    const newLikedState = !comment.isLikedByUser;

    // Si ya había dislike, removerlo
    if (comment.isDislikedByUser) {
      comment.isDislikedByUser = false;
      comment.dislikes = Math.max(0, comment.dislikes - 1);
    }

    // Toggle del like
    comment.isLikedByUser = newLikedState;
    comment.likes += newLikedState ? 1 : -1;

    // Emitir evento
    this.commentLiked.emit({
      commentId: comment.id,
      liked: newLikedState,
    });

    // Actualizar el array para triggear change detection
    this._comments.update((comments) => [...comments]);
  }

  /**
   * Maneja el dislike/undislike de un comentario
   */
  onToggleDislike(comment: BlogComment): void {
    const newDislikedState = !comment.isDislikedByUser;

    // Si ya había like, removerlo
    if (comment.isLikedByUser) {
      comment.isLikedByUser = false;
      comment.likes = Math.max(0, comment.likes - 1);
    }

    // Toggle del dislike
    comment.isDislikedByUser = newDislikedState;
    comment.dislikes += newDislikedState ? 1 : -1;

    // Actualizar el array
    this._comments.update((comments) => [...comments]);
  }

  /**
   * Inicia el formulario de respuesta
   */
  onReplyToComment(comment: BlogComment): void {
    this._formState.set({
      isVisible: true,
      parentId: comment.id,
      isEditing: false,
      editingCommentId: null,
    });

    // Pre-llenar el nombre si está disponible en localStorage
    if (this.isBrowser) {
      const savedName = localStorage.getItem('blog_comment_author_name');
      const savedEmail = localStorage.getItem('blog_comment_author_email');

      if (savedName) this.commentForm.patchValue({ authorName: savedName });
      if (savedEmail) this.commentForm.patchValue({ authorEmail: savedEmail });
    }
  }

  /**
   * Cancela el formulario de comentario
   */
  onCancelComment(): void {
    this.resetCommentForm();
  }

  /**
   * Reporta un comentario
   */
  onReportComment(comment: BlogComment): void {
    this.commentReported.emit(comment.id);
  }

  /**
   * Cambia el criterio de ordenamiento
   */
  onChangeSortBy(sortBy: 'newest' | 'oldest' | 'popular'): void {
    this._sortBy.set(sortBy);
  }

  /**
   * Toggle de expansión/colapso de comentario
   */
  onToggleExpand(comment: CommentTree): void {
    comment.isExpanded = !comment.isExpanded;
    this._comments.update((comments) => [...comments]); // Trigger change detection
  }

  /**
   * Scroll automático a un comentario específico
   */
  private scrollToComment(commentId: string): void {
    if (!this.isBrowser) return;

    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Highlight temporal
      element.classList.add('comment-highlight');
      setTimeout(() => {
        element.classList.remove('comment-highlight');
      }, 3000);
    }
  }

  /**
   * Carga más comentarios (paginación)
   */
  onLoadMore(): void {
    if (this.canLoadMore()) {
      this._currentPage.update((page) => page + 1);
      // En una implementación real, aquí cargarías más comentarios del servidor
    }
  }

  /**
   * Verifica si el formulario tiene errores en un campo específico
   */
  hasError(fieldName: string): boolean {
    const field = this.commentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(fieldName: string): string {
    const field = this.commentForm.get(fieldName);

    if (field?.errors?.['required']) {
      return `${fieldName} es requerido`;
    }
    if (field?.errors?.['minlength']) {
      return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field?.errors?.['maxlength']) {
      return `${fieldName} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    if (field?.errors?.['email']) {
      return 'Ingresa un email válido';
    }
    if (field?.errors?.['pattern']) {
      return 'URL debe comenzar con http:// o https://';
    }

    return '';
  }

  /**
   * TrackBy function para ngFor optimization
   */
  trackByCommentId(index: number, comment: CommentTree): string {
    return comment.id;
  }
}
