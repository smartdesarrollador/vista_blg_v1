import { Routes } from '@angular/router';
import { InicioComponent } from './paginas/vista/inicio/inicio.component';
import { VistaComponent } from './paginas/vista/vista.component';
import { PageNotFoundComponent } from './paginas/page-not-found/page-not-found.component';
import { AboutComponent } from './paginas/vista/about/about.component';
import { CuentaComponent } from './paginas/vista/cuenta/cuenta.component';
import { authGuard } from './core/auth/guards/auth.guard';
export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./paginas/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Iniciar sesión',
      },
      {
        path: 'register',
        //canActivate: [authGuard],
        loadComponent: () =>
          import('./paginas/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Registrarse',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import(
            './paginas/auth/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
        title: 'Recuperar contraseña',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./paginas/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
        title: 'Restablecer contraseña',
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      /* {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      }, */
    ],
  },
  {
    path: '',
    component: VistaComponent,
    children: [
      {
        path: '',
        component: InicioComponent,
      },
      {
        path: 'about',
        component: AboutComponent,
      },
      {
        path: 'cuenta',
        canActivate: [authGuard],
        component: CuentaComponent,
      },
      // Blog Routes with Lazy Loading
      {
        path: 'blog',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./paginas/blog/blog-list/blog-list.component').then(
                (m) => m.BlogListComponent
              ),
            title: 'Blog - Últimos Artículos',
            data: {
              description:
                'Descubre nuestros últimos artículos sobre tecnología, desarrollo y diseño.',
              keywords: 'blog, artículos, tecnología, desarrollo, programación',
            },
          },
          {
            path: 'search',
            loadComponent: () =>
              import('./paginas/blog/blog-search/blog-search.component').then(
                (m) => m.BlogSearchComponent
              ),
            title: 'Buscar en el Blog',
            data: {
              description: 'Busca artículos específicos en nuestro blog.',
              keywords: 'buscar, blog, artículos, posts',
            },
          },
          {
            path: 'categoria/:slug',
            loadComponent: () =>
              import(
                './paginas/blog/blog-category/blog-category.component'
              ).then((m) => m.BlogCategoryComponent),
            title: 'Categoría',
            data: {
              description: 'Artículos organizados por categoría.',
              keywords: 'categoría, blog, artículos',
            },
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./paginas/blog/blog-detail/blog-detail.component').then(
                (m) => m.BlogDetailComponent
              ),
            title: 'Artículo',
            data: {
              description: 'Lee nuestro artículo completo.',
              keywords: 'artículo, blog, post',
            },
          },
        ],
      },
      {
        path: '**',
        component: PageNotFoundComponent,
      },
    ],
  },
];
