"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { ProductForm } from "@/components/dashboard/marketplace/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoriesApi, productsApi, storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency } from "@/lib/bim";
import { getMarketplaceContext, getProductSku, getProductStock, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ProductoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);
  const productId = params?.id;

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const productQuery = useQuery({
    queryKey: ["marketplace-product", productId],
    queryFn: () => productsApi.getById(productId!).then((response) => response.data),
    enabled: Boolean(productId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["marketplace-categories", context.tenantId, context.entityType],
    queryFn: () => categoriesApi.getAll({ tenant_id: context.tenantId, vertical: context.entityType }).then((response) => response.data),
    enabled: Boolean(context.tenantId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => productsApi.update(productId!, payload, managedStore?.id),
    onSuccess: () => {
      toast.success("Producto actualizado");
      queryClient.invalidateQueries({ queryKey: ["marketplace-product", productId] });
      queryClient.invalidateQueries({ queryKey: ["my-products", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el producto")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(productId!, managedStore?.id),
    onSuccess: () => {
      toast.success("Producto eliminado");
      router.push("/dashboard/mis-productos");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el producto")),
  });

  const product = productQuery.data;

  if (productQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-2xl bg-zinc-100" />;
  }

  if (!product || productQuery.isError) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mis Productos", href: "/dashboard/mis-productos" }, { label: "Detalle" }]} />
        <p className="text-sm text-red-500">No se pudo cargar el producto solicitado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mis Productos", href: "/dashboard/mis-productos" }, { label: product.name }]} />
      <PageHeader
        eyebrow="Marketplace"
        title={product.name}
        description={product.description_sale ?? "Producto o servicio del catálogo gestionado."}
        actions={
          <>
            <Link href="/dashboard/mis-productos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!window.confirm(`¿Eliminar el producto ${product.name}?`)) return;
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Eliminar
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{product.listing_type}</Badge>
              <Badge className={product.is_published === 1 ? "border-0 bg-green-100 text-green-700" : "border-0 bg-zinc-100 text-zinc-700"}>
                {product.is_published === 1 ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            <p>Precio: {formatCurrency(product.list_price, product.currency_code)}</p>
            <p>SKU: {getProductSku(product)}</p>
            <p>Stock: {getProductStock(product)}</p>
            <p>Slug: {product.slug}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              mode="edit"
              entityType={product.vertical_type}
              categories={categoriesQuery.data ?? []}
              initialData={product}
              isSubmitting={updateMutation.isPending}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync(values);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
