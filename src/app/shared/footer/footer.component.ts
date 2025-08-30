import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfiguracionesService } from '../../core/services/configuraciones.service';
import { BlogService } from '../../core/services/blog.service';
import { CategoriaService } from '../../core/services/categoria.service';
import {
  ConfiguracionesTodas,
  RedesSocialesConfig,
} from '../../core/models/configuracion.model';
import { BlogPost } from '../../core/models/blog.interface';
import { BlogCategory } from '../../core/models/categoria.interface';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  currentYear: number = 0;

  // Variables para configuraciones
  configuraciones: ConfiguracionesTodas | null = null;
  logoUrl: string = '';
  nombreSitio: string = 'Mi Aplicación';

  // Datos de contacto
  direccion: string = 'Av. Principal, Ciudad, País';
  telefono: string = '+1 234 567 890';
  email: string = 'info@miapp.com';

  // Colores
  colorPrimario: string = '#3B82F6';
  colorFondo: string = '#1F2937';
  colorTexto: string = '#F9FAFB';
  colorTextoDim: string = '#9CA3AF';

  // Redes sociales
  redesSociales: RedesSocialesConfig | null = null;

  // Blog data
  postsRecientes: BlogPost[] = [];
  categoriasPopulares: BlogCategory[] = [];

  // Variable para verificar si estamos en el navegador
  private isBrowser: boolean = false;

  constructor(
    private configuracionesService: ConfiguracionesService,
    private blogService: BlogService,
    private categoriaService: CategoriaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Inicializar año actual
    if (this.isBrowser) {
      this.currentYear = new Date().getFullYear();
    } else {
      this.currentYear = 2024; // Valor por defecto para SSR
    }

    // Cargar configuraciones
    this.cargarConfiguraciones();

    // Cargar datos del blog
    this.cargarDatosBlog();
  }

  cargarConfiguraciones(): void {
    this.configuracionesService.getAllConfiguraciones().subscribe({
      next: (configuraciones) => {
        this.configuraciones = configuraciones;

        // Asignar valores de configuración
        this.nombreSitio = configuraciones['nombre_sitio'] || 'Mi Aplicación';

        // Datos de contacto
        this.direccion = configuraciones['direccion'] || this.direccion;
        this.telefono = configuraciones['telefono_contacto'] || this.telefono;
        this.email = configuraciones['email_contacto'] || this.email;

        // Colores
        this.colorPrimario =
          configuraciones['color_primario'] || this.colorPrimario;
        this.colorFondo = configuraciones['color_fondo'] || this.colorFondo;
        this.colorTexto = configuraciones['color_texto'] || this.colorTexto;

        // Redes sociales
        if (configuraciones['redes_sociales']) {
          this.redesSociales = configuraciones[
            'redes_sociales'
          ] as RedesSocialesConfig;
        }

        // Obtener URL del logo
        this.cargarLogoUrl();

        // Aplicar estilos CSS
        this.aplicarEstilos();
      },
      error: (error) => {
        console.error(
          'Error al cargar las configuraciones para el footer:',
          error
        );
      },
    });
  }

  cargarLogoUrl(): void {
    if (this.configuraciones && this.configuraciones['logo_footer']) {
      this.configuracionesService
        .getImagenUrl('logo_footer')
        .subscribe((url) => {
          this.logoUrl = url;
        });
    } else if (this.configuraciones && this.configuraciones['logo_principal']) {
      // Si no hay logo específico para el footer, usar el principal
      this.configuracionesService
        .getImagenUrl('logo_principal')
        .subscribe((url) => {
          this.logoUrl = url;
        });
    }
  }

  aplicarEstilos(): void {
    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      // No es necesario aplicar estilos globales aquí, ya lo hacemos en el navbar
      // Pero podemos agregar estilos específicos del footer si es necesario
    }
  }

  cargarDatosBlog(): void {
    // Cargar posts recientes
    this.blogService.getRecentPosts(3).subscribe({
      next: (posts: BlogPost[]) => {
        this.postsRecientes = posts;
      },
      error: (error: any) => {
        console.error('Error al cargar posts recientes para el footer:', error);
      },
    });

    // Cargar categorías populares
    this.categoriaService.getPopularCategories(4).subscribe({
      next: (categories: BlogCategory[]) => {
        this.categoriasPopulares = categories;
      },
      error: (error: any) => {
        console.error(
          'Error al cargar categorías populares para el footer:',
          error
        );
      },
    });
  }

  // TrackBy function para optimizar ngFor
  trackByPost(index: number, post: BlogPost): string {
    return post.id;
  }

  trackByCategory(index: number, category: BlogCategory): string {
    return category.id;
  }
}
