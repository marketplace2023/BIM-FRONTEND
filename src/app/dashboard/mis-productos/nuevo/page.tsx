"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { ProductForm } from "@/components/dashboard/marketplace/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categoriesApi, productsApi, storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { getMarketplaceContext, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NuevoProductoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const categoriesQuery = useQuery({
    queryKey: ["marketplace-categories", context.tenantId, context.entityType],
    queryFn: () =>
      categoriesApi
        .getAll({ tenant_id: context.tenantId, vertical: context.entityType })
        .then((response) => response.data),
    enabled: Boolean(context.tenantId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => productsApi.create(payload, managedStore?.id),
    onSuccess: (response) => {
      toast.success("Producto creado correctamente");
      router.push(`/dashboard/mis-productos/${response.data.id}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el producto")),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mis Productos", href: "/dashboard/mis-productos" }, { label: "Nuevo" }]} />
      <PageHeader
        eyebrow="Marketplace"
        title="Nuevo producto"
        description="Agrega un producto o servicio a tu catálogo gestionado."
        actions={
          <Link href="/dashboard/mis-productos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <ProductForm
            mode="create"
            entityType={context.entityType}
            categories={categoriesQuery.data ?? []}
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
