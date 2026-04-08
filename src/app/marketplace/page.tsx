"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/public/pagination-controls";
import { PublicSiteFooter } from "@/components/public/site-footer";
import { PublicSiteHeader } from "@/components/public/site-header";
import { ProductCard } from "@/components/public/product-card";
import { Badge } from "@/components/ui/badge";
import { categoriesApi, productsApi, publicStoresApi } from "@/lib/api/api";
import { nativeSelectClassName } from "@/lib/bim";
import { clampText, getStoreTypeLabel, sortPublicProducts, type ProductSortOption } from "@/lib/marketplace";

export default function MarketplacePage() {
  return (
    <Suspense>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(searchParams.get("store"));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(searchParams.get("category"));
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [sort, setSort] = useState<ProductSortOption>((searchParams.get("sort") as ProductSortOption) ?? "recent");
  const currentPage = Number(searchParams.get("page") ?? "1");
  const pageSize = 12;

  const storesQuery = useQuery({
    queryKey: ["public-stores-marketplace"],
    queryFn: () => publicStoresApi.getAll({ limit: 24 }).then((response) => response.data.data),
  });

  const stores = storesQuery.data ?? [];
  const effectiveStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;
  const effectiveCategoryId = selectedCategoryId ?? "";

  const categoriesQuery = useQuery({
    queryKey: ["public-marketplace-categories", effectiveStore?.tenant_id, effectiveStore?.entity_type],
    queryFn: () =>
      categoriesApi
        .getAll({ tenant_id: effectiveStore?.tenant_id, vertical: effectiveStore?.entity_type })
        .then((response) => response.data),
    enabled: Boolean(effectiveStore?.tenant_id && effectiveStore?.entity_type),
  });

  const productsQuery = useQuery({
    queryKey: ["public-marketplace-products", effectiveStore?.tenant_id, effectiveStore?.id, effectiveCategoryId, query, minPrice, maxPrice, currentPage],
    queryFn: () =>
      productsApi
        .getAll({
          tenant_id: effectiveStore?.tenant_id,
          partner_id: effectiveStore?.id,
          categ_id: effectiveCategoryId || undefined,
          q: query.trim() || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          page: currentPage,
          limit: pageSize,
        })
        .then((response) => response.data),
    enabled: Boolean(effectiveStore?.tenant_id && effectiveStore?.id),
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const productsPage = productsQuery.data;
  const products = sortPublicProducts(productsPage?.data ?? [], sort);
  const totalProducts = productsPage?.total ?? 0;

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  function commitSearch() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (effectiveStore?.id) params.set("store", effectiveStore.id);
    if (effectiveCategoryId) params.set("category", effectiveCategoryId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (sort !== "recent") params.set("sort", sort);
    router.push(`/marketplace${params.toString() ? `?${params}` : ""}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (effectiveStore?.id) params.set("store", effectiveStore.id);
    if (effectiveCategoryId) params.set("category", effectiveCategoryId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    router.push(`/marketplace${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
      <PublicSiteHeader query={query} onQueryChange={setQuery} onSearchSubmit={commitSearch} />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Marketplace</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Explora productos y servicios publicados</h1>
              <p className="mt-3 text-base leading-7 text-zinc-500">
                Filtra por tienda y categoría para descubrir catálogos públicos basados en el backend real del marketplace.
              </p>
            </div>
            <div className="rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              {effectiveStore ? `${effectiveStore.name} · ${getStoreTypeLabel(effectiveStore.entity_type)}` : "Sin tienda seleccionada"}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-5 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <Filter className="h-4 w-4" />
                  Tiendas visibles
                </p>
                <div className="space-y-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        setSelectedCategoryId(null);
                        const params = new URLSearchParams();
                        params.set("store", store.id);
                        if (sort !== "recent") params.set("sort", sort);
                        router.push(`/marketplace?${params.toString()}`);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        effectiveStore?.id === store.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <p className="font-medium">{store.name}</p>
                      <p className={`text-sm ${effectiveStore?.id === store.id ? "text-white/70" : "text-zinc-500"}`}>
                        {getStoreTypeLabel(store.entity_type)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-zinc-900">Categorías</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      const params = new URLSearchParams();
                      if (query.trim()) params.set("q", query.trim());
                      if (effectiveStore?.id) params.set("store", effectiveStore.id);
                      if (minPrice) params.set("min_price", minPrice);
                      if (maxPrice) params.set("max_price", maxPrice);
                      if (sort !== "recent") params.set("sort", sort);
                      router.push(`/marketplace${params.toString() ? `?${params}` : ""}`);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      !effectiveCategoryId ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        const params = new URLSearchParams();
                        if (query.trim()) params.set("q", query.trim());
                        if (effectiveStore?.id) params.set("store", effectiveStore.id);
                        if (minPrice) params.set("min_price", minPrice);
                        if (maxPrice) params.set("max_price", maxPrice);
                        if (sort !== "recent") params.set("sort", sort);
                        params.set("category", category.id);
                        router.push(`/marketplace?${params.toString()}`);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        effectiveCategoryId === category.id
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-zinc-900">Precio</p>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Precio mínimo"
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Precio máximo"
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none"
                  />
                  <Button className="w-full rounded-full" onClick={commitSearch}>
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              {effectiveStore && (
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Tienda activa</p>
                      <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{effectiveStore.name}</h2>
                      <p className="mt-2 max-w-3xl text-sm text-zinc-500">
                        {clampText(effectiveStore.description, 180) || "Catálogo público disponible en el marketplace."}
                      </p>
                    </div>
                    {effectiveCategoryId && (
                      <Badge variant="outline">{categoryLookup.get(effectiveCategoryId)}</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="rounded-full" onClick={() => router.push(`/marketplace/tiendas/${effectiveStore.id}`)}>
                      Ver ficha pública de la tienda
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Ordenar</p>
                  <p className="text-sm text-zinc-500">Controla cómo se presentan los resultados visibles.</p>
                </div>
                <select
                  value={sort}
                  onChange={(event) => {
                    const next = event.target.value as ProductSortOption;
                    setSort(next);
                    const params = new URLSearchParams();
                    if (query.trim()) params.set("q", query.trim());
                    if (effectiveStore?.id) params.set("store", effectiveStore.id);
                    if (effectiveCategoryId) params.set("category", effectiveCategoryId);
                    if (minPrice) params.set("min_price", minPrice);
                    if (maxPrice) params.set("max_price", maxPrice);
                    if (next !== "recent") params.set("sort", next);
                    router.push(`/marketplace${params.toString() ? `?${params}` : ""}`);
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
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-white text-center text-zinc-500">
                  <PackageSearch className="mb-4 h-10 w-10 text-zinc-300" />
                  <p className="text-lg font-medium text-zinc-900">No encontramos productos con esos filtros</p>
                  <p className="mt-2 max-w-md text-sm">
                    Cambia de tienda, limpia la categoría o prueba otra búsqueda para seguir explorando el catálogo.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        href={`/marketplace/productos/${product.id}`}
                        storeLabel={effectiveStore?.name}
                      />
                    ))}
                  </div>
                  <PaginationControls page={currentPage} total={totalProducts} limit={pageSize} onPageChange={goToPage} />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
