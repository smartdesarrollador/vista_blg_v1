import { Injectable, inject, signal, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../../http/api.service';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TokenData,
} from '../../models/auth.model';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private apiService = inject(ApiService);
  private router = inject(Router);
  private isBrowser: boolean;

  // Signals
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Solo inicializamos estos valores si estamos en el navegador
    if (this.isBrowser) {
      this.isAuthenticated.set(this.hasValidToken());
      this.currentUser.set(this.getUserFromStorage());
    }
  }

  login(credentials: LoginCredentials): Observable<boolean> {
    return this.apiService.post<AuthResponse>('auth/login', credentials).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.storeToken(response.data.authorization);

          // Primero intentamos obtener el usuario del token
          const userFromToken = this.getUserFromToken();
          if (userFromToken) {
            this.storeUser(userFromToken);
            this.currentUser.set(userFromToken);
          } else {
            // Si no hay datos en el token, usamos los de la respuesta
            this.storeUser(response.data.user);
            this.currentUser.set(response.data.user);
          }

          this.isAuthenticated.set(true);
        }
      }),
      map((response) => response.status === 'success'),
      catchError(() => of(false))
    );
  }

  register(userData: RegisterData): Observable<boolean> {
    return this.apiService.post<AuthResponse>('auth/register', userData).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.storeToken(response.data.authorization);

          // Primero intentamos obtener el usuario del token
          const userFromToken = this.getUserFromToken();
          if (userFromToken) {
            this.storeUser(userFromToken);
            this.currentUser.set(userFromToken);
          } else {
            // Si no hay datos en el token, usamos los de la respuesta
            this.storeUser(response.data.user);
            this.currentUser.set(response.data.user);
          }

          this.isAuthenticated.set(true);
        }
      }),
      map((response) => response.status === 'success'),
      catchError(() => of(false))
    );
  }

  logout(): Observable<boolean> {
    // Solo si el usuario está autenticado, intentamos logout en la API
    if (this.isAuthenticated()) {
      return this.apiService.post<any>('auth/logout', {}).pipe(
        tap(() => this.clearAuth()),
        map(() => true),
        catchError(() => {
          // Incluso si falla el logout en el servidor, limpiamos localmente
          this.clearAuth();
          return of(true);
        })
      );
    } else {
      // Si no está autenticado, solo limpiamos localmente
      this.clearAuth();
      return of(true);
    }
  }

  refreshToken(): Observable<boolean> {
    return this.apiService.post<AuthResponse>('auth/refresh', {}).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.storeToken(response.data.authorization);
          // No actualizamos el usuario aquí porque no viene en la respuesta del refresh
        }
      }),
      map((response) => response.status === 'success'),
      catchError(() => of(false))
    );
  }

  loadProfile(): Observable<User | null> {
    return this.apiService.get<AuthResponse>('auth/profile').pipe(
      tap((response) => {
        if (response.status === 'success' && response.data.user) {
          this.storeUser(response.data.user);
          this.currentUser.set(response.data.user);
        }
      }),
      map((response) => response.data.user),
      catchError(() => of(null))
    );
  }

  /**
   * Solicitar enlace de recuperación de contraseña
   * @param email Correo electrónico del usuario
   */
  forgotPassword(email: string): Observable<any> {
    return this.apiService.post<any>('auth/forgot-password', { email }).pipe(
      map((response) => response),
      catchError((error) => {
        console.error('Error enviando correo de recuperación:', error);
        throw error;
      })
    );
  }

  /**
   * Validar token de recuperación de contraseña
   * @param token Token de recuperación
   * @param email Correo electrónico del usuario
   */
  validateResetToken(token: string, email: string): Observable<any> {
    return this.apiService
      .post<any>('auth/validate-reset-token', { token, email })
      .pipe(
        map((response) => response),
        catchError((error) => {
          console.error('Error validando token:', error);
          throw error;
        })
      );
  }

  /**
   * Restablecer contraseña con token
   * @param data Datos para restablecer contraseña
   */
  resetPassword(data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Observable<any> {
    return this.apiService.post<any>('auth/reset-password', data).pipe(
      map((response) => response),
      catchError((error) => {
        console.error('Error restableciendo contraseña:', error);
        throw error;
      })
    );
  }

  private clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private storeToken(tokenData: TokenData): void {
    if (this.isBrowser) {
      localStorage.setItem(
        this.TOKEN_KEY,
        JSON.stringify({
          ...tokenData,
          expires_at: new Date().getTime() + tokenData.expires_in * 1000,
        })
      );
    }
  }

  private storeUser(user: User | null): void {
    if (user && this.isBrowser) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;

    try {
      const tokenJson = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenJson) return null;

      const tokenData = JSON.parse(tokenJson);
      return tokenData.access_token;
    } catch (e) {
      return null;
    }
  }

  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;

    try {
      // Intentar primero obtener del token (prioridad)
      const userFromToken = this.getUserFromToken();
      if (userFromToken) {
        return userFromToken;
      }

      // Si no hay datos en el token, intentar obtener del almacenamiento
      const userJson = localStorage.getItem(this.USER_KEY);
      if (!userJson) return null;

      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }

  private hasValidToken(): boolean {
    if (!this.isBrowser) return false;

    try {
      const tokenJson = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenJson) return false;

      const tokenData = JSON.parse(tokenJson);
      // Comprobar si el token ha expirado
      if (tokenData.expires_at && new Date().getTime() > tokenData.expires_at) {
        this.clearAuth();
        return false;
      }
      return true;
    } catch (e) {
      this.clearAuth();
      return false;
    }
  }

  /**
   * Obtiene información del usuario decodificando el token JWT
   */
  getUserFromToken(): User | null {
    if (!this.isBrowser) return null;

    try {
      const token = this.getToken();
      if (!token) return null;

      const decoded: any = jwtDecode(token);

      // Verificar que el token contiene la información del usuario
      if (
        decoded &&
        decoded.id &&
        decoded.name &&
        decoded.email &&
        decoded.rol
      ) {
        return {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          rol: decoded.rol,
          created_at: decoded.created_at || '',
          updated_at: decoded.updated_at || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Error al decodificar el token JWT', error);
      return null;
    }
  }
}
