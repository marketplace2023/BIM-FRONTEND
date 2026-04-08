"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/public/pagination-controls";
import { nativeSelectClassName } from "@/lib/bim";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicSiteFooter } from "@/components/public/site-footer";
import { PublicSiteHeader } from "@/components/public/site-header";
import { ProductCard } from "@/components/public/product-card";
import { paymentMethodsApi, publicStoresApi } from "@/lib/api/api";
import {
  clampText,
  getStoreAddress,
  getStoreCityLabel,
  getStoreTypeLabel,
  sortPublicProducts,
  type ProductSortOption,
} from "@/lib/marketplace";

export default function PublicStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<ProductSortOption>((searchParams.get("sort") as ProductSortOption) ?? "recent");
  const storeId = params?.id;
  const currentPage = Number(searchParams.get("page") ?? "1");
  const pageSize = 12;

  const storeQuery = useQuery({
    queryKey: ["public-store-page", storeId],
    queryFn: () => publicStoresApi.getById(storeId!).then((response) => response.data),
    enabled: Boolean(storeId),
  });

  const store = storeQuery.data;

  const productsQuery = useQuery({
    queryKey: ["public-store-page-products", storeId, currentPage],
    queryFn: () => publicStoresApi.getProducts(storeId!, { page: currentPage, limit: pageSize }).then((response) => response.data),
    enabled: Boolean(storeId),
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["public-store-payment-methods", storeId],
    queryFn: () => paymentMethodsApi.getMy(storeId!).then((response) => response.data),
    enabled: Boolean(storeId),
  });

  const productsPage = productsQuery.data;
  const products = sortPublicProducts(productsPage?.data ?? [], sort);
  const totalProducts = productsPage?.total ?? 0;
  const paymentMethods = paymentMethodsQuery.data ?? [];

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    router.push(`/marketplace/tiendas/${storeId}${params.toString() ? `?${params}` : ""}`);
  }

  if (storeQuery.isLoading) {
    return <div className="min-h-screen bg-[#f7f6f3]" />;
  }

  if (!store || storeQuery.isError) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
        <PublicSiteHeader
          query={query}
          onQueryChange={setQuery}
          onSearchSubmit={() => router.push(`/marketplace${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`)}
        />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center lg:px-8">
          <PackageSearch className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
          <p className="text-xl font-semibold text-zinc-950">No encontramos esta tienda</p>
          <p className="mt-2 text-sm text-zinc-500">Puede que ya no esté publicada o que el enlace no sea válido.</p>
        </main>
        <PublicSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
      <PublicSiteHeader
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={() => router.push(`/marketplace${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950">
            <ArrowLeft className="h-4 w-4" />
            Volver al marketplace
          </Link>
          <Badge variant="outline">{getStoreTypeLabel(store.entity_type)}</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.5rem] bg-zinc-100">
                {store.logo_url ? (
                  <Image src={store.logo_url} alt={store.name} width={96} height={96} className="h-24 w-24 object-cover" unoptimized />
                ) : (
                  <Building2 className="h-8 w-8 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Proveedor publicado</p>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">{store.name}</h1>
                  <p className="mt-2 text-base text-zinc-500">
                    {getStoreTypeLabel(store.entity_type)} · {getStoreCityLabel(store)}
                  </p>
                </div>
                <p className="max-w-3xl text-base leading-7 text-zinc-500">
                  {store.description || "Proveedor visible dentro del marketplace BIM Dueck."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-600">
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {getStoreAddress(store)}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {store.email ?? "Email no publicado"}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {store.phone ?? "Teléfono no publicado"}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {store.website ?? "Sitio web no disponible"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métodos de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-600">
                {paymentMethods.length === 0 ? (
                  <p>Esta tienda aún no publicó métodos de pago visibles.</p>
                ) : (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="rounded-xl border bg-zinc-50 p-3">
                      <p className="font-medium text-zinc-900">{method.type || method.details || "Método de pago"}</p>
                      {method.details && <p className="mt-1 text-sm text-zinc-500">{method.details}</p>}
                    </div>
                  ))
                )}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-800">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Wallet className="h-4 w-4" />
                    Solicita información comercial para avanzar con la compra o cotización.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Catálogo</p>
              <h2 className="text-3xl font-semibold tracking-tight">Productos publicados por esta tienda</h2>
            </div>
            <Badge variant="outline">{products.length} visibles</Badge>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Ordenar</p>
              <p className="text-sm text-zinc-500">Cambia la forma en que se presenta el catálogo público de esta tienda.</p>
            </div>
            <select
              value={sort}
              onChange={(event) => {
                const next = event.target.value as ProductSortOption;
                setSort(next);
                const params = new URLSearchParams();
                if (query.trim()) params.set("q", query.trim());
                if (next !== "recent") params.set("sort", next);
                router.push(`/marketplace/tiendas/${store.id}${params.toString() ? `?${params}` : ""}`);
              }}
              className={`${nativeSelectClassName} min-w-[220px] bg-white`}
            >
              <option value="recent">Más recientes</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>

          {products.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-white text-center text-zinc-500">
              <PackageSearch className="mb-4 h-10 w-10 text-zinc-300" />
              <p className="text-lg font-medium text-zinc-900">Esta tienda todavía no tiene productos publicados</p>
              <p className="mt-2 max-w-md text-sm">Vuelve más tarde o explora otros proveedores dentro del marketplace.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    href={`/marketplace/productos/${product.id}`}
                    storeLabel={store.name}
                  />
                ))}
              </div>
              <PaginationControls page={currentPage} total={totalProducts} limit={pageSize} onPageChange={goToPage} />
            </div>
          )}
        </section>

        <section className="mt-12 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Sobre la tienda</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.5rem] bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">Nombre legal</p>
              <p className="mt-2 text-lg font-medium text-zinc-950">{store.legal_name || store.name}</p>
            </div>
            <div className="rounded-[1.5rem] bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">Cobertura</p>
              <p className="mt-2 text-lg font-medium text-zinc-950">{getStoreCityLabel(store)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-zinc-50 p-5">
              <p className="text-sm text-zinc-500">Descripción</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{clampText(store.description, 180) || "Proveedor publicado en la red BIM Dueck."}</p>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
