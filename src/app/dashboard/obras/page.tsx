"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { obrasApi } from "@/lib/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Calendar, MapPin, PlayCircle, Flag, Search } from "lucide-react";
import Link from "next/link";
import type { Obra } from "@/types/bim";
import { formatCurrency, formatDateLabel, getUserDisplayName, nativeSelectClassName, obraEstadoClasses, obraEstadoLabels, obraEstadoOptions } from "@/lib/bim";

export default function ObrasPage() {
  const [estado, setEstado] = useState<string>("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["obras", estado],
    queryFn: () => obrasApi.getAll(estado ? { estado } : undefined).then((r) => r.data),
  });

  const obras: Obra[] = data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredObras = obras.filter((obra) =>
    !normalizedQuery
      ? true
      : [obra.nombre, obra.codigo, obra.cliente, obra.ubicacion]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
  );
  const totalBase = obras.reduce(
    (acc, obra) => acc + Number.parseFloat(obra.presupuesto_base ?? "0"),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Obras"
        description="Gestiona el portafolio de obras, su estado operativo y el presupuesto base asociado."
        actions={
          <>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar obra, código o cliente"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            className={nativeSelectClassName}
          >
            <option value="">Todos los estados</option>
            {obraEstadoOptions.map((option) => (
              <option key={option} value={option}>
                {obraEstadoLabels[option]}
              </option>
            ))}
          </select>
            </div>
            <Link href="/dashboard/obras/nueva">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nueva obra
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total obras" value={String(obras.length)} description="Portafolio BIM activo" icon={Building2} />
        <StatCard title="En ejecución" value={String(obras.filter((obra) => obra.estado === "ejecucion").length)} description="Obras en curso" icon={PlayCircle} />
        <StatCard title="Finalizadas" value={String(obras.filter((obra) => obra.estado === "finalizada").length)} description="Proyectos cerrados" icon={Flag} />
        <StatCard title="Base invertida" value={formatCurrency(totalBase)} description="Suma de presupuestos base" icon={Calendar} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500">
          Error cargando obras. Verifique que el servidor esté activo.
        </p>
      )}

      {!isLoading && !isError && filteredObras.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Building2 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No hay obras que coincidan con la búsqueda actual</p>
          <Link href="/dashboard/obras/nueva" className="mt-2">
            <Button variant="outline" size="sm">
              Crear primera obra
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && filteredObras.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredObras.map((obra: Obra) => (
            <Link key={obra.id} href={`/dashboard/obras/${obra.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm line-clamp-2 flex-1">
                      {obra.nombre}
                    </p>
                    <Badge
                      className={`text-xs flex-shrink-0 border-0 ${obraEstadoClasses[obra.estado]}`}
                    >
                      {obraEstadoLabels[obra.estado]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mb-3">
                    {obra.codigo}
                  </p>
                  <div className="space-y-1">
                    {obra.ubicacion && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{obra.ubicacion}</span>
                      </div>
                    )}
                    {obra.fecha_inicio && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        <span>Inicio: {formatDateLabel(obra.fecha_inicio)}</span>
                      </div>
                    )}
                    {obra.cliente && (
                      <p className="text-xs text-zinc-500 truncate">
                        Cliente: {obra.cliente}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 truncate">
                      Responsable: {getUserDisplayName(obra.responsable)}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      Presupuesto base: {formatCurrency(obra.presupuesto_base, obra.moneda)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
