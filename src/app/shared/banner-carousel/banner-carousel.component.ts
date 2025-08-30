import {
  Component,
  OnInit,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Banner } from '../../core/models/banner.interface';
import { BannerService } from '../../core/services/banner.service';
import { RouterModule } from '@angular/router';

import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes,
} from '@angular/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { environment } from '../../../environments/environment';

// Importar directamente los estilos
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';

// Usar Swiper 9+ con Angular 18
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-banner-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.css'],
  host: {
    ngSkipHydration: 'true',
  },
  animations: [
    trigger('bannerAnimation', [
      transition('* => *', [
        // Animación del título con keyframes para un efecto más elaborado
        query(
          '.slide-title',
          [
            style({ opacity: 0, transform: 'translateY(-30px)' }),
            animate(
              '0.8s ease-out',
              keyframes([
                style({
                  opacity: 0,
                  transform: 'translateY(-30px) scale(0.9)',
                  offset: 0,
                }),
                style({
                  opacity: 0.6,
                  transform: 'translateY(-15px) scale(0.95)',
                  offset: 0.5,
                }),
                style({
                  opacity: 1,
                  transform: 'translateY(0) scale(1)',
                  offset: 1,
                }),
              ])
            ),
          ],
          { optional: true }
        ),
        // Animación de la descripción con efecto de desvanecimiento lateral
        query(
          '.slide-description',
          [
            style({ opacity: 0, transform: 'translateX(-30px)' }),
            animate(
              '0.8s 0.3s ease-out',
              keyframes([
                style({
                  opacity: 0,
                  transform: 'translateX(-30px) skewX(-2deg)',
                  offset: 0,
                }),
                style({
                  opacity: 0.4,
                  transform: 'translateX(-15px) skewX(1deg)',
                  offset: 0.4,
                }),
                style({
                  opacity: 0.8,
                  transform: 'translateX(-5px) skewX(0deg)',
                  offset: 0.7,
                }),
                style({
                  opacity: 1,
                  transform: 'translateX(0) skewX(0deg)',
                  offset: 1,
                }),
              ])
            ),
          ],
          { optional: true }
        ),
        // Animación del botón con efecto rebote
        query(
          '.slide-button',
          [
            style({ opacity: 0, transform: 'scale(0.8)' }),
            animate(
              '0.5s 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              keyframes([
                style({ opacity: 0, transform: 'scale(0.8)', offset: 0 }),
                style({ opacity: 1, transform: 'scale(1.1)', offset: 0.7 }),
                style({ transform: 'scale(1)', offset: 1 }),
              ])
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class BannerCarouselComponent implements OnInit, AfterViewInit {
  @ViewChild('swiperContainer') swiperContainer!: ElementRef;

  private bannerService = inject(BannerService);

  banners = signal<Banner[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeIndex = signal<number>(0);

  ngOnInit(): void {
    this.loadBanners();
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  /**
   * Construye la URL completa para las imágenes
   * @param imagePath Ruta relativa de la imagen
   * @returns URL completa de la imagen
   */
  getImageUrl(imagePath: string): string {
    // Si la ruta ya comienza con http o https, la devolvemos tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Eliminamos la barra inicial si existe para evitar rutas duplicadas
    const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    // Construimos la URL completa usando la URL base del entorno
    return `${environment.urlDominioApi}/${path}`;
  }

  initSwiper(): void {
    // Se ejecutará cuando cambie el contenido de banners
    setTimeout(() => {
      if (this.swiperContainer?.nativeElement) {
        const swiperEl = this.swiperContainer.nativeElement;

        // Configuración del elemento swiper con autoplay mejorado
        Object.assign(swiperEl, {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          effect: 'fade',
          fadeEffect: {
            crossFade: true,
          },
          autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          },
          speed: 1000, // Velocidad de transición entre slides
          pagination: {
            clickable: true,
            dynamicBullets: true,
          },
          navigation: true,
        });

        // Inicializar swiper (usando la forma correcta para Swiper Element)
        // Ya no es necesario llamar a initialize() manualmente
        swiperEl.initialize = true;

        // Evento de cambio de slide
        swiperEl.addEventListener('slidechange', (event: any) => {
          this.activeIndex.set(event.detail[0].activeIndex);
        });
      }
    }, 100);
  }

  loadBanners(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.bannerService.getBanners().subscribe({
      next: (data) => {
        this.banners.set(data);
        this.isLoading.set(false);
        // Inicializar Swiper después de cargar los datos
        setTimeout(() => this.initSwiper(), 100);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar los banners');
        this.isLoading.set(false);
        console.error('Error obteniendo banners:', err);
      },
    });
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }
}
