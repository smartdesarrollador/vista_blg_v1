export interface Banner {
  id: number;
  titulo: string;
  descripcion: string | null;
  imagen: string;
  texto_boton: string;
  enlace_boton: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}
