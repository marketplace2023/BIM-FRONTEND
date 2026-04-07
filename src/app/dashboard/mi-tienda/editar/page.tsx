"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StoreForm } from "@/components/dashboard/marketplace/store-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function EditarTiendaPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const storeDetailQuery = useQuery({
    queryKey: ["managed-store-edit", managedStore?.id],
    queryFn: () => storesApi.getById(managedStore!.id).then((response) => response.data),
    enabled: Boolean(managedStore?.id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => storesApi.update(managedStore!.id, payload),
    onSuccess: () => {
      toast.success("Tienda actualizada correctamente");
      router.push("/dashboard/mi-tienda");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la tienda")),
  });

  if (storesQuery.isLoading || storeDetailQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-2xl bg-zinc-100" />;
  }

  if (!managedStore || storeDetailQuery.isError || !storeDetailQuery.data) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mi Tienda", href: "/dashboard/mi-tienda" }, { label: "Editar" }]} />
        <p className="text-sm text-red-500">No se encontró una tienda gestionable para este usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mi Tienda", href: "/dashboard/mi-tienda" }, { label: "Editar" }]} />
      <PageHeader
        eyebrow="Marketplace"
        title="Editar tienda"
        description="Actualiza la presencia comercial y operativa de tu tienda gestionada."
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
            mode="edit"
            currentUser={user}
            initialData={storeDetailQuery.data}
            isSubmitting={updateMutation.isPending}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync(values);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
