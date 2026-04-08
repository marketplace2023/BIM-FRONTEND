"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Filter, PackageSearch, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/public/pagination-controls";
import { nativeSelectClassName } from "@/lib/bim";
import { PublicSiteFooter } from "@/components/public/site-footer";
import { PublicSiteHeader } from "@/components/public/site-header";
import { ProductCard } from "@/components/public/product-card";
import { categoriesApi, productsApi, publicStoresApi } from "@/lib/api/api";
import { clampText, getStoreTypeLabel, sortPublicProducts, type ProductSortOption } from "@/lib/marketplace";

export default function PublicCategoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = params?.id;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState(searchParams.get("store") ?? "");
  const [sort, setSort] = useState<ProductSortOption>((searchParams.get("sort") as ProductSortOption) ?? "recent");
  const currentPage = Number(searchParams.get("page") ?? "1");
  const pageSize = 12;

  const categoryQuery = useQuery({
    queryKey: ["public-category", categoryId],
    queryFn: () => categoriesApi.getById(categoryId!).then((response) => response.data),
    enabled: Boolean(categoryId),
  });

  const category = categoryQuery.data;

  const storesQuery = useQuery({
    queryKey: ["public-category-stores", category?.vertical, category?.tenant_id],
    queryFn: () => publicStoresApi.getAll({ vertical: category?.vertical, limit: 40 }).then((response) => response.data.data),
    enabled: Boolean(category?.vertical),
  });

  const stores = useMemo(
    () => (storesQuery.data ?? []).filter((store) => store.tenant_id === category?.tenant_id),
    [storesQuery.data, category?.tenant_id],
  );

  const productsQuery = useQuery({
    queryKey: ["public-category-products", category?.tenant_id, category?.id, selectedStoreId, query, currentPage],
    queryFn: () =>
      productsApi
        .getAll({
          tenant_id: category?.tenant_id,
          categ_id: category?.id,
          partner_id: selectedStoreId || undefined,
          q: query.trim() || undefined,
          page: currentPage,
          limit: pageSize,
        })
        .then((response) => response.data),
    enabled: Boolean(category?.tenant_id && category?.id),
  });

  const productsPage = productsQuery.data;
  const products = sortPublicProducts(productsPage?.data ?? [], sort);
  const totalProducts = productsPage?.total ?? 0;

  function commitSearch() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedStoreId) params.set("store", selectedStoreId);
    if (sort !== "recent") params.set("sort", sort);
    router.push(`/marketplace/categorias/${categoryId}${params.toString() ? `?${params}` : ""}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedStoreId) params.set("store", selectedStoreId);
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    router.push(`/marketplace/categorias/${categoryId}${params.toString() ? `?${params}` : ""}`);
  }

  if (categoryQuery.isLoading) {
    return <div className="min-h-screen bg-[#f7f6f3]" />;
  }

  if (!category || categoryQuery.isError) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
        <PublicSiteHeader query={query} onQueryChange={setQuery} onSearchSubmit={commitSearch} />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center lg:px-8">
          <PackageSearch className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
          <p className="text-xl font-semibold text-zinc-950">No encontramos esta categoría</p>
          <p className="mt-2 text-sm text-zinc-500">Puede que ya no esté activa o que el enlace no sea válido.</p>
        </main>
        <PublicSiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
      <PublicSiteHeader query={query} onQueryChange={setQuery} onSearchSubmit={commitSearch} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950">
            <ArrowLeft className="h-4 w-4" />
            Volver al marketplace
          </Link>
          <Badge variant="outline">{category.vertical ?? "Categoría"}</Badge>
        </div>

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Categoría pública</p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">{category.name}</h1>
              <p className="max-w-3xl text-base leading-7 text-zinc-500">
                {category.description || "Explora productos publicados dentro de esta categoría del marketplace."}
              </p>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] bg-zinc-100">
              {category.image_url ? (
                <Image src={category.image_url} alt={category.name} width={720} height={420} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center text-zinc-300">
                  <PackageSearch className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                <Filter className="h-4 w-4" />
                Tiendas en esta categoría
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedStoreId("");
                    const params = new URLSearchParams();
                    if (query.trim()) params.set("q", query.trim());
                    if (sort !== "recent") params.set("sort", sort);
                    router.push(`/marketplace/categorias/${category.id}${params.toString() ? `?${params}` : ""}`);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${!selectedStoreId ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50"}`}
                >
                  Todas las tiendas
                </button>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      const params = new URLSearchParams();
                      if (query.trim()) params.set("q", query.trim());
                      if (sort !== "recent") params.set("sort", sort);
                      params.set("store", store.id);
                      router.push(`/marketplace/categorias/${category.id}?${params.toString()}`);
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedStoreId === store.id ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 bg-zinc-50"}`}
                  >
                    <p className="font-medium">{store.name}</p>
                    <p className={`text-sm ${selectedStoreId === store.id ? "text-white/70" : "text-zinc-500"}`}>
                      {getStoreTypeLabel(store.entity_type)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Resultados</p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Productos en {category.name}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{clampText(category.description, 140) || "Catálogo filtrado por categoría."}</p>
                </div>
                <Badge variant="outline">{products.length} visibles</Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Ordenar</p>
                <p className="text-sm text-zinc-500">Reorganiza los productos de esta categoría.</p>
              </div>
              <select
                value={sort}
                onChange={(event) => {
                  const next = event.target.value as ProductSortOption;
                  setSort(next);
                  const params = new URLSearchParams();
                  if (query.trim()) params.set("q", query.trim());
                  if (selectedStoreId) params.set("store", selectedStoreId);
                  if (next !== "recent") params.set("sort", next);
                  router.push(`/marketplace/categorias/${category.id}${params.toString() ? `?${params}` : ""}`);
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
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-white text-center text-zinc-500">
                <PackageSearch className="mb-4 h-10 w-10 text-zinc-300" />
                <p className="text-lg font-medium text-zinc-950">No hay productos visibles en esta categoría</p>
                <p className="mt-2 max-w-md text-sm">Prueba con otra tienda o limpia la búsqueda actual para ampliar resultados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => {
                    const storeLabel = stores.find((store) => store.id === product.partner_id)?.name;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        href={`/marketplace/productos/${product.id}`}
                        storeLabel={storeLabel}
                      />
                    );
                  })}
                </div>
                <PaginationControls page={currentPage} total={totalProducts} limit={pageSize} onPageChange={goToPage} />
              </div>
            )}

            {stores.length > 0 && (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-400">Tiendas destacadas</p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {stores.slice(0, 6).map((store) => (
                    <Link key={store.id} href={`/marketplace/tiendas/${store.id}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                          <Store className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-950">{store.name}</p>
                          <p className="text-sm text-zinc-500">{getStoreTypeLabel(store.entity_type)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
