"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { contratistasApi } from "@/lib/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HardHat, Plus, ShieldCheck, UserCircle2, Ban, Search } from "lucide-react";
import Link from "next/link";
import type { Contratista } from "@/types/bim";
import { contratistaEstadoClasses, contratistaEstadoLabels, contratistaTipoLabels, nativeSelectClassName } from "@/lib/bim";

export default function ContratistasPage() {
  const [estado, setEstado] = useState<string>("");
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["contratistas", estado],
    queryFn: () => contratistasApi.getAll(estado ? { estado } : undefined).then((r) => r.data),
  });

  const items: Contratista[] = data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = items.filter((item) =>
    !normalizedQuery
      ? true
      : [
          item.nombre,
          item.nombre_legal,
          item.rut_nif,
          item.contacto_email,
          item.contacto_tel,
          item.contacto_nombre,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Contratistas"
        description="Consolida tu red de empresas y profesionales para asignarlos rápidamente a cada obra."
        actions={
          <>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nombre, documento o contacto"
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
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
            </div>
            <Link href="/dashboard/contratistas/nuevo">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nuevo contratista
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total" value={String(items.length)} description="Contratistas registrados" icon={HardHat} />
        <StatCard title="Activos" value={String(items.filter((item) => item.estado === "activo").length)} description="Disponibles para asignación" icon={ShieldCheck} />
        <StatCard title="Empresas" value={String(items.filter((item) => item.tipo === "empresa").length)} description="Personas jurídicas" icon={UserCircle2} />
        <StatCard title="Suspendidos" value={String(items.filter((item) => item.estado === "suspendido").length)} description="Requieren revisión" icon={Ban} />
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-zinc-100 rounded" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-500">Error cargando contratistas.</p>
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <HardHat className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No hay contratistas que coincidan con la búsqueda</p>
          <Link href="/dashboard/contratistas/nuevo" className="mt-3">
            <Button variant="outline" size="sm">Crear primer contratista</Button>
          </Link>
        </div>
      )}

      {!isLoading && filteredItems.length > 0 && (
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RIF / Doc</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((c: Contratista) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-zinc-50"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/contratistas/${c.id}`}
                      className="hover:underline"
                    >
                      {c.nombre}
                    </Link>
                    {c.nombre_legal && (
                      <p className="text-xs text-zinc-400">{c.nombre_legal}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">
                    {c.rut_nif ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {contratistaTipoLabels[c.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">
                    {c.contacto_email ?? c.contacto_tel ?? c.contacto_nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600">{c.ciudad ?? c.pais ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border-0 ${contratistaEstadoClasses[c.estado]}`}
                    >
                      {contratistaEstadoLabels[c.estado]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
