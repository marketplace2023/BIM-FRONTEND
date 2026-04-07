"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContratistaForm } from "@/components/dashboard/bim/contratista-form";
import { contratistasApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import type { Contratista } from "@/types/bim";

export default function NuevoContratistaPage() {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Contratista>) => contratistasApi.create(payload),
    onSuccess: (response) => {
      toast.success("Contratista creado correctamente");
      router.push(`/dashboard/contratistas/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo crear el contratista"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/contratistas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Nuevo contratista</h1>
          <p className="text-sm text-zinc-500">Registra una empresa, profesional o subcontratista para tus obras.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del contratista</CardTitle>
        </CardHeader>
        <CardContent>
          <ContratistaForm
            mode="create"
            isSubmitting={createMutation.isPending}
            onSubmit={async (values) => {
              await createMutation.mutateAsync(values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
