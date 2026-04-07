"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, ClipboardList, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { ObraForm } from "@/components/dashboard/bim/obra-form";
import { certificacionesApi, contratistasApi, obrasApi, presupuestosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { contratistaTipoLabels, formatCurrency, formatDateLabel, getUserDisplayName, nativeSelectClassName, obraEstadoClasses, obraEstadoLabels } from "@/lib/bim";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AsignacionContratistaObra, Obra } from "@/types/bim";

type AssignFormState = {
  contratista_id: string;
  rol: string;
  fecha_inicio: string;
  fecha_fin: string;
};

const initialAssignState: AssignFormState = {
  contratista_id: "",
  rol: "",
  fecha_inicio: "",
  fecha_fin: "",
};

export default function ObraDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const obraId = params?.id;
  const [assignForm, setAssignForm] = useState<AssignFormState>(initialAssignState);

  const obraQuery = useQuery({
    queryKey: ["obra", obraId],
    queryFn: () => obrasApi.getById(obraId!).then((response) => response.data),
    enabled: Boolean(obraId),
  });

  const asignacionesQuery = useQuery({
    queryKey: ["obra-contratistas", obraId],
    queryFn: () => contratistasApi.getByObra(obraId!).then((response) => response.data),
    enabled: Boolean(obraId),
  });

  const contratistasQuery = useQuery({
    queryKey: ["contratistas-disponibles"],
    queryFn: () => contratistasApi.getAll().then((response) => response.data),
  });

  const presupuestosQuery = useQuery({
    queryKey: ["presupuestos-obra", obraId],
    queryFn: () => presupuestosApi.getByObra(obraId!).then((response) => response.data),
    enabled: Boolean(obraId),
  });

  const certificacionesQuery = useQuery({
    queryKey: ["certificaciones-obra", obraId],
    queryFn: () => certificacionesApi.getByObra(obraId!).then((response) => response.data),
    enabled: Boolean(obraId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Obra>) => obrasApi.update(obraId!, payload),
    onSuccess: () => {
      toast.success("Obra actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: ["obra", obraId] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo actualizar la obra"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => obrasApi.delete(obraId!),
    onSuccess: () => {
      toast.success("Obra eliminada");
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      router.push("/dashboard/obras");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo eliminar la obra"));
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: AssignFormState) =>
      contratistasApi.assignToObra(obraId!, {
        contratista_id: payload.contratista_id,
        rol: payload.rol || undefined,
        fecha_inicio: payload.fecha_inicio || undefined,
        fecha_fin: payload.fecha_fin || undefined,
      }),
    onSuccess: () => {
      toast.success("Contratista asignado a la obra");
      setAssignForm(initialAssignState);
      queryClient.invalidateQueries({ queryKey: ["obra-contratistas", obraId] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo asignar el contratista"));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (contratistaId: string) =>
      contratistasApi.unassignFromObra(obraId!, contratistaId),
    onSuccess: () => {
      toast.success("Contratista retirado de la obra");
      queryClient.invalidateQueries({ queryKey: ["obra-contratistas", obraId] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo quitar el contratista"));
    },
  });

  const obra = obraQuery.data;
  const asignaciones = asignacionesQuery.data ?? [];
  const contratistasDisponibles = (contratistasQuery.data ?? []).filter(
    (contratista) => !asignaciones.some((item) => item.contratista_id === contratista.id),
  );
  const presupuestos = presupuestosQuery.data ?? [];
  const certificaciones = certificacionesQuery.data ?? [];

  if (obraQuery.isLoading) {
    return <div className="animate-pulse h-40 rounded-lg bg-zinc-100" />;
  }

  if (obraQuery.isError || !obra) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/obras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <p className="text-sm text-red-500">No se pudo cargar la obra solicitada.</p>
      </div>
    );
  }

  function handleDelete() {
    if (!obra) {
      return;
    }

    if (!window.confirm(`¿Eliminar la obra ${obra.nombre}?`)) {
      return;
    }

    deleteMutation.mutate();
  }

  function handleAssignSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!assignForm.contratista_id) {
      toast.error("Selecciona un contratista antes de asignarlo");
      return;
    }

    assignMutation.mutate(assignForm);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Obras", href: "/dashboard/obras" }, { label: obra.nombre }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/dashboard/obras">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{obra.nombre}</h1>
              <Badge className={`border-0 ${obraEstadoClasses[obra.estado]}`}>
                {obraEstadoLabels[obra.estado]}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500">
              {obra.codigo} · Responsable: {getUserDisplayName(obra.responsable)}
            </p>
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar obra
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar obra</CardTitle>
          </CardHeader>
          <CardContent>
            <ObraForm
              mode="edit"
              initialData={obra}
              currentUser={currentUser}
              isSubmitting={updateMutation.isPending}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync(values);
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Cliente</p>
                <p className="font-medium text-zinc-900">{obra.cliente}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Fechas</p>
                <p>Inicio: {formatDateLabel(obra.fecha_inicio)}</p>
                <p>Fin estimada: {formatDateLabel(obra.fecha_fin_estimada)}</p>
                <p>Fin real: {formatDateLabel(obra.fecha_fin_real)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Presupuesto base</p>
                <p className="font-medium text-zinc-900">{formatCurrency(obra.presupuesto_base, obra.moneda)}</p>
              </div>
              {obra.ubicacion && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Ubicación</p>
                  <p>{obra.ubicacion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <BriefcaseBusiness className="w-4 h-4" />
                Contratistas asignados
              </CardTitle>
              <Badge variant="outline">{asignaciones.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAssignSubmit} className="grid gap-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <Label htmlFor="contratista_id">Contratista</Label>
                  <select
                    id="contratista_id"
                    className={nativeSelectClassName}
                    value={assignForm.contratista_id}
                    onChange={(event) =>
                      setAssignForm((current) => ({ ...current, contratista_id: event.target.value }))
                    }
                  >
                    <option value="">Selecciona un contratista</option>
                    {contratistasDisponibles.map((contratista) => (
                      <option key={contratista.id} value={contratista.id}>
                        {contratista.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rol">Rol en obra</Label>
                  <Input
                    id="rol"
                    value={assignForm.rol}
                    onChange={(event) =>
                      setAssignForm((current) => ({ ...current, rol: event.target.value }))
                    }
                    placeholder="Instalaciones, estructura, acabados..."
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="fecha_inicio_asignacion">Inicio</Label>
                    <Input
                      id="fecha_inicio_asignacion"
                      type="date"
                      value={assignForm.fecha_inicio}
                      onChange={(event) =>
                        setAssignForm((current) => ({ ...current, fecha_inicio: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fecha_fin_asignacion">Fin</Label>
                    <Input
                      id="fecha_fin_asignacion"
                      type="date"
                      value={assignForm.fecha_fin}
                      onChange={(event) =>
                        setAssignForm((current) => ({ ...current, fecha_fin: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={assignMutation.isPending || contratistasDisponibles.length === 0}>
                    {assignMutation.isPending ? "Asignando..." : "Asignar"}
                  </Button>
                </div>
              </form>

              {asignacionesQuery.isLoading && <p className="text-sm text-zinc-500">Cargando contratistas asignados...</p>}
              {!asignacionesQuery.isLoading && asignaciones.length === 0 && (
                <p className="text-sm text-zinc-500">Aún no hay contratistas asignados a esta obra.</p>
              )}

              <div className="space-y-3">
                {asignaciones.map((asignacion: AsignacionContratistaObra) => (
                  <div key={asignacion.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-zinc-900">{asignacion.contratista?.nombre}</p>
                        <p className="text-xs text-zinc-500">
                          {asignacion.contratista?.tipo
                            ? contratistaTipoLabels[asignacion.contratista.tipo]
                            : "Contratista"}
                          {asignacion.rol ? ` · ${asignacion.rol}` : ""}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDateLabel(asignacion.fecha_inicio)} - {formatDateLabel(asignacion.fecha_fin)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!window.confirm("¿Quitar este contratista de la obra?")) {
                            return;
                          }

                          unassignMutation.mutate(asignacion.contratista_id);
                        }}
                        disabled={unassignMutation.isPending}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Presupuestos vinculados
              </CardTitle>
              <Badge variant="outline">{presupuestos.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {presupuestosQuery.isLoading && <p className="text-sm text-zinc-500">Cargando presupuestos...</p>}
              {!presupuestosQuery.isLoading && presupuestos.length === 0 && (
                <p className="text-sm text-zinc-500">No hay presupuestos registrados para esta obra.</p>
              )}
              {presupuestos.map((presupuesto) => (
                <div key={presupuesto.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-zinc-900">{presupuesto.nombre}</p>
                    <Badge variant="outline">v{presupuesto.version}</Badge>
                  </div>
                  <p className="text-zinc-500">{presupuesto.estado} · {formatCurrency(presupuesto.total_presupuesto, presupuesto.moneda)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Certificaciones
              </CardTitle>
              <Badge variant="outline">{certificaciones.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificacionesQuery.isLoading && <p className="text-sm text-zinc-500">Cargando certificaciones...</p>}
              {!certificacionesQuery.isLoading && certificaciones.length === 0 && (
                <p className="text-sm text-zinc-500">No hay certificaciones generadas para esta obra.</p>
              )}
              {certificaciones.map((certificacion) => (
                <div key={certificacion.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-zinc-900">Certificación #{certificacion.numero}</p>
                    <Badge variant="outline">{certificacion.estado}</Badge>
                  </div>
                  <p className="text-zinc-500">
                    {formatDateLabel(certificacion.periodo_desde)} - {formatDateLabel(certificacion.periodo_hasta)}
                  </p>
                  <p className="text-zinc-500">
                    Actual: {formatCurrency(certificacion.total_cert_actual, obra.moneda)} · Avance: {certificacion.porcentaje_avance}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
