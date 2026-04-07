"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FileText, GitBranch, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresupuestoForm } from "@/components/dashboard/bim/presupuesto-form";
import { obrasApi, presupuestosApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, nativeSelectClassName, presupuestoEstadoClasses } from "@/lib/bim";
import type { Obra, Presupuesto } from "@/types/bim";

export default function PresupuestosPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
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

  const selectedObra = obras.find((obra) => obra.id === effectiveSelectedObraId);

  const presupuestosQuery = useQuery({
    queryKey: ["presupuestos", effectiveSelectedObraId],
    queryFn: () => presupuestosApi.getByObra(effectiveSelectedObraId).then((response) => response.data),
    enabled: Boolean(effectiveSelectedObraId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Presupuesto>) =>
      presupuestosApi.create({ ...payload, obra_id: effectiveSelectedObraId }),
    onSuccess: (response) => {
      toast.success("Presupuesto creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["presupuestos", effectiveSelectedObraId] });
      router.push(`/dashboard/presupuestos/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo crear el presupuesto"));
    },
  });

  const presupuestos = presupuestosQuery.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPresupuestos = presupuestos.filter((presupuesto) =>
    !normalizedQuery
      ? true
      : [presupuesto.nombre, presupuesto.descripcion]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
  );
  const totalPresupuestado = presupuestos.reduce(
    (acc, item) => acc + Number.parseFloat(item.total_presupuesto ?? "0"),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Presupuestos"
        description="Crea versiones por obra, estructura capítulos y controla el total de cada presupuesto."
        actions={
          <>
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <Input
                className="pl-9"
                placeholder="Buscar presupuesto"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="w-full max-w-xs space-y-1">
              <Label htmlFor="obra-selector">Obra</Label>
              <select
                id="obra-selector"
                className={nativeSelectClassName}
                value={effectiveSelectedObraId}
                onChange={(event) => setSelectedObraId(event.target.value)}
              >
                {obras.map((obra: Obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.codigo} · {obra.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {selectedObra && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Obra seleccionada" value={selectedObra.codigo} description={selectedObra.nombre} icon={FileText} />
          <StatCard title="Versiones" value={String(presupuestos.length)} description="Presupuestos cargados" icon={GitBranch} />
          <StatCard title="Aprobados" value={String(presupuestos.filter((item) => item.estado === "aprobado").length)} description="Listos para certificación" icon={CheckCircle2} />
          <StatCard title="Total acumulado" value={formatCurrency(totalPresupuestado, selectedObra.moneda)} description="Suma de versiones visibles" icon={Plus} />
        </div>
      )}

      {!selectedObra && !obrasQuery.isLoading && (
        <Card>
          <CardContent className="py-10 text-sm text-zinc-500">
            Necesitas al menos una obra registrada para crear presupuestos.
          </CardContent>
        </Card>
      )}

      {selectedObra && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border bg-zinc-50 p-3 text-sm text-zinc-600">
                <p className="font-medium text-zinc-900">{selectedObra.nombre}</p>
                <p>{selectedObra.codigo}</p>
              </div>
              <PresupuestoForm
                mode="create"
                isSubmitting={createMutation.isPending}
                onSubmit={async (values) => {
                  await createMutation.mutateAsync(values);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuestos de la obra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {presupuestosQuery.isLoading && (
                <p className="text-sm text-zinc-500">Cargando presupuestos...</p>
              )}

              {!presupuestosQuery.isLoading && filteredPresupuestos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay presupuestos que coincidan con la búsqueda</p>
                </div>
              )}

              {filteredPresupuestos.map((presupuesto) => (
                <Link key={presupuesto.id} href={`/dashboard/presupuestos/${presupuesto.id}`}>
                  <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-900">{presupuesto.nombre}</p>
                        <p className="text-xs text-zinc-500">
                          Versión {presupuesto.version} · {presupuesto.tipo}
                        </p>
                      </div>
                      <Badge className={`border-0 ${presupuestoEstadoClasses[presupuesto.estado]}`}>
                        {presupuesto.estado}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-zinc-600">
                      <span>Total: {formatCurrency(presupuesto.total_presupuesto, presupuesto.moneda)}</span>
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
