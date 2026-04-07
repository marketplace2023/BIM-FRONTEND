"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { certificacionesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { certificacionEstadoClasses, formatCurrency, formatDateLabel, nativeSelectClassName } from "@/lib/bim";

export default function CertificacionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const certificacionId = params?.id;
  const [estado, setEstado] = useState<
    "borrador" | "revisada" | "aprobada" | "facturada" | ""
  >("");
  const [observaciones, setObservaciones] = useState<string | null>(null);

  const certificacionQuery = useQuery({
    queryKey: ["certificacion", certificacionId],
    queryFn: () => certificacionesApi.getById(certificacionId!).then((response) => response.data),
    enabled: Boolean(certificacionId),
  });

  const certificacion = certificacionQuery.data;

  const currentEstado = estado || certificacion?.estado || "revisada";
  const currentObservaciones = observaciones ?? certificacion?.observaciones ?? "";

  const changeStatusMutation = useMutation({
    mutationFn: () =>
      certificacionesApi.changeStatus(certificacionId!, {
        estado: currentEstado,
        observaciones: currentObservaciones.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["certificacion", certificacionId] });
      queryClient.invalidateQueries({ queryKey: ["certificaciones"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el estado")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => certificacionesApi.delete(certificacionId!),
    onSuccess: () => {
      toast.success("Certificación eliminada");
      router.push("/dashboard/certificaciones");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la certificación")),
  });

  if (certificacionQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-lg bg-zinc-100" />;
  }

  if (certificacionQuery.isError || !certificacion) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/certificaciones">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <p className="text-sm text-red-500">No se pudo cargar la certificación solicitada.</p>
      </div>
    );
  }

  const nextOptions =
    certificacion.estado === "borrador"
      ? ["revisada"]
      : certificacion.estado === "revisada"
        ? ["borrador", "aprobada"]
        : certificacion.estado === "aprobada"
          ? ["facturada"]
          : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Certificaciones", href: "/dashboard/certificaciones" }, { label: `#${certificacion.numero}` }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/dashboard/certificaciones">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Certificación #{certificacion.numero}</h1>
            <Badge className={`border-0 ${certificacionEstadoClasses[certificacion.estado]}`}>
              {certificacion.estado}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {certificacion.obra?.nombre ?? "Obra"} · {formatDateLabel(certificacion.periodo_desde)} - {formatDateLabel(certificacion.periodo_hasta)}
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (!window.confirm(`¿Eliminar la certificación #${certificacion.numero}?`)) return;
            deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending || certificacion.estado !== "borrador"}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>Total anterior: {formatCurrency(certificacion.total_cert_anterior, certificacion.presupuesto?.moneda ?? "USD")}</p>
              <p>Total actual: {formatCurrency(certificacion.total_cert_actual, certificacion.presupuesto?.moneda ?? "USD")}</p>
              <p>Total acumulado: {formatCurrency(certificacion.total_cert_acumulado, certificacion.presupuesto?.moneda ?? "USD")}</p>
              <p>Avance: {certificacion.porcentaje_avance}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cert-estado">Siguiente estado</Label>
                <select
                  id="cert-estado"
                  className={nativeSelectClassName}
                  value={currentEstado}
                  onChange={(event) =>
                    setEstado(
                      event.target.value as
                        | "borrador"
                        | "revisada"
                        | "aprobada"
                        | "facturada",
                    )
                  }
                  disabled={nextOptions.length === 0}
                >
                  {nextOptions.length === 0 && <option value={currentEstado}>Sin transición disponible</option>}
                  {nextOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cert-obs-update">Observaciones</Label>
                <Textarea id="cert-obs-update" value={currentObservaciones} onChange={(event) => setObservaciones(event.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => changeStatusMutation.mutate()} disabled={changeStatusMutation.isPending || nextOptions.length === 0}>
                  {changeStatusMutation.isPending ? "Actualizando..." : "Guardar estado"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Líneas certificadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(certificacion.lineas ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">Esta certificación no tiene líneas asociadas.</p>
            )}

            {(certificacion.lineas ?? []).map((linea) => (
              <div key={linea.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {linea.partida?.codigo ?? "Partida"} · {linea.partida?.descripcion ?? "Sin descripción"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Presupuesto {linea.cantidad_presupuesto} · Anterior {linea.cantidad_anterior} · Actual {linea.cantidad_actual} · Acumulada {linea.cantidad_acumulada}
                    </p>
                  </div>
                  <Badge variant="outline">{linea.porcentaje}%</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
                  <p>Importe anterior: {formatCurrency(linea.importe_anterior, certificacion.presupuesto?.moneda ?? "USD")}</p>
                  <p>Importe actual: {formatCurrency(linea.importe_actual, certificacion.presupuesto?.moneda ?? "USD")}</p>
                  <p>Importe acumulado: {formatCurrency(linea.importe_acumulado, certificacion.presupuesto?.moneda ?? "USD")}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
