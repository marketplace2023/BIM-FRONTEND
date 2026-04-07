"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, ClipboardList, ReceiptText, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { certificacionesApi, obrasApi, presupuestosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { certificacionEstadoClasses, flattenCapituloPartidas, formatCurrency, formatDateLabel, getPartidaDisplayName, nativeSelectClassName, parseNumberInput } from "@/lib/bim";
import type { Certificacion, Presupuesto } from "@/types/bim";

type LineInput = {
  cantidad_anterior: string;
  cantidad_actual: string;
};

export default function CertificacionesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<string | null>(null);
  const [periodoDesde, setPeriodoDesde] = useState("");
  const [periodoHasta, setPeriodoHasta] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lineInputs, setLineInputs] = useState<Record<string, LineInput>>({});
  const [query, setQuery] = useState("");

  const obrasQuery = useQuery({
    queryKey: ["obras-selector"],
    queryFn: () => obrasApi.getAll().then((response) => response.data),
  });

  const obras = obrasQuery.data ?? [];
  const effectiveSelectedObraId =
    selectedObraId && obras.some((obra) => obra.id === selectedObraId)
      ? selectedObraId
      : obras[0]?.id ?? "";

  const presupuestosQuery = useQuery({
    queryKey: ["presupuestos", effectiveSelectedObraId],
    queryFn: () => presupuestosApi.getByObra(effectiveSelectedObraId).then((response) => response.data),
    enabled: Boolean(effectiveSelectedObraId),
  });

  const presupuestos = presupuestosQuery.data ?? [];
  const effectiveSelectedPresupuestoId =
    selectedPresupuestoId && presupuestos.some((item) => item.id === selectedPresupuestoId)
      ? selectedPresupuestoId
      : presupuestos[0]?.id ?? "";

  const presupuestoTreeQuery = useQuery({
    queryKey: ["presupuesto-tree", effectiveSelectedPresupuestoId],
    queryFn: () => presupuestosApi.getTree(effectiveSelectedPresupuestoId).then((response) => response.data),
    enabled: Boolean(effectiveSelectedPresupuestoId),
  });

  const certificacionesQuery = useQuery({
    queryKey: ["certificaciones", effectiveSelectedObraId],
    queryFn: () => certificacionesApi.getByObra(effectiveSelectedObraId).then((response) => response.data),
    enabled: Boolean(effectiveSelectedObraId),
  });

  const partidasDisponibles = useMemo(
    () => flattenCapituloPartidas(presupuestoTreeQuery.data?.capitulos),
    [presupuestoTreeQuery.data?.capitulos],
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const lineas = partidasDisponibles
        .map(({ partida }) => {
          const values = lineInputs[partida.id] ?? { cantidad_actual: "0", cantidad_anterior: "0" };
          const cantidadActual = parseNumberInput(values.cantidad_actual, 0);
          const cantidadAnterior = parseNumberInput(values.cantidad_anterior, 0);

          if (cantidadActual <= 0 && cantidadAnterior <= 0) {
            return null;
          }

          return {
            partida_id: partida.id,
            cantidad_presupuesto: partida.cantidad,
            cantidad_anterior: values.cantidad_anterior || "0",
            cantidad_actual: values.cantidad_actual || "0",
            precio_unitario: partida.precio_unitario,
          };
        })
        .filter(
          (
            linea,
          ): linea is {
            partida_id: string;
            cantidad_presupuesto: string;
            cantidad_anterior: string;
            cantidad_actual: string;
            precio_unitario: string;
          } => Boolean(linea),
        );

      return certificacionesApi.create({
        obra_id: effectiveSelectedObraId,
        presupuesto_id: effectiveSelectedPresupuestoId,
        periodo_desde: periodoDesde,
        periodo_hasta: periodoHasta,
        observaciones: observaciones.trim() || undefined,
        lineas,
      });
    },
    onSuccess: (response) => {
      toast.success("Certificación creada correctamente");
      setPeriodoDesde("");
      setPeriodoHasta("");
      setObservaciones("");
      setLineInputs({});
      queryClient.invalidateQueries({ queryKey: ["certificaciones", effectiveSelectedObraId] });
      router.push(`/dashboard/certificaciones/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo crear la certificación"));
    },
  });

  const certificaciones = certificacionesQuery.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCertificaciones = certificaciones.filter((item) =>
    !normalizedQuery
      ? true
      : [`${item.numero}`, item.estado]
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
  const selectedPresupuesto = presupuestos.find((item) => item.id === effectiveSelectedPresupuestoId);
  const totalActual = certificaciones.reduce(
    (acc, item) => acc + Number.parseFloat(item.total_cert_actual ?? "0"),
    0,
  );

  function canCreate() {
    return Boolean(effectiveSelectedObraId && effectiveSelectedPresupuestoId && periodoDesde && periodoHasta);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Certificaciones"
        description="Registra avance ejecutado por periodo, consolida importes y controla el flujo de aprobación."
        actions={
          <>
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <Input
                className="pl-9"
                placeholder="Buscar por número o estado"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="w-full max-w-xs space-y-1">
              <Label htmlFor="cert-obra-selector">Obra</Label>
              <select
                id="cert-obra-selector"
                className={nativeSelectClassName}
                value={effectiveSelectedObraId}
                onChange={(event) => setSelectedObraId(event.target.value)}
              >
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.codigo} · {obra.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {effectiveSelectedObraId && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Certificaciones" value={String(certificaciones.length)} description="Documentos por obra" icon={ClipboardList} />
          <StatCard title="Aprobadas" value={String(certificaciones.filter((item) => item.estado === "aprobada").length)} description="Listas para facturación" icon={BadgeCheck} />
          <StatCard title="Importe actual" value={formatCurrency(totalActual, selectedPresupuesto?.moneda ?? "USD")} description="Total del periodo visible" icon={ReceiptText} />
          <StatCard title="Partidas trazadas" value={String(partidasDisponibles.length)} description="Base de avance seleccionable" icon={TrendingUp} />
        </div>
      )}

      {effectiveSelectedObraId && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva certificación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cert-presupuesto-selector">Presupuesto base</Label>
                <select
                  id="cert-presupuesto-selector"
                  className={nativeSelectClassName}
                  value={effectiveSelectedPresupuestoId}
                  onChange={(event) => setSelectedPresupuestoId(event.target.value)}
                >
                  {presupuestos.map((presupuesto: Presupuesto) => (
                    <option key={presupuesto.id} value={presupuesto.id}>
                      {presupuesto.nombre} · v{presupuesto.version}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cert-periodo-desde">Periodo desde</Label>
                  <Input id="cert-periodo-desde" type="date" value={periodoDesde} onChange={(event) => setPeriodoDesde(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cert-periodo-hasta">Periodo hasta</Label>
                  <Input id="cert-periodo-hasta" type="date" value={periodoHasta} onChange={(event) => setPeriodoHasta(event.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cert-observaciones">Observaciones</Label>
                <Textarea id="cert-observaciones" value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Resumen del avance certificado" />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-900">Líneas a certificar</p>
                {selectedPresupuesto && (
                  <p className="text-xs text-zinc-500">
                    Presupuesto seleccionado: {selectedPresupuesto.nombre}
                  </p>
                )}
                {partidasDisponibles.length === 0 && (
                  <p className="text-sm text-zinc-500">El presupuesto no tiene partidas cargadas.</p>
                )}
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {partidasDisponibles.map(({ capitulo, partida }) => {
                    const values = lineInputs[partida.id] ?? { cantidad_actual: "0", cantidad_anterior: "0" };

                    return (
                      <div key={partida.id} className="rounded-lg border p-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">{capitulo.nombre}</p>
                        <p className="font-medium text-sm text-zinc-900">{getPartidaDisplayName(partida)}</p>
                        <p className="text-xs text-zinc-500">
                          Presupuesto: {partida.cantidad} {partida.unidad} · PU {formatCurrency(partida.precio_unitario, selectedPresupuesto?.moneda ?? "USD")}
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`anterior-${partida.id}`}>Cantidad anterior</Label>
                            <Input
                              id={`anterior-${partida.id}`}
                              type="number"
                              step="0.0001"
                              value={values.cantidad_anterior}
                              onChange={(event) =>
                                setLineInputs((current) => ({
                                  ...current,
                                  [partida.id]: {
                                    ...values,
                                    cantidad_anterior: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`actual-${partida.id}`}>Cantidad actual</Label>
                            <Input
                              id={`actual-${partida.id}`}
                              type="number"
                              step="0.0001"
                              value={values.cantidad_actual}
                              onChange={(event) =>
                                setLineInputs((current) => ({
                                  ...current,
                                  [partida.id]: {
                                    ...values,
                                    cantidad_actual: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!canCreate() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? "Creando..." : "Crear certificación"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificaciones por obra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificacionesQuery.isLoading && (
                <p className="text-sm text-zinc-500">Cargando certificaciones...</p>
              )}

              {!certificacionesQuery.isLoading && filteredCertificaciones.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                  <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay certificaciones que coincidan con la búsqueda</p>
                </div>
              )}

              {filteredCertificaciones.map((certificacion: Certificacion) => (
                <Link key={certificacion.id} href={`/dashboard/certificaciones/${certificacion.id}`}>
                  <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">Certificación #{certificacion.numero}</p>
                        <p className="text-xs text-zinc-500">
                          {formatDateLabel(certificacion.periodo_desde)} - {formatDateLabel(certificacion.periodo_hasta)}
                        </p>
                      </div>
                      <Badge className={`border-0 ${certificacionEstadoClasses[certificacion.estado]}`}>
                        {certificacion.estado}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-zinc-600">
                      <span>
                        Actual: {formatCurrency(certificacion.total_cert_actual, selectedPresupuesto?.moneda ?? "USD")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        Ver detalle
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
