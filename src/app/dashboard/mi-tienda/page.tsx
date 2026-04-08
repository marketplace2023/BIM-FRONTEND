"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Mail, MapPin, Package, Phone, Store, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { storesApi, productsApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency } from "@/lib/bim";
import { getMarketplaceContext, getStoreAddress, getStoreStatusLabel, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function MiTiendaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const storeDetailQuery = useQuery({
    queryKey: ["managed-store", managedStore?.id],
    queryFn: () => storesApi.getById(managedStore!.id).then((response) => response.data),
    enabled: Boolean(managedStore?.id),
  });

  const productsQuery = useQuery({
    queryKey: ["managed-store-products", managedStore?.id],
    queryFn: () =>
      productsApi
        .getAll({ tenant_id: context.tenantId, partner_id: managedStore?.id, published: false, limit: 100 })
        .then((response) => response.data.data),
    enabled: Boolean(context.tenantId && managedStore?.id),
  });

  const store = storeDetailQuery.data;
  const products = productsQuery.data ?? [];
  const publishedCount = products.filter((product) => product.is_published === 1).length;
  const listedValue = products.reduce(
    (acc, product) => acc + Number.parseFloat(product.list_price ?? "0"),
    0,
  );

  const publishMutation = useMutation({
    mutationFn: ({ published }: { published: boolean }) =>
      storesApi.update(managedStore!.id, {
        x_verification_status: published ? "draft" : "published",
      }),
    onSuccess: (_response, variables) => {
      toast.success("Estado público de la tienda actualizado");
      queryClient.invalidateQueries({ queryKey: ["managed-store", managedStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["managed-stores"] });
      if (!variables.published && managedStore?.id) {
        router.push(`/marketplace?store=${managedStore.id}`);
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "No se pudo actualizar la visibilidad de la tienda"));
    },
  });

  const isStorePublished = store?.x_verification_status === "published";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Mi Tienda"
        description="Gestiona la ficha comercial de tu tienda y entra a tus productos activos desde un único punto."
        actions={
          store ? (
            <Link href="/dashboard/mi-tienda/editar">
              <Button size="sm" variant="outline">
                <Edit className="mr-1 h-4 w-4" />
                Editar tienda
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/mi-tienda/crear">
              <Button size="sm">Crear mi tienda</Button>
            </Link>
          )
        }
      />

      {store && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Estado" value={getStoreStatusLabel(store)} description={store.entity_type} icon={Store} />
          <StatCard title="Productos" value={String(products.length)} description="Catálogo total" icon={Package} />
          <StatCard title="Publicados" value={String(publishedCount)} description="Visibles al público" icon={Tag} />
          <StatCard title="Valor listado" value={formatCurrency(listedValue)} description="Suma de precios visibles" icon={Store} />
        </div>
      )}

      {storesQuery.isLoading || storeDetailQuery.isLoading ? (
        <div className="animate-pulse h-48 rounded-2xl bg-zinc-100" />
      ) : !store ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
            <Store className="mb-4 h-12 w-12 text-zinc-300" />
            <p className="font-medium text-zinc-900">Aún no tienes una tienda operativa</p>
            <p className="mt-1 max-w-md text-sm">
              Crea una ficha de tienda para empezar a publicar productos y preparar el bloque comercial del sistema.
            </p>
            <Link href="/dashboard/mi-tienda/crear" className="mt-4">
              <Button size="sm">Crear tienda</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Ficha comercial</CardTitle>
                <Badge variant="outline">{getStoreStatusLabel(store)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-600">
              {!isStorePublished && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Tu tienda sigue en borrador. Mientras no la publiques, no aparecerá en `home`, `marketplace` ni en el detalle público de productos.
                </div>
              )}
              {isStorePublished && publishedCount === 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Tu tienda ya es pública, pero todavía no hay productos publicados. En `Mis Productos` usa el botón `Publicar` para que aparezcan en el marketplace.
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Nombre</p>
                <p className="font-medium text-zinc-900">{store.name}</p>
                {store.legal_name && <p>{store.legal_name}</p>}
              </div>
              {store.description && <p>{store.description}</p>}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-zinc-50 p-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Mail className="h-4 w-4" />
                    <span>{store.email ?? "Sin email"}</span>
                  </div>
                </div>
                <div className="rounded-xl border bg-zinc-50 p-3">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone ?? "Sin teléfono"}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-zinc-50 p-3">
                <div className="flex items-start gap-2 text-zinc-500">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>{getStoreAddress(store)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={isStorePublished ? "outline" : "default"}
                className="w-full justify-between"
                onClick={() => publishMutation.mutate({ published: Boolean(isStorePublished) })}
                disabled={publishMutation.isPending}
              >
                {isStorePublished ? "Ocultar tienda del marketplace" : "Publicar tienda en marketplace"}
                <Store className="h-4 w-4" />
              </Button>
              {isStorePublished && (
                <Link href={`/marketplace/tiendas/${store.id}`} className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Ver mi tienda pública
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/mis-productos" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Gestionar productos
                  <Package className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/mis-productos/nuevo" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Crear producto
                  <Tag className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/pedidos" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Estado de pedidos
                  <Store className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
