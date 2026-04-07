"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PrecioUnitarioForm } from "@/components/dashboard/bim/precio-unitario-form";
import { preciosUnitariosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDateLabel, nativeSelectClassName } from "@/lib/bim";
import type { ApuDescomposicion, PrecioUnitario } from "@/types/bim";

type DescomposicionDraft = {
  recurso_id: string;
  tipo: "mano_obra" | "material" | "equipo" | "subcontrato";
  cantidad: string;
  precio_recurso: string;
};

const initialDraft: DescomposicionDraft = {
  recurso_id: "",
  tipo: "material",
  cantidad: "1",
  precio_recurso: "0",
};

export default function PrecioUnitarioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const apuId = params?.id;
  const [draft, setDraft] = useState<DescomposicionDraft>(initialDraft);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [lineDrafts, setLineDrafts] = useState<Record<string, DescomposicionDraft>>({});

  const apuQuery = useQuery({
    queryKey: ["apu", apuId],
    queryFn: () => preciosUnitariosApi.getById(apuId!).then((response) => response.data),
    enabled: Boolean(apuId),
  });

  const recursosQuery = useQuery({
    queryKey: ["apu-recursos"],
    queryFn: () => preciosUnitariosApi.getRecursos().then((response) => response.data),
  });

  const apu = apuQuery.data;
  const recursos = recursosQuery.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<PrecioUnitario>) => preciosUnitariosApi.update(apuId!, payload),
    onSuccess: () => {
      toast.success("APU actualizado");
      queryClient.invalidateQueries({ queryKey: ["apu", apuId] });
      queryClient.invalidateQueries({ queryKey: ["apu-list"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el APU")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => preciosUnitariosApi.delete(apuId!),
    onSuccess: () => {
      toast.success("APU eliminado");
      router.push("/dashboard/precios-unitarios");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el APU")),
  });

  const addMutation = useMutation({
    mutationFn: () => preciosUnitariosApi.addDescomposicion(apuId!, draft),
    onSuccess: () => {
      toast.success("Línea agregada a la descomposición");
      setDraft(initialDraft);
      queryClient.invalidateQueries({ queryKey: ["apu", apuId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo agregar la línea")),
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: string) => preciosUnitariosApi.deleteDescomposicion(lineId),
    onSuccess: () => {
      toast.success("Línea eliminada");
      queryClient.invalidateQueries({ queryKey: ["apu", apuId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la línea")),
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, payload }: { lineId: string; payload: DescomposicionDraft }) =>
      preciosUnitariosApi.updateDescomposicion(lineId, payload),
    onSuccess: () => {
      toast.success("Línea actualizada");
      setEditingLineId(null);
      queryClient.invalidateQueries({ queryKey: ["apu", apuId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la línea")),
  });

  if (apuQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-lg bg-zinc-100" />;
  }

  if (apuQuery.isError || !apu) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/precios-unitarios">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <p className="text-sm text-red-500">No se pudo cargar el APU solicitado.</p>
      </div>
    );
  }

  function handleAddLine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.recurso_id) {
      toast.error("Selecciona un recurso antes de agregar la línea");
      return;
    }

    addMutation.mutate();
  }

  function getLineDraft(linea: ApuDescomposicion) {
    return (
      lineDrafts[linea.id] ?? {
        recurso_id: linea.recurso_id,
        tipo: linea.tipo,
        cantidad: linea.cantidad,
        precio_recurso: linea.precio_recurso,
      }
    );
  }

  function setLineDraft(lineId: string, patch: Partial<DescomposicionDraft>) {
    setLineDrafts((current) => ({
      ...current,
      [lineId]: {
        ...(current[lineId] ?? initialDraft),
        ...patch,
      },
    }));
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "APU", href: "/dashboard/precios-unitarios" }, { label: apu.codigo }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/dashboard/precios-unitarios">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{apu.codigo}</h1>
            <p className="text-sm text-zinc-500">{apu.descripcion}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (!window.confirm(`¿Eliminar el APU ${apu.codigo}?`)) return;
            deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del APU</CardTitle>
            </CardHeader>
            <CardContent>
              <PrecioUnitarioForm
                initialData={apu}
                isSubmitting={updateMutation.isPending}
                submitLabel="Guardar cambios"
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync(values);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>Categoría: {apu.categoria ?? "Sin categoría"}</p>
              <p>Precio base: {formatCurrency(apu.precio_base)}</p>
              <p>Rendimiento: {apu.rendimiento}</p>
              <p>Vigencia: {formatDateLabel(apu.vigencia)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descomposición</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddLine} className="space-y-4 rounded-lg border bg-zinc-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="recurso-id">Recurso</Label>
                  <select
                    id="recurso-id"
                    className={nativeSelectClassName}
                    value={draft.recurso_id}
                    onChange={(event) => {
                      const selected = recursos.find((item) => item.id === event.target.value);
                      setDraft((current) => ({
                        ...current,
                        recurso_id: event.target.value,
                        tipo: (selected?.tipo ?? current.tipo) as DescomposicionDraft["tipo"],
                        precio_recurso: selected?.precio ?? current.precio_recurso,
                      }));
                    }}
                  >
                    <option value="">Selecciona un recurso</option>
                    {recursos.map((recurso) => (
                      <option key={recurso.id} value={recurso.id}>
                        {recurso.codigo} · {recurso.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linea-tipo">Tipo</Label>
                  <select
                    id="linea-tipo"
                    className={nativeSelectClassName}
                    value={draft.tipo}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        tipo: event.target.value as DescomposicionDraft["tipo"],
                      }))
                    }
                  >
                    <option value="mano_obra">Mano de obra</option>
                    <option value="material">Material</option>
                    <option value="equipo">Equipo</option>
                    <option value="subcontrato">Subcontrato</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linea-cantidad">Cantidad</Label>
                  <Input
                    id="linea-cantidad"
                    type="number"
                    step="0.0001"
                    value={draft.cantidad}
                    onChange={(event) => setDraft((current) => ({ ...current, cantidad: event.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="linea-precio">Precio recurso</Label>
                  <Input
                    id="linea-precio"
                    type="number"
                    step="0.0001"
                    value={draft.precio_recurso}
                    onChange={(event) => setDraft((current) => ({ ...current, precio_recurso: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Agregando..." : "Agregar línea"}
                </Button>
              </div>
            </form>

            {(apu.descomposicion ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">Este APU aún no tiene líneas de descomposición.</p>
            )}

            {(apu.descomposicion ?? []).map((linea) => (
              <div key={linea.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {linea.recurso?.codigo ?? "Recurso"} · {linea.recurso?.descripcion ?? "Sin descripción"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {linea.tipo} · Cantidad {linea.cantidad} · Precio {formatCurrency(linea.precio_recurso)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingLineId((current) => (current === linea.id ? null : linea.id));
                        setLineDraft(linea.id, {
                          recurso_id: linea.recurso_id,
                          tipo: linea.tipo,
                          cantidad: linea.cantidad,
                          precio_recurso: linea.precio_recurso,
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm("¿Eliminar esta línea de descomposición?")) return;
                        deleteLineMutation.mutate(linea.id);
                      }}
                      disabled={deleteLineMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700">Importe: {formatCurrency(linea.importe_total)}</p>
                {editingLineId === linea.id && (
                  <div className="mt-4 grid gap-4 rounded-lg border bg-zinc-50 p-4 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <Label>Tipo</Label>
                      <select
                        className={nativeSelectClassName}
                        value={getLineDraft(linea).tipo}
                        onChange={(event) =>
                          setLineDraft(linea.id, {
                            tipo: event.target.value as DescomposicionDraft["tipo"],
                          })
                        }
                      >
                        <option value="mano_obra">Mano de obra</option>
                        <option value="material">Material</option>
                        <option value="equipo">Equipo</option>
                        <option value="subcontrato">Subcontrato</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={getLineDraft(linea).cantidad}
                        onChange={(event) => setLineDraft(linea.id, { cantidad: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Precio recurso</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={getLineDraft(linea).precio_recurso}
                        onChange={(event) => setLineDraft(linea.id, { precio_recurso: event.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingLineId(null)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateLineMutation.mutate({
                            lineId: linea.id,
                            payload: getLineDraft(linea),
                          })
                        }
                        disabled={updateLineMutation.isPending}
                      >
                        Guardar línea
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
