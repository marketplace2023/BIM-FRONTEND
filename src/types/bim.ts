export type ObraEstado =
  | "planificacion"
  | "ejecucion"
  | "finalizada"
  | "suspendida";

export type ContratistaTipo =
  | "empresa"
  | "persona_natural"
  | "subcontratista";

export type ContratistaEstado = "activo" | "inactivo" | "suspendido";

export type PresupuestoEstado =
  | "borrador"
  | "aprobado"
  | "revisado"
  | "cerrado";

export type CertificacionEstado =
  | "borrador"
  | "revisada"
  | "aprobada"
  | "facturada";

export interface BimUserRef {
  id: string;
  username?: string | null;
  email?: string | null;
}

export interface Obra {
  id: string;
  codigo: string;
  nombre: string;
  cliente: string;
  ubicacion?: string | null;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  fecha_fin_real?: string | null;
  estado: ObraEstado;
  moneda: string;
  presupuesto_base: string;
  descripcion?: string | null;
  meta_json?: Record<string, unknown> | null;
  responsable_id: string;
  responsable?: BimUserRef;
  created_by: string;
  creator?: BimUserRef;
  created_at: string;
  updated_at: string;
}

export interface Contratista {
  id: string;
  nombre: string;
  nombre_legal?: string | null;
  rut_nif?: string | null;
  tipo: ContratistaTipo;
  contacto_nombre?: string | null;
  contacto_email?: string | null;
  contacto_tel?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  estado: ContratistaEstado;
  created_at: string;
  updated_at: string;
}

export interface AsignacionContratistaObra {
  id: string;
  obra_id: string;
  obra?: Obra;
  contratista_id: string;
  contratista?: Contratista;
  rol?: string | null;
  monto_contrato?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado: "vigente" | "finalizado" | "rescindido";
  created_at: string;
}

export interface Presupuesto {
  id: string;
  obra_id: string;
  obra?: Obra;
  tipo: "obra" | "orientativo";
  version: number;
  nombre: string;
  descripcion?: string | null;
  estado: PresupuestoEstado;
  moneda: string;
  total_presupuesto: string;
  gastos_indirectos_pct: string;
  beneficio_pct: string;
  iva_pct: string;
  created_by: string;
  creator?: BimUserRef;
  aprobado_por?: string | null;
  aprobador?: BimUserRef | null;
  fecha_aprobacion?: string | null;
  capitulos?: Capitulo[];
  created_at: string;
  updated_at: string;
}

export interface Capitulo {
  id: string;
  presupuesto_id: string;
  codigo: string;
  nombre: string;
  orden: number;
  parent_id?: string | null;
  partidas?: Partida[];
  created_at: string;
  updated_at: string;
}

export interface Partida {
  id: string;
  capitulo_id: string;
  precio_unitario_id?: string | null;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: string;
  precio_unitario: string;
  importe_total: string;
  observaciones?: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Recurso {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  tipo: "mano_obra" | "material" | "equipo" | "subcontrato";
  precio: string;
  vigencia: string;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface PrecioUnitario {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  categoria?: string | null;
  precio_base: string;
  rendimiento: string;
  vigencia: string;
  activo: number;
  descomposicion?: ApuDescomposicion[];
  created_at: string;
  updated_at: string;
}

export interface ApuDescomposicion {
  id: string;
  precio_unitario_id: string;
  recurso_id: string;
  recurso?: Recurso;
  tipo: "mano_obra" | "material" | "equipo" | "subcontrato";
  cantidad: string;
  precio_recurso: string;
  importe_total: string;
  orden: number;
}

export interface Certificacion {
  id: string;
  obra_id: string;
  obra?: Obra;
  presupuesto_id: string;
  presupuesto?: Presupuesto;
  numero: number;
  periodo_desde: string;
  periodo_hasta: string;
  estado: CertificacionEstado;
  total_cert_anterior: string;
  total_cert_actual: string;
  total_cert_acumulado: string;
  porcentaje_avance: string;
  observaciones?: string | null;
  aprobado_por?: string | null;
  aprobador?: BimUserRef | null;
  fecha_aprobacion?: string | null;
  lineas?: LineaCertificacion[];
  created_by: string;
  creator?: BimUserRef;
  created_at: string;
  updated_at: string;
}

export interface LineaCertificacion {
  id: string;
  certificacion_id: string;
  partida_id: string;
  partida?: Partida;
  cantidad_presupuesto: string;
  cantidad_anterior: string;
  cantidad_actual: string;
  cantidad_acumulada: string;
  precio_unitario: string;
  importe_anterior: string;
  importe_actual: string;
  importe_acumulado: string;
  porcentaje: string;
}
