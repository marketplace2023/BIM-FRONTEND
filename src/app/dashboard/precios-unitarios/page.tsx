"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Box, Calculator, Layers3, PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrecioUnitarioForm } from "@/components/dashboard/bim/precio-unitario-form";
import { RecursoForm } from "@/components/dashboard/bim/recurso-form";
import { preciosUnitariosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDateLabel } from "@/lib/bim";
import type { PrecioUnitario, Recurso } from "@/types/bim";

type Section = "recursos" | "apu";

export default function PreciosUnitariosPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [section, setSection] = useState<Section>("recursos");
  const [query, setQuery] = useState("");

  const recursosQuery = useQuery({
    queryKey: ["apu-recursos"],
    queryFn: () => preciosUnitariosApi.getRecursos().then((response) => response.data),
  });

  const apusQuery = useQuery({
    queryKey: ["apu-list"],
    queryFn: () => preciosUnitariosApi.getAll().then((response) => response.data),
  });

  const createRecursoMutation = useMutation({
    mutationFn: (payload: Partial<Recurso>) => preciosUnitariosApi.createRecurso(payload),
    onSuccess: () => {
      toast.success("Recurso creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["apu-recursos"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el recurso")),
  });

  const deleteRecursoMutation = useMutation({
    mutationFn: (id: string) => preciosUnitariosApi.deleteRecurso(id),
    onSuccess: () => {
      toast.success("Recurso archivado");
      queryClient.invalidateQueries({ queryKey: ["apu-recursos"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el recurso")),
  });

  const createApuMutation = useMutation({
    mutationFn: (payload: Partial<PrecioUnitario>) => preciosUnitariosApi.create(payload),
    onSuccess: (response) => {
      toast.success("APU creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["apu-list"] });
      router.push(`/dashboard/precios-unitarios/${response.data.id}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el APU")),
  });

  const recursos = recursosQuery.data ?? [];
  const apus = apusQuery.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecursos = recursos.filter((recurso) =>
    !normalizedQuery
      ? true
      : [recurso.codigo, recurso.descripcion, recurso.tipo]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
  );
  const filteredApus = apus.filter((apu) =>
    !normalizedQuery
      ? true
      : [apu.codigo, apu.descripcion, apu.categoria]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Análisis de Precios Unitarios"
        description="Centraliza recursos, arma tu descomposición y reutiliza APU en presupuestos y certificaciones."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <Input
                className="pl-9"
                placeholder={section === "recursos" ? "Buscar recurso" : "Buscar APU"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-white p-1">
          <Button variant={section === "recursos" ? "default" : "ghost"} size="sm" onClick={() => setSection("recursos")}>
            Recursos
          </Button>
          <Button variant={section === "apu" ? "default" : "ghost"} size="sm" onClick={() => setSection("apu")}>
            APU
          </Button>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Recursos" value={String(recursos.length)} description="Base de insumos y mano de obra" icon={Box} />
        <StatCard title="APU" value={String(apus.length)} description="Análisis disponibles" icon={Calculator} />
        <StatCard title="Categorías" value={String(new Set(apus.map((item) => item.categoria ?? "Sin categoría")).size)} description="Cobertura de biblioteca" icon={Layers3} />
        <StatCard title="Vigentes" value={String(apus.filter((item) => Boolean(item.vigencia)).length)} description="APU con fecha de vigencia" icon={PackageSearch} />
      </div>

      {section === "recursos" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="w-4 h-4" />
                Nuevo recurso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecursoForm
                isSubmitting={createRecursoMutation.isPending}
                onSubmit={async (values) => {
                  await createRecursoMutation.mutateAsync(values);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biblioteca de recursos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recursosQuery.isLoading && <p className="text-sm text-zinc-500">Cargando recursos...</p>}
              {!recursosQuery.isLoading && filteredRecursos.length === 0 && (
                <p className="text-sm text-zinc-500">No hay recursos que coincidan con la búsqueda.</p>
              )}
              {filteredRecursos.map((recurso) => (
                <div key={recurso.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900">{recurso.codigo} · {recurso.descripcion}</p>
                      <p className="text-xs text-zinc-500">
                        {recurso.tipo} · {recurso.unidad} · Vigencia {formatDateLabel(recurso.vigencia)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`¿Eliminar el recurso ${recurso.codigo}?`)) return;
                        deleteRecursoMutation.mutate(recurso.id);
                      }}
                      disabled={deleteRecursoMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-zinc-700">
                    Precio: {formatCurrency(recurso.precio)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {section === "apu" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PlusFallback />
                Nuevo APU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrecioUnitarioForm
                isSubmitting={createApuMutation.isPending}
                onSubmit={async (values) => {
                  await createApuMutation.mutateAsync(values);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biblioteca de APU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {apusQuery.isLoading && <p className="text-sm text-zinc-500">Cargando APU...</p>}
              {!apusQuery.isLoading && filteredApus.length === 0 && (
                <p className="text-sm text-zinc-500">No hay APU que coincidan con la búsqueda.</p>
              )}
              {filteredApus.map((apu) => (
                <Link key={apu.id} href={`/dashboard/precios-unitarios/${apu.id}`}>
                  <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{apu.codigo} · {apu.descripcion}</p>
                        <p className="text-xs text-zinc-500">
                          {apu.categoria ?? "Sin categoría"} · {apu.unidad} · Rendimiento {apu.rendimiento}
                        </p>
                      </div>
                      <Badge variant="outline">{formatDateLabel(apu.vigencia)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-zinc-600">
                      <span>Precio base: {formatCurrency(apu.precio_base)}</span>
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

function PlusFallback() {
  return <Layers3 className="w-4 h-4" />;
}
