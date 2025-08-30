import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Banner } from '../models/banner.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly apiUrl = `${environment.apiUrl}/banners`;
  private http = inject(HttpClient);

  /**
   * Obtiene todos los banners activos y ordenados
   * @returns Observable<Banner[]> Lista de banners activos y ordenados
   */
  getBanners(): Observable<Banner[]> {
    return this.http.get<{ data: Banner[] }>(this.apiUrl).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error al obtener banners:', error);
        return throwError(
          () =>
            new Error(
              'Error al cargar los banners. Por favor, intente de nuevo más tarde.'
            )
        );
      })
    );
  }

  /**
   * Obtiene un banner específico por su ID
   * @param id ID del banner
   * @returns Observable<Banner> Banner específico
   */
  getBanner(id: number): Observable<Banner> {
    return this.http.get<{ data: Banner }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error(`Error al obtener el banner con ID ${id}:`, error);
        return throwError(
          () =>
            new Error(
              'Error al cargar el banner. Por favor, intente de nuevo más tarde.'
            )
        );
      })
    );
  }
}
