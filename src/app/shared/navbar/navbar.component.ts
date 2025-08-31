import {
  Component,
  HostListener,
  ElementRef,
  inject,
  OnInit,
  effect,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/models/user.model';
import { ConfiguracionesService } from '../../core/services/configuraciones.service';
import { CategoriaService } from '../../core/services/categoria.service';
import {
  ConfiguracionesTodas,
  RedesSocialesConfig,
} from '../../core/models/configuracion.model';
import { BlogCategory } from '../../core/models/categoria.interface';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  // Propiedades para controlar la visibilidad de los menús
  mobileMenuOpen: boolean = false;
  mobileSubmenuOpen: boolean = false;
  desktopSubmenuOpen: boolean = false;
  userMenuOpen: boolean = false;
  blogSubmenuOpen: boolean = false;
  mobileBlogSubmenuOpen: boolean = false;

  // Servicios
  private authService = inject(AuthService);
  private router = inject(Router);
  private categoriaService = inject(CategoriaService);

  // Usuario actual
  currentUser: User | null = null;

  // Categorías populares del blog
  categoriesPopulares: BlogCategory[] = [];

  // Variables para las configuraciones
  configuraciones: ConfiguracionesTodas | null = null;
  logoUrl: string = '';
  nombreSitio: string = 'Mi Aplicación';
  colorPrimario: string = '#3B82F6'; // Valor por defecto
  colorTexto: string = '#1F2937'; // Valor por defecto
  colorEnlaces: string = '#2563EB'; // Valor por defecto

  // Variable para verificar si estamos en el navegador
  private isBrowser: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private configuracionesService: ConfiguracionesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Verificar si estamos en el navegador
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Usar effect para responder a cambios en el estado de autenticación
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      if (isAuthenticated) {
        this.currentUser = this.authService.currentUser();
      } else {
        this.currentUser = null;
      }
    });
  }

  ngOnInit(): void {
    // Inicializar el usuario actual
    if (this.authService.isAuthenticated()) {
      this.currentUser = this.authService.currentUser();
    }

    // Cargar todas las configuraciones
    this.cargarConfiguraciones();

    // Cargar categorías populares del blog
    this.cargarCategoriasPopulares();
  }

  cargarConfiguraciones(): void {
    this.configuracionesService.getAllConfiguraciones().subscribe({
      next: (configuraciones) => {
        this.configuraciones = configuraciones;

        // Asignar valores de configuración
        this.nombreSitio = configuraciones['nombre_sitio'] || 'Mi Aplicación';
        this.colorPrimario = configuraciones['color_primario'] || '#3B82F6';
        this.colorTexto = configuraciones['color_texto'] || '#1F2937';
        this.colorEnlaces = configuraciones['color_enlaces'] || '#2563EB';

        // Obtener URL del logo
        // this.cargarLogoUrl();

        // Aplicar estilos CSS dinámicamente
        this.aplicarEstilos();
      },
      error: (error) => {
        console.error('Error al cargar las configuraciones:', error);
      },
    });
  }

  // cargarLogoUrl(): void {
  //   if (this.configuraciones && this.configuraciones['logo_principal']) {
  //     this.configuracionesService
  //       .getImagenUrl('logo_principal')
  //       .subscribe((url) => {
  //         this.logoUrl = url;
  //       });
  //   }
  // }

  cargarCategoriasPopulares(): void {
    this.categoriaService.getPopularCategories(5).subscribe({
      next: (categories: BlogCategory[]) => {
        this.categoriesPopulares = categories;
      },
      error: (error: any) => {
        console.error('Error al cargar categorías populares:', error);
      },
    });
  }

  // TrackBy function para optimizar ngFor
  trackByCategoria(index: number, categoria: BlogCategory): string {
    return categoria.id;
  }

  aplicarEstilos(): void {
    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      // Aplicar colores dinámicamente usando variables CSS
      document.documentElement.style.setProperty(
        '--color-primario',
        this.colorPrimario
      );
      document.documentElement.style.setProperty(
        '--color-texto',
        this.colorTexto
      );
      document.documentElement.style.setProperty(
        '--color-enlaces',
        this.colorEnlaces
      );

      // Extraer componentes RGB para usar en rgba()
      const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(
          shorthandRegex,
          (m, r, g, b) => r + r + g + g + b + b
        );

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
              result[3],
              16
            )}`
          : null;
      };

      const primaryRgb = hexToRgb(this.colorPrimario);
      if (primaryRgb) {
        document.documentElement.style.setProperty(
          '--color-primario-rgb',
          primaryRgb
        );
      }
    }
  }

  // Escuchamos clics en toda la página
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      // Verificar si el clic fue dentro del componente
      const clickedInside = this.elementRef.nativeElement.contains(
        event.target
      );

      // Si el clic fue fuera del componente y algún menú está abierto, cerrarlo
      if (!clickedInside) {
        this.desktopSubmenuOpen = false;
        this.userMenuOpen = false;
        this.blogSubmenuOpen = false;
      }
    }
  }

  // Método para alternar la visibilidad del menú móvil
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    // Si cerramos el menú principal, también cerramos cualquier submenú abierto
    if (!this.mobileMenuOpen) {
      this.mobileSubmenuOpen = false;
      this.mobileBlogSubmenuOpen = false;
    }
  }

  // Método para alternar la visibilidad del submenú móvil
  toggleMobileSubmenu(): void {
    this.mobileSubmenuOpen = !this.mobileSubmenuOpen;
  }

  // Método para alternar la visibilidad del submenú del blog móvil
  toggleMobileBlogSubmenu(): void {
    this.mobileBlogSubmenuOpen = !this.mobileBlogSubmenuOpen;
  }

  // Método para alternar la visibilidad del submenú de escritorio
  toggleDesktopSubmenu(event: Event): void {
    event.stopPropagation(); // Evitar que el clic se propague al documento
    this.desktopSubmenuOpen = !this.desktopSubmenuOpen;
    // Cerrar otros menús si están abiertos
    this.userMenuOpen = false;
    this.blogSubmenuOpen = false;
  }

  // Método para alternar la visibilidad del submenú del blog de escritorio
  toggleBlogSubmenu(event: Event): void {
    event.stopPropagation();
    this.blogSubmenuOpen = !this.blogSubmenuOpen;
    // Cerrar otros menús si están abiertos
    this.desktopSubmenuOpen = false;
    this.userMenuOpen = false;
  }

  // Método para alternar la visibilidad del menú de usuario
  toggleUserMenu(event: Event): void {
    event.stopPropagation(); // Evitar que el clic se propague al documento
    this.userMenuOpen = !this.userMenuOpen;
    // Cerrar otros menús si están abiertos
    this.desktopSubmenuOpen = false;
    this.blogSubmenuOpen = false;
  }

  // Método para manejar el cierre de sesión sin peticiones al servidor
  handleLogout(event: Event): void {
    // Evitar la navegación automática del enlace
    event.preventDefault();

    // Solo ejecutar en el navegador
    if (this.isBrowser) {
      // Limpiar localStorage manualmente
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    // Cerrar menús
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;

    // Actualizar estado de autenticación
    this.authService.isAuthenticated.set(false);
    this.authService.currentUser.set(null);

    // Navegar al login
    this.router.navigate(['/auth/login']);
  }

  // Método anterior para cerrar sesión (mantenido por compatibilidad)
  logout(): void {
    // Confiar en la lógica de logout del AuthService que ya maneja todos los casos
    this.authService.logout().subscribe({
      next: () => {
        // El AuthService ya redirige al login después de limpiar los datos
        this.userMenuOpen = false;
      },
      error: (error) => {
        // El AuthService ya maneja los errores, incluyendo el 401
        console.error('Error al cerrar sesión:', error);
        this.userMenuOpen = false;
      },
    });
  }
}
