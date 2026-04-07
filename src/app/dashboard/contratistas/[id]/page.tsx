"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { ContratistaForm } from "@/components/dashboard/bim/contratista-form";
import { contratistasApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { contratistaEstadoClasses, contratistaEstadoLabels, contratistaTipoLabels, formatDateLabel } from "@/lib/bim";
import type { Contratista } from "@/types/bim";

export default function ContratistaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contratistaId = params?.id;

  const contratistaQuery = useQuery({
    queryKey: ["contratista", contratistaId],
    queryFn: () => contratistasApi.getById(contratistaId!).then((response) => response.data),
    enabled: Boolean(contratistaId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Contratista>) => contratistasApi.update(contratistaId!, payload),
    onSuccess: () => {
      toast.success("Contratista actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["contratista", contratistaId] });
      queryClient.invalidateQueries({ queryKey: ["contratistas"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo actualizar el contratista"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => contratistasApi.delete(contratistaId!),
    onSuccess: () => {
      toast.success("Contratista eliminado");
      queryClient.invalidateQueries({ queryKey: ["contratistas"] });
      router.push("/dashboard/contratistas");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo eliminar el contratista"));
    },
  });

  const contratista = contratistaQuery.data;

  if (contratistaQuery.isLoading) {
    return <div className="animate-pulse h-40 rounded-lg bg-zinc-100" />;
  }

  if (contratistaQuery.isError || !contratista) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/contratistas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <p className="text-sm text-red-500">No se pudo cargar el contratista solicitado.</p>
      </div>
    );
  }

  function handleDelete() {
    if (!contratista) {
      return;
    }

    if (!window.confirm(`¿Eliminar el contratista ${contratista.nombre}?`)) {
      return;
    }

    deleteMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Contratistas", href: "/dashboard/contratistas" }, { label: contratista.nombre }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link href="/dashboard/contratistas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{contratista.nombre}</h1>
              <Badge className={`border-0 ${contratistaEstadoClasses[contratista.estado]}`}>
                {contratistaEstadoLabels[contratista.estado]}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500">{contratistaTipoLabels[contratista.tipo]}</p>
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar contratista
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar contratista</CardTitle>
          </CardHeader>
          <CardContent>
            <ContratistaForm
              mode="edit"
              initialData={contratista}
              isSubmitting={updateMutation.isPending}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync(values);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ficha rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Nombre legal</p>
              <p className="font-medium text-zinc-900">{contratista.nombre_legal ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Documento</p>
              <p>{contratista.rut_nif ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Contacto</p>
              <p>{contratista.contacto_nombre ?? "-"}</p>
              <p>{contratista.contacto_email ?? "-"}</p>
              <p>{contratista.contacto_tel ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Ubicación</p>
              <p>{contratista.ciudad ?? "-"}</p>
              <p>{contratista.pais ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Alta</p>
              <p>{formatDateLabel(contratista.created_at)}</p>
            </div>
            <p className="rounded-lg border bg-zinc-50 p-3 text-xs text-zinc-500">
              La asignación del contratista a obras se gestiona desde el detalle de cada obra.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
