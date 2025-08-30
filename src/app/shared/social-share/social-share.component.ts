import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: string;
  ariaLabel: string;
}

interface ShareData {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
  via?: string;
}

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-share.component.html',
  styleUrls: ['./social-share.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  // Inputs
  @Input() url: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() image: string = '';
  @Input() hashtags: string[] = [];
  @Input() via: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal';
  @Input() variant: 'default' | 'outline' | 'minimal' | 'floating' = 'default';
  @Input() platforms: string[] = [
    'facebook',
    'twitter',
    'linkedin',
    'whatsapp',
    'telegram',
    'email',
    'copy',
  ];
  @Input() showLabels: boolean = true;
  @Input() showCounts: boolean = false;
  @Input() trackingParams: Record<string, string> = {};

  // Outputs
  @Output() platformShare = new EventEmitter<{
    platform: string;
    data: ShareData;
  }>();
  @Output() copySuccess = new EventEmitter<string>();
  @Output() copyError = new EventEmitter<Error>();
  @Output() nativeShare = new EventEmitter<ShareData>();

  // Estado reactivo
  private readonly _copying = signal<boolean>(false);
  private readonly _shareCount = signal<Record<string, number>>({});
  private readonly _isSupported = signal<boolean>(false);

  readonly copying = this._copying.asReadonly();
  readonly shareCount = this._shareCount.asReadonly();
  readonly isSupported = this._isSupported.asReadonly();

  // Share data computado
  readonly shareData = computed(
    (): ShareData => ({
      url: this.getFinalUrl(),
      title: this.title,
      description: this.description,
      image: this.image,
      hashtags: this.hashtags,
      via: this.via,
    })
  );

  // Plataformas disponibles
  readonly availablePlatforms = computed(() => {
    const data = this.shareData();
    const platformsMap: Record<string, SocialPlatform> = {
      facebook: {
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          data.url
        )}`,
        ariaLabel: 'Compartir en Facebook',
      },
      twitter: {
        name: 'Twitter',
        icon: 'twitter',
        color: '#1DA1F2',
        shareUrl: this.buildTwitterUrl(data),
        ariaLabel: 'Compartir en Twitter',
      },
      linkedin: {
        name: 'LinkedIn',
        icon: 'linkedin',
        color: '#0077B5',
        shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          data.url
        )}`,
        ariaLabel: 'Compartir en LinkedIn',
      },
      whatsapp: {
        name: 'WhatsApp',
        icon: 'whatsapp',
        color: '#25D366',
        shareUrl: `https://wa.me/?text=${encodeURIComponent(
          `${data.title} ${data.url}`
        )}`,
        ariaLabel: 'Compartir en WhatsApp',
      },
      telegram: {
        name: 'Telegram',
        icon: 'telegram',
        color: '#0088CC',
        shareUrl: `https://t.me/share/url?url=${encodeURIComponent(
          data.url
        )}&text=${encodeURIComponent(data.title)}`,
        ariaLabel: 'Compartir en Telegram',
      },
      reddit: {
        name: 'Reddit',
        icon: 'reddit',
        color: '#FF4500',
        shareUrl: `https://reddit.com/submit?url=${encodeURIComponent(
          data.url
        )}&title=${encodeURIComponent(data.title)}`,
        ariaLabel: 'Compartir en Reddit',
      },
      pinterest: {
        name: 'Pinterest',
        icon: 'pinterest',
        color: '#BD081C',
        shareUrl: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
          data.url
        )}&description=${encodeURIComponent(
          data.title
        )}&media=${encodeURIComponent(data.image || '')}`,
        ariaLabel: 'Compartir en Pinterest',
      },
      email: {
        name: 'Email',
        icon: 'email',
        color: '#34495E',
        shareUrl: `mailto:?subject=${encodeURIComponent(
          data.title
        )}&body=${encodeURIComponent(`${data.description}\n\n${data.url}`)}`,
        ariaLabel: 'Compartir por email',
      },
    };

    return this.platforms
      .filter((platform) => platform !== 'copy')
      .map((platform) => platformsMap[platform])
      .filter(Boolean);
  });

  readonly hasCopyOption = computed(() => this.platforms.includes('copy'));
  readonly hasNativeShare = computed(
    () => this.isSupported() && 'share' in navigator
  );

  readonly totalShares = computed(() => {
    const counts = this.shareCount();
    return Object.values(counts).reduce((a, b) => a + b, 0);
  });

  readonly hasShareCounts = computed(
    () => Object.keys(this.shareCount()).length > 0
  );

  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.checkNativeShareSupport();
      this.loadShareCounts();
    }
  }

  /**
   * Verifica si el navegador soporta la API nativa de compartir
   */
  private checkNativeShareSupport(): void {
    this._isSupported.set('share' in navigator && 'canShare' in navigator);
  }

  /**
   * Carga los contadores de compartir (simulado)
   */
  private loadShareCounts(): void {
    if (!this.showCounts) return;

    // Simular contadores de compartir
    setTimeout(() => {
      this._shareCount.set({
        facebook: Math.floor(Math.random() * 1000) + 50,
        twitter: Math.floor(Math.random() * 500) + 25,
        linkedin: Math.floor(Math.random() * 200) + 10,
        whatsapp: Math.floor(Math.random() * 300) + 15,
      });
    }, 1000);
  }

  /**
   * Construye la URL de Twitter con todos los parámetros
   */
  private buildTwitterUrl(data: ShareData): string {
    const params = new URLSearchParams();

    // Texto del tweet (title + hashtags)
    let text = data.title;
    if (data.hashtags && data.hashtags.length > 0) {
      text += ' ' + data.hashtags.map((tag) => `#${tag}`).join(' ');
    }

    params.append('text', text);
    params.append('url', data.url);

    if (data.via) {
      params.append('via', data.via);
    }

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  /**
   * Obtiene la URL final con parámetros de tracking
   */
  private getFinalUrl(): string {
    if (!this.isBrowser) return this.url;

    const url = new URL(this.url || this.document.location.href);

    // Agregar parámetros de tracking
    Object.entries(this.trackingParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  /**
   * Maneja el compartir en una plataforma específica
   */
  onPlatformShare(platform: SocialPlatform): void {
    const data = this.shareData();

    // Emitir evento de tracking
    this.platformShare.emit({
      platform: platform.name.toLowerCase(),
      data,
    });

    if (this.isBrowser) {
      // Abrir ventana de compartir
      const width = 600;
      const height = 400;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      window.open(
        platform.shareUrl,
        'share',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }
  }

  /**
   * Maneja el compartir nativo
   */
  async onNativeShare(): Promise<void> {
    if (!this.isBrowser || !navigator.share) return;

    const data = this.shareData();

    try {
      await navigator.share({
        title: data.title,
        text: data.description,
        url: data.url,
      });

      this.nativeShare.emit(data);
    } catch (error) {
      // Usuario canceló o error en el compartir
      console.log('Share cancelled or failed:', error);
    }
  }

  /**
   * Copia la URL al portapapeles
   */
  async onCopyUrl(): Promise<void> {
    if (!this.isBrowser) return;

    this._copying.set(true);
    const url = this.shareData().url;

    try {
      await navigator.clipboard.writeText(url);
      this.copySuccess.emit(url);

      // Feedback visual temporal
      setTimeout(() => {
        this._copying.set(false);
      }, 2000);
    } catch (error) {
      // Fallback para navegadores sin soporte de clipboard
      this.fallbackCopy(url);
    }
  }

  /**
   * Fallback para copiar sin API de clipboard
   */
  private fallbackCopy(text: string): void {
    try {
      const textArea = this.document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      this.document.body.appendChild(textArea);
      textArea.select();
      this.document.execCommand('copy');
      this.document.body.removeChild(textArea);

      this.copySuccess.emit(text);
      setTimeout(() => {
        this._copying.set(false);
      }, 2000);
    } catch (error) {
      this.copyError.emit(error as Error);
      this._copying.set(false);
    }
  }

  /**
   * Obtiene las clases CSS del contenedor
   */
  getContainerClasses(): string {
    const baseClasses = ['social-share'];

    // Layout
    baseClasses.push(`layout-${this.layout}`);

    // Size
    baseClasses.push(`size-${this.size}`);

    // Variant
    baseClasses.push(`variant-${this.variant}`);

    return baseClasses.join(' ');
  }

  /**
   * Obtiene las clases CSS de un botón de plataforma
   */
  getPlatformClasses(platform: SocialPlatform): string {
    const baseClasses = ['platform-btn'];

    // Plataforma específica
    baseClasses.push(`platform-${platform.name.toLowerCase()}`);

    return baseClasses.join(' ');
  }

  /**
   * Obtiene el ícono SVG para una plataforma
   */
  getPlatformIcon(iconName: string): string {
    const icons: Record<string, string> = {
      facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
      twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`,
      linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
      whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.865 3.488"/></svg>`,
      telegram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
      reddit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
      pinterest: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/></svg>`,
      email: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    };

    return icons[iconName] || '';
  }

  /**
   * TrackBy function para optimización de ngFor
   */
  trackByPlatform(index: number, platform: SocialPlatform): string {
    return platform.name;
  }
}
