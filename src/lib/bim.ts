import type {
  Capitulo,
  Partida,
  PresupuestoEstado,
  CertificacionEstado,
  ContratistaEstado,
  ContratistaTipo,
  ObraEstado,
} from "@/types/bim";

export const nativeSelectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const obraEstadoOptions = [
  "planificacion",
  "ejecucion",
  "finalizada",
  "suspendida",
] as const satisfies readonly ObraEstado[];

export const obraEstadoLabels: Record<ObraEstado, string> = {
  planificacion: "Planificación",
  ejecucion: "En ejecución",
  finalizada: "Finalizada",
  suspendida: "Suspendida",
};

export const obraEstadoClasses: Record<ObraEstado, string> = {
  planificacion: "bg-yellow-100 text-yellow-700",
  ejecucion: "bg-green-100 text-green-700",
  finalizada: "bg-blue-100 text-blue-700",
  suspendida: "bg-orange-100 text-orange-700",
};

export const contratistaTipoOptions = [
  "empresa",
  "persona_natural",
  "subcontratista",
] as const satisfies readonly ContratistaTipo[];

export const contratistaTipoLabels: Record<ContratistaTipo, string> = {
  empresa: "Empresa",
  persona_natural: "Persona natural",
  subcontratista: "Subcontratista",
};

export const contratistaEstadoLabels: Record<ContratistaEstado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  suspendido: "Suspendido",
};

export const contratistaEstadoClasses: Record<ContratistaEstado, string> = {
  activo: "bg-green-100 text-green-700",
  inactivo: "bg-zinc-100 text-zinc-600",
  suspendido: "bg-red-100 text-red-700",
};

export const presupuestoEstadoClasses: Record<PresupuestoEstado, string> = {
  borrador: "bg-zinc-100 text-zinc-700",
  revisado: "bg-amber-100 text-amber-700",
  aprobado: "bg-green-100 text-green-700",
  cerrado: "bg-blue-100 text-blue-700",
};

export const certificacionEstadoClasses: Record<CertificacionEstado, string> = {
  borrador: "bg-zinc-100 text-zinc-700",
  revisada: "bg-amber-100 text-amber-700",
  aprobada: "bg-green-100 text-green-700",
  facturada: "bg-blue-100 text-blue-700",
};

export function getUserDisplayName(user?: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
} | null) {
  return user?.name || user?.username || user?.email || "Usuario";
}

export function formatDateInputValue(value?: string | null) {
  if (!value) return "";

  const raw = value.slice(0, 10);
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toISOString().slice(0, 10);
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-ES");
}

export function formatCurrency(value?: string | number | null, currency = "USD") {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "0");

  if (Number.isNaN(parsed)) {
    return `${currency} 0.00`;
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(parsed);
}

export function parseNumberInput(value?: string | null, fallback = 0) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function flattenCapituloPartidas(capitulos?: Capitulo[]) {
  return (capitulos ?? []).flatMap((capitulo) =>
    (capitulo.partidas ?? []).map((partida) => ({ capitulo, partida })),
  );
}

export function getPartidaDisplayName(partida: Partida) {
  return `${partida.codigo} · ${partida.descripcion}`;
}
