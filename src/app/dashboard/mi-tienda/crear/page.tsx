"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StoreForm } from "@/components/dashboard/marketplace/store-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function CrearTiendaPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => storesApi.create(payload),
    onSuccess: () => {
      toast.success("Tienda creada correctamente");
      router.push("/dashboard/mi-tienda");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear la tienda")),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mi Tienda", href: "/dashboard/mi-tienda" }, { label: "Crear" }]} />
      <PageHeader
        eyebrow="Marketplace"
        title="Crear tienda"
        description="Registra la ficha base de tu tienda para empezar a publicar productos y servicios."
        actions={
          <Link href="/dashboard/mi-tienda">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <StoreForm
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
