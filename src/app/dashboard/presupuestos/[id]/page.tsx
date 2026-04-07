"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calculator, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PresupuestoForm } from "@/components/dashboard/bim/presupuesto-form";
import { presupuestosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, presupuestoEstadoClasses } from "@/lib/bim";
import type { Capitulo, Partida, Presupuesto } from "@/types/bim";

type PartidaDraft = {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: string;
  precio_unitario: string;
  observaciones: string;
};

type CapituloDraft = {
  codigo: string;
  nombre: string;
  orden: string;
};

const emptyPartidaDraft: PartidaDraft = {
  codigo: "",
  descripcion: "",
  unidad: "",
  cantidad: "1",
  precio_unitario: "0",
  observaciones: "",
};

export default function PresupuestoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const presupuestoId = params?.id;
  const [capituloDraft, setCapituloDraft] = useState({ codigo: "", nombre: "", orden: "0" });
  const [activeCapituloId, setActiveCapituloId] = useState<string | null>(null);
  const [partidaDrafts, setPartidaDrafts] = useState<Record<string, PartidaDraft>>({});
  const [editingCapituloId, setEditingCapituloId] = useState<string | null>(null);
  const [capituloEditDrafts, setCapituloEditDrafts] = useState<Record<string, CapituloDraft>>({});
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);
  const [partidaEditDrafts, setPartidaEditDrafts] = useState<Record<string, PartidaDraft>>({});

  const presupuestoQuery = useQuery({
    queryKey: ["presupuesto", presupuestoId],
    queryFn: () => presupuestosApi.getTree(presupuestoId!).then((response) => response.data),
    enabled: Boolean(presupuestoId),
  });

  const presupuesto = presupuestoQuery.data;
  const capitulos = presupuesto?.capitulos ?? [];
  const totalPartidas = capitulos.reduce(
    (count, capitulo) => count + (capitulo.partidas?.length ?? 0),
    0,
  );

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Presupuesto>) => presupuestosApi.update(presupuestoId!, payload),
    onSuccess: () => {
      toast.success("Presupuesto actualizado");
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el presupuesto")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => presupuestosApi.delete(presupuestoId!),
    onSuccess: () => {
      toast.success("Presupuesto eliminado");
      router.push("/dashboard/presupuestos");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el presupuesto")),
  });

  const approveMutation = useMutation({
    mutationFn: () => presupuestosApi.approve(presupuestoId!),
    onSuccess: () => {
      toast.success("Presupuesto aprobado");
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo aprobar el presupuesto")),
  });

  const recalculateMutation = useMutation({
    mutationFn: () => presupuestosApi.recalculate(presupuestoId!),
    onSuccess: () => {
      toast.success("Total recalculado");
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo recalcular el presupuesto")),
  });

  const createCapituloMutation = useMutation({
    mutationFn: () =>
      presupuestosApi.createCapitulo(presupuestoId!, {
        codigo: capituloDraft.codigo.trim(),
        nombre: capituloDraft.nombre.trim(),
        orden: Number.parseInt(capituloDraft.orden || "0", 10),
      }),
    onSuccess: () => {
      toast.success("Capítulo creado");
      setCapituloDraft({ codigo: "", nombre: "", orden: "0" });
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el capítulo")),
  });

  const deleteCapituloMutation = useMutation({
    mutationFn: (capituloId: string) => presupuestosApi.deleteCapitulo(capituloId),
    onSuccess: () => {
      toast.success("Capítulo eliminado");
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el capítulo")),
  });

  const updateCapituloMutation = useMutation({
    mutationFn: ({ capituloId, payload }: { capituloId: string; payload: CapituloDraft }) =>
      presupuestosApi.updateCapitulo(capituloId, {
        codigo: payload.codigo.trim(),
        nombre: payload.nombre.trim(),
        orden: Number.parseInt(payload.orden || "0", 10),
      }),
    onSuccess: () => {
      toast.success("Capítulo actualizado");
      setEditingCapituloId(null);
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el capítulo")),
  });

  const createPartidaMutation = useMutation({
    mutationFn: ({ capituloId, payload }: { capituloId: string; payload: PartidaDraft }) =>
      presupuestosApi.createPartida(capituloId, {
        codigo: payload.codigo.trim(),
        descripcion: payload.descripcion.trim(),
        unidad: payload.unidad.trim(),
        cantidad: payload.cantidad,
        precio_unitario: payload.precio_unitario,
        observaciones: payload.observaciones.trim() || undefined,
      }),
    onSuccess: (_response, variables) => {
      toast.success("Partida creada");
      setPartidaDrafts((current) => ({
        ...current,
        [variables.capituloId]: { ...emptyPartidaDraft },
      }));
      setActiveCapituloId(null);
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear la partida")),
  });

  const deletePartidaMutation = useMutation({
    mutationFn: (partidaId: string) => presupuestosApi.deletePartida(partidaId),
    onSuccess: () => {
      toast.success("Partida eliminada");
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la partida")),
  });

  const updatePartidaMutation = useMutation({
    mutationFn: ({ partidaId, payload }: { partidaId: string; payload: PartidaDraft }) =>
      presupuestosApi.updatePartida(partidaId, {
        codigo: payload.codigo.trim(),
        descripcion: payload.descripcion.trim(),
        unidad: payload.unidad.trim(),
        cantidad: payload.cantidad,
        precio_unitario: payload.precio_unitario,
        observaciones: payload.observaciones.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Partida actualizada");
      setEditingPartidaId(null);
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la partida")),
  });

  if (presupuestoQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-lg bg-zinc-100" />;
  }

  if (presupuestoQuery.isError || !presupuesto) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/presupuestos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <p className="text-sm text-red-500">No se pudo cargar el presupuesto solicitado.</p>
      </div>
    );
  }

  function getPartidaDraft(capituloId: string) {
    return partidaDrafts[capituloId] ?? emptyPartidaDraft;
  }

  function getCapituloEditDraft(capitulo: Capitulo) {
    return (
      capituloEditDrafts[capitulo.id] ?? {
        codigo: capitulo.codigo,
        nombre: capitulo.nombre,
        orden: String(capitulo.orden),
      }
    );
  }

  function setCapituloEditDraft(capituloId: string, patch: Partial<CapituloDraft>) {
    setCapituloEditDrafts((current) => ({
      ...current,
      [capituloId]: {
        ...(current[capituloId] ?? { codigo: "", nombre: "", orden: "0" }),
        ...patch,
      },
    }));
  }

  function getPartidaEditDraft(partida: Partida) {
    return (
      partidaEditDrafts[partida.id] ?? {
        codigo: partida.codigo,
        descripcion: partida.descripcion,
        unidad: partida.unidad,
        cantidad: partida.cantidad,
        precio_unitario: partida.precio_unitario,
        observaciones: partida.observaciones ?? "",
      }
    );
  }

  function setPartidaEditDraft(partidaId: string, patch: Partial<PartidaDraft>) {
    setPartidaEditDrafts((current) => ({
      ...current,
      [partidaId]: {
        ...(current[partidaId] ?? emptyPartidaDraft),
        ...patch,
      },
    }));
  }

  function setPartidaDraft(capituloId: string, patch: Partial<PartidaDraft>) {
    setPartidaDrafts((current) => ({
      ...current,
      [capituloId]: {
        ...getPartidaDraft(capituloId),
        ...patch,
      },
    }));
  }

  function handleCreateCapitulo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!capituloDraft.codigo.trim() || !capituloDraft.nombre.trim()) {
      toast.error("Completa código y nombre del capítulo");
      return;
    }

    createCapituloMutation.mutate();
  }

  function handleCreatePartida(event: FormEvent<HTMLFormElement>, capituloId: string) {
    event.preventDefault();
    const payload = getPartidaDraft(capituloId);

    if (!payload.codigo.trim() || !payload.descripcion.trim() || !payload.unidad.trim()) {
      toast.error("Completa código, descripción y unidad de la partida");
      return;
    }

    createPartidaMutation.mutate({ capituloId, payload });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Presupuestos", href: "/dashboard/presupuestos" }, { label: presupuesto.nombre }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/dashboard/presupuestos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{presupuesto.nombre}</h1>
            <Badge className={`border-0 ${presupuestoEstadoClasses[presupuesto.estado]}`}>
              {presupuesto.estado}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {presupuesto.obra?.nombre ?? "Obra"} · Versión {presupuesto.version}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}>
            <Calculator className="w-4 h-4 mr-1" />
            Recalcular
          </Button>
          <Button variant="outline" size="sm" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            Aprobar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (!window.confirm(`¿Eliminar el presupuesto ${presupuesto.nombre}?`)) return;
              deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cabecera del presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <PresupuestoForm
                mode="edit"
                initialData={presupuesto}
                isSubmitting={updateMutation.isPending}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync(values);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo capítulo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCapitulo} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="capitulo-codigo">Código</Label>
                    <Input
                      id="capitulo-codigo"
                      value={capituloDraft.codigo}
                      onChange={(event) => setCapituloDraft((current) => ({ ...current, codigo: event.target.value }))}
                      placeholder="01"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="capitulo-orden">Orden</Label>
                    <Input
                      id="capitulo-orden"
                      type="number"
                      value={capituloDraft.orden}
                      onChange={(event) => setCapituloDraft((current) => ({ ...current, orden: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="capitulo-nombre">Nombre</Label>
                    <Input
                      id="capitulo-nombre"
                      value={capituloDraft.nombre}
                      onChange={(event) => setCapituloDraft((current) => ({ ...current, nombre: event.target.value }))}
                      placeholder="Movimiento de tierras"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={createCapituloMutation.isPending}>
                    {createCapituloMutation.isPending ? "Guardando..." : "Agregar capítulo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <p>Total presupuesto: {formatCurrency(presupuesto.total_presupuesto, presupuesto.moneda)}</p>
              <p>Capítulos: {capitulos.length}</p>
              <p>Partidas: {totalPartidas}</p>
              <p>GI/Beneficio/IVA: {presupuesto.gastos_indirectos_pct}% / {presupuesto.beneficio_pct}% / {presupuesto.iva_pct}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Árbol de capítulos y partidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {capitulos.length === 0 && (
              <p className="text-sm text-zinc-500">Este presupuesto aún no tiene capítulos.</p>
            )}

            {capitulos.map((capitulo: Capitulo) => (
              <div key={capitulo.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {capitulo.codigo} · {capitulo.nombre}
                    </p>
                    <p className="text-xs text-zinc-500">Orden {capitulo.orden}</p>
                  </div>
                 <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCapituloId((current) => (current === capitulo.id ? null : capitulo.id));
                        setCapituloEditDraft(capitulo.id, {
                          codigo: capitulo.codigo,
                          nombre: capitulo.nombre,
                          orden: String(capitulo.orden),
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveCapituloId((current) => (current === capitulo.id ? null : capitulo.id))}
                    >
                      Nueva partida
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`¿Eliminar el capítulo ${capitulo.nombre}?`)) return;
                        deleteCapituloMutation.mutate(capitulo.id);
                      }}
                      disabled={deleteCapituloMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {editingCapituloId === capitulo.id && (
                  <div className="mt-4 grid gap-4 rounded-lg border bg-zinc-50 p-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Código</Label>
                      <Input
                        value={getCapituloEditDraft(capitulo).codigo}
                        onChange={(event) => setCapituloEditDraft(capitulo.id, { codigo: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Orden</Label>
                      <Input
                        type="number"
                        value={getCapituloEditDraft(capitulo).orden}
                        onChange={(event) => setCapituloEditDraft(capitulo.id, { orden: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Nombre</Label>
                      <Input
                        value={getCapituloEditDraft(capitulo).nombre}
                        onChange={(event) => setCapituloEditDraft(capitulo.id, { nombre: event.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingCapituloId(null)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateCapituloMutation.mutate({
                            capituloId: capitulo.id,
                            payload: getCapituloEditDraft(capitulo),
                          })
                        }
                        disabled={updateCapituloMutation.isPending}
                      >
                        Guardar capítulo
                      </Button>
                    </div>
                  </div>
                )}

                {activeCapituloId === capitulo.id && (
                  <form onSubmit={(event) => handleCreatePartida(event, capitulo.id)} className="mt-4 space-y-4 rounded-lg border bg-zinc-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`partida-codigo-${capitulo.id}`}>Código</Label>
                        <Input
                          id={`partida-codigo-${capitulo.id}`}
                          value={getPartidaDraft(capitulo.id).codigo}
                          onChange={(event) => setPartidaDraft(capitulo.id, { codigo: event.target.value })}
                          placeholder="01.001"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`partida-unidad-${capitulo.id}`}>Unidad</Label>
                        <Input
                          id={`partida-unidad-${capitulo.id}`}
                          value={getPartidaDraft(capitulo.id).unidad}
                          onChange={(event) => setPartidaDraft(capitulo.id, { unidad: event.target.value })}
                          placeholder="m2"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor={`partida-descripcion-${capitulo.id}`}>Descripción</Label>
                        <Textarea
                          id={`partida-descripcion-${capitulo.id}`}
                          value={getPartidaDraft(capitulo.id).descripcion}
                          onChange={(event) => setPartidaDraft(capitulo.id, { descripcion: event.target.value })}
                          placeholder="Descripción de la partida"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`partida-cantidad-${capitulo.id}`}>Cantidad</Label>
                        <Input
                          id={`partida-cantidad-${capitulo.id}`}
                          type="number"
                          step="0.0001"
                          value={getPartidaDraft(capitulo.id).cantidad}
                          onChange={(event) => setPartidaDraft(capitulo.id, { cantidad: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`partida-precio-${capitulo.id}`}>Precio unitario</Label>
                        <Input
                          id={`partida-precio-${capitulo.id}`}
                          type="number"
                          step="0.0001"
                          value={getPartidaDraft(capitulo.id).precio_unitario}
                          onChange={(event) => setPartidaDraft(capitulo.id, { precio_unitario: event.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={createPartidaMutation.isPending}>
                        {createPartidaMutation.isPending ? "Guardando..." : "Agregar partida"}
                      </Button>
                    </div>
                  </form>
                )}

                <div className="mt-4 space-y-3">
                  {(capitulo.partidas ?? []).length === 0 && (
                    <p className="text-sm text-zinc-500">Sin partidas cargadas.</p>
                  )}

                  {(capitulo.partidas ?? []).map((partida: Partida) => (
                    <div key={partida.id} className="rounded-lg border bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm text-zinc-900">
                            {partida.codigo} · {partida.descripcion}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {partida.cantidad} {partida.unidad} · PU {formatCurrency(partida.precio_unitario, presupuesto.moneda)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900">
                            {formatCurrency(partida.importe_total, presupuesto.moneda)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPartidaId((current) => (current === partida.id ? null : partida.id));
                              setPartidaEditDraft(partida.id, {
                                codigo: partida.codigo,
                                descripcion: partida.descripcion,
                                unidad: partida.unidad,
                                cantidad: partida.cantidad,
                                precio_unitario: partida.precio_unitario,
                                observaciones: partida.observaciones ?? "",
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!window.confirm(`¿Eliminar la partida ${partida.codigo}?`)) return;
                              deletePartidaMutation.mutate(partida.id);
                            }}
                            disabled={deletePartidaMutation.isPending}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      {editingPartidaId === partida.id && (
                        <div className="mt-4 grid gap-4 rounded-lg border bg-zinc-50 p-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Código</Label>
                            <Input
                              value={getPartidaEditDraft(partida).codigo}
                              onChange={(event) => setPartidaEditDraft(partida.id, { codigo: event.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Unidad</Label>
                            <Input
                              value={getPartidaEditDraft(partida).unidad}
                              onChange={(event) => setPartidaEditDraft(partida.id, { unidad: event.target.value })}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label>Descripción</Label>
                            <Textarea
                              value={getPartidaEditDraft(partida).descripcion}
                              onChange={(event) => setPartidaEditDraft(partida.id, { descripcion: event.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Cantidad</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={getPartidaEditDraft(partida).cantidad}
                              onChange={(event) => setPartidaEditDraft(partida.id, { cantidad: event.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Precio unitario</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={getPartidaEditDraft(partida).precio_unitario}
                              onChange={(event) => setPartidaEditDraft(partida.id, { precio_unitario: event.target.value })}
                            />
                          </div>
                          <div className="flex justify-end gap-2 md:col-span-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingPartidaId(null)}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updatePartidaMutation.mutate({
                                  partidaId: partida.id,
                                  payload: getPartidaEditDraft(partida),
                                })
                              }
                              disabled={updatePartidaMutation.isPending}
                            >
                              Guardar partida
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
