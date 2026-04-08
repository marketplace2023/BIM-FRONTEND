"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Edit, ExternalLink, Globe2, Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { productsApi, storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency } from "@/lib/bim";
import { filterStoreProducts, getMarketplaceContext, getProductSku, getProductStock, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function MisProductosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);
  const [query, setQuery] = useState("");

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);
  const managedStoreQuery = useQuery({
    queryKey: ["managed-store-summary", managedStore?.id],
    queryFn: () => storesApi.getById(managedStore!.id).then((response) => response.data),
    enabled: Boolean(managedStore?.id),
  });

  const productsQuery = useQuery({
    queryKey: ["my-products", managedStore?.id],
    queryFn: () =>
      productsApi
        .getMyProducts({
          tenant_id: context.tenantId,
          partner_id: managedStore?.id,
          published: false,
          limit: 100,
        })
        .then((response) => response.data.data),
    enabled: Boolean(context.tenantId && managedStore?.id),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      published
        ? productsApi.unpublish(id, managedStore?.id)
        : productsApi.publish(id, managedStore?.id),
    onSuccess: () => {
      toast.success("Estado de publicación actualizado");
      queryClient.invalidateQueries({ queryKey: ["my-products", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la publicación")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id, managedStore?.id),
    onSuccess: () => {
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: ["my-products", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el producto")),
  });

  const products = productsQuery.data ?? [];
  const filteredProducts = filterStoreProducts(products, query);
  const store = managedStoreQuery.data;
  const isStorePublished = store?.x_verification_status === "published";

  if (!managedStore && !storesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mis Productos" }]} />
        <Card>
          <CardContent className="py-16 text-center text-sm text-zinc-500">
            Crea o vincula primero una tienda para administrar productos en Marketplace.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mis Productos" }]} />
      <PageHeader
        eyebrow="Marketplace"
        title="Mis Productos"
        description="Administra el catálogo de tu tienda, controla publicación y mantén el inventario base ordenado."
        actions={
          <>
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <Input className="pl-9" placeholder="Buscar por nombre, SKU o slug" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Button size="sm" onClick={() => router.push("/dashboard/mis-productos/nuevo")}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo producto
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total" value={String(products.length)} description="Productos y servicios" icon={Package} />
        <StatCard title="Publicados" value={String(products.filter((item) => item.is_published === 1).length)} description="Visibles al cliente" icon={Edit} />
        <StatCard title="Borradores" value={String(products.filter((item) => item.is_published !== 1).length)} description="Pendientes de publicar" icon={Plus} />
        <StatCard title="Con stock" value={String(products.filter((item) => getProductStock(item) > 0).length)} description="Inventario positivo" icon={Search} />
      </div>

      {!isStorePublished && managedStore && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium text-amber-950">Tu tienda aún no es pública</p>
                <p>
                  Aunque publiques productos, no se verán en el marketplace hasta publicar primero la tienda desde `Mi Tienda`.
                </p>
              </div>
            </div>
            <Link href="/dashboard/mi-tienda">
              <Button variant="outline" size="sm">Ir a Mi Tienda</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo gestionado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {productsQuery.isLoading && <div className="animate-pulse h-32 rounded-xl bg-zinc-100" />}
          {!productsQuery.isLoading && filteredProducts.length === 0 && (
            <div className="py-14 text-center text-sm text-zinc-500">
              No hay productos que coincidan con la búsqueda actual.
            </div>
          )}
          {filteredProducts.map((product) => (
            <div key={product.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{product.name}</p>
                    <Badge variant="outline">{product.listing_type}</Badge>
                    <Badge className={product.is_published === 1 ? "border-0 bg-green-100 text-green-700" : "border-0 bg-zinc-100 text-zinc-700"}>
                      {product.is_published === 1 ? "Publicado" : "Borrador"}
                    </Badge>
                    <Badge className={product.is_published === 1 && isStorePublished ? "border-0 bg-blue-100 text-blue-700" : "border-0 bg-amber-100 text-amber-800"}>
                      {product.is_published === 1 && isStorePublished ? "Visible en marketplace" : "No visible públicamente"}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500">{product.description_sale ?? "Sin descripción comercial"}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>SKU: {getProductSku(product)}</span>
                    <span>Stock: {getProductStock(product)}</span>
                    <span>Precio: {formatCurrency(product.list_price, product.currency_code)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/mis-productos/${product.id}`)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  {product.is_published === 1 && isStorePublished && (
                    <Link href={`/marketplace/productos/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Ver público
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishMutation.mutate({ id: product.id, published: product.is_published === 1 })}
                    disabled={publishMutation.isPending}
                  >
                    {product.is_published === 1 ? "Despublicar" : "Publicar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar el producto ${product.name}?`)) return;
                      deleteMutation.mutate(product.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
