"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ObraForm } from "@/components/dashboard/bim/obra-form";
import { obrasApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Obra } from "@/types/bim";

export default function NuevaObraPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Obra>) => obrasApi.create(payload),
    onSuccess: (response) => {
      toast.success("Obra creada correctamente");
      router.push(`/dashboard/obras/${response.data.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo crear la obra"));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/obras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Nueva obra</h1>
          <p className="text-sm text-zinc-500">Registra una nueva obra con su planificación base.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <ObraForm
            mode="create"
            currentUser={user}
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
