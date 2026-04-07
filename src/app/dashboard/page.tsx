"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { contratistasApi, obrasApi, preciosUnitariosApi } from "@/lib/api/api";
import { formatCurrency } from "@/lib/bim";

export default function DashboardPage() {
  const obrasQuery = useQuery({
    queryKey: ["overview-obras"],
    queryFn: () => obrasApi.getAll().then((response) => response.data),
  });

  const contratistasQuery = useQuery({
    queryKey: ["overview-contratistas"],
    queryFn: () => contratistasApi.getAll().then((response) => response.data),
  });

  const apusQuery = useQuery({
    queryKey: ["overview-apus"],
    queryFn: () => preciosUnitariosApi.getAll().then((response) => response.data),
  });

  const recursosQuery = useQuery({
    queryKey: ["overview-recursos"],
    queryFn: () => preciosUnitariosApi.getRecursos().then((response) => response.data),
  });

  const obras = obrasQuery.data ?? [];
  const contratistas = contratistasQuery.data ?? [];
  const apus = apusQuery.data ?? [];
  const recursos = recursosQuery.data ?? [];
  const obraPrincipal = obras[0];

  const overviewCards = [
    {
      title: "Obras",
      value: String(obras.length),
      description: `${obras.filter((obra) => obra.estado === "ejecucion").length} en ejecución`,
      icon: Building2,
    },
    {
      title: "Contratistas",
      value: String(contratistas.length),
      description: `${contratistas.filter((item) => item.estado === "activo").length} activos`,
      icon: HardHat,
    },
    {
      title: "APU",
      value: String(apus.length),
      description: `${recursos.length} recursos disponibles`,
      icon: Calculator,
    },
    {
      title: "Inversión base",
      value: formatCurrency(
        obras.reduce((acc, obra) => acc + Number.parseFloat(obra.presupuesto_base ?? "0"), 0),
      ),
      description: "Suma de presupuestos base de obras",
      icon: FileText,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión BIM"
        title="Panel operativo"
        description="Accede al estado general de obras, recursos, presupuestos y certificaciones desde un solo lugar."
        actions={
          <>
            <Link href="/dashboard/obras/nueva">
              <Button size="sm">Nueva obra</Button>
            </Link>
            <Link href="/dashboard/precios-unitarios">
              <Button variant="outline" size="sm">
                Ir a APU
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos BIM</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              {
                href: "/dashboard/obras",
                title: "Obras",
                description: "Consulta estado, responsables y contratistas asignados.",
                icon: Building2,
              },
              {
                href: "/dashboard/contratistas",
                title: "Contratistas",
                description: "Gestiona tu directorio técnico y su disponibilidad.",
                icon: HardHat,
              },
              {
                href: "/dashboard/presupuestos",
                title: "Presupuestos",
                description: "Controla capítulos, partidas y totales por obra.",
                icon: FileText,
              },
              {
                href: "/dashboard/certificaciones",
                title: "Certificaciones",
                description: "Registra avance ejecutado y cambia estados de aprobación.",
                icon: ClipboardList,
              },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex h-full items-start justify-between rounded-xl border p-4 transition-colors hover:bg-zinc-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                      <item.icon className="h-4 w-4 text-blue-600" />
                      {item.title}
                    </div>
                    <p className="text-sm text-zinc-500">{item.description}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-zinc-400" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Foco actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-600">
            {obraPrincipal ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Obra principal</p>
                  <p className="font-medium text-zinc-900">{obraPrincipal.nombre}</p>
                  <p>{obraPrincipal.codigo}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-zinc-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Cliente</p>
                    <p className="font-medium text-zinc-900">{obraPrincipal.cliente}</p>
                  </div>
                  <div className="rounded-xl border bg-zinc-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Presupuesto base</p>
                    <p className="font-medium text-zinc-900">
                      {formatCurrency(obraPrincipal.presupuesto_base, obraPrincipal.moneda)}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/obras/${obraPrincipal.id}`}>
                  <Button variant="outline" size="sm">
                    Abrir obra
                  </Button>
                </Link>
              </>
            ) : (
              <p>No hay obras aún. Empieza creando tu primera obra para activar el panel BIM.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
