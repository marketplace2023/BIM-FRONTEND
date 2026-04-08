"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicSiteFooter } from "@/components/public/site-footer";
import { PublicSiteHeader } from "@/components/public/site-header";
import { ProductCard } from "@/components/public/product-card";
import { categoriesApi, productsApi, publicStoresApi } from "@/lib/api/api";
import { clampText, getPrimaryProductImage, getStoreCityLabel, getStoreTypeLabel } from "@/lib/marketplace";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const storesQuery = useQuery({
    queryKey: ["public-stores-home"],
    queryFn: () => publicStoresApi.getAll({ limit: 8 }).then((response) => response.data.data),
  });

  const stores = storesQuery.data ?? [];
  const featuredStore = stores[0];

  const categoriesQuery = useQuery({
    queryKey: ["public-home-categories", featuredStore?.tenant_id, featuredStore?.entity_type],
    queryFn: () =>
      categoriesApi
        .getAll({ tenant_id: featuredStore?.tenant_id, vertical: featuredStore?.entity_type })
        .then((response) => response.data),
    enabled: Boolean(featuredStore?.tenant_id && featuredStore?.entity_type),
  });

  const featuredProductsQuery = useQuery({
    queryKey: ["public-home-products", featuredStore?.tenant_id, featuredStore?.id],
    queryFn: () =>
      productsApi
        .getAll({ tenant_id: featuredStore?.tenant_id, partner_id: featuredStore?.id, limit: 8 })
        .then((response) => response.data.data),
    enabled: Boolean(featuredStore?.tenant_id && featuredStore?.id),
  });

  const featuredProducts = featuredProductsQuery.data ?? [];
  const heroImage = getPrimaryProductImage(featuredProducts[0]);
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
      <PublicSiteHeader
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={() => router.push(`/marketplace${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`)}
      />

      <main>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-10">
          <div className="overflow-hidden rounded-[2rem] bg-[#121820] text-white shadow-2xl">
            <div className="grid gap-8 p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  Marketplace de construcción
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
                    Una plataforma para comprar, vender y gestionar obras desde un solo flujo.
                  </h1>
                  <p className="max-w-lg text-base leading-7 text-white/70 lg:text-lg">
                    Descubre materiales, servicios y proveedores publicados en BIM Dueck mientras operas la gestión BIM de tus proyectos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-full bg-white text-zinc-950 hover:bg-white/90" onClick={() => router.push("/marketplace")}>
                    Explorar marketplace
                  </Button>
                  <Button variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push("/auth/register")}>
                    Publicar mi tienda
                  </Button>
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-3">
                  {[
                    { label: "Tiendas activas", value: String(stores.length) },
                    { label: "Categorías visibles", value: String(categories.length) },
                    { label: "Productos destacados", value: String(featuredProducts.length) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                      <p className="text-sm text-white/60">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[360px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
                {heroImage ? (
                  <Image src={heroImage} alt="Producto destacado" fill className="object-cover opacity-90" unoptimized />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-zinc-900 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-transparent to-transparent" />
                {featuredStore && (
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Tienda destacada</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{featuredStore.name}</p>
                      <p className="mt-1 text-sm text-white/70">
                        {getStoreTypeLabel(featuredStore.entity_type)} · {getStoreCityLabel(featuredStore)}
                      </p>
                      <p className="mt-3 text-sm text-white/70">
                        {clampText(featuredStore.description, 120) || "Proveedor verificado dentro del marketplace BIM Dueck."}
                      </p>
                      <button
                        onClick={() => router.push(`/marketplace/tiendas/${featuredStore.id}`)}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white"
                      >
                        Ver tienda pública
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                ¿Cómo empezar?
              </div>
              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Explora tiendas públicas",
                    description: "Compara catálogos publicados y descubre categorías activas por proveedor.",
                  },
                  {
                    title: "Registra tu operación",
                    description: "Abre una cuenta, crea tu tienda y publica productos o servicios en pocos pasos.",
                  },
                  {
                    title: "Conecta con tu flujo BIM",
                    description: "Usa la misma plataforma para obras, presupuestos, certificaciones y marketplace.",
                  },
                ].map((item, index) => (
                  <div key={item.title} className="rounded-2xl bg-zinc-50 p-4">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-950">{item.title}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700">Categorías populares</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => router.push(`/marketplace/categorias/${category.id}${featuredStore?.id ? `?store=${featuredStore.id}` : ""}`)}
                    className="rounded-2xl border border-blue-100 bg-white px-4 py-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-100/40"
                  >
                    <p className="font-medium text-zinc-950">{category.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">Explorar productos publicados</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Tiendas</p>
              <h2 className="text-3xl font-semibold tracking-tight">Proveedores visibles en el marketplace</h2>
            </div>
            <Link href="/marketplace">
              <Button variant="outline" className="rounded-full">
                Ver catálogo completo
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stores.map((store) => (
              <div key={store.id} className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                    {store.logo_url ? (
                      <Image src={store.logo_url} alt={store.name} width={48} height={48} className="h-12 w-12 rounded-2xl object-cover" unoptimized />
                    ) : (
                      <Store className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-950">{store.name}</p>
                    <p className="text-sm text-zinc-500">{getStoreTypeLabel(store.entity_type)}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-zinc-500">{clampText(store.description, 90) || getStoreCityLabel(store)}</p>
                <button
                  onClick={() => router.push(`/marketplace/tiendas/${store.id}`)}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-zinc-950"
                >
                  Ver tienda
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Productos</p>
              <h2 className="text-3xl font-semibold tracking-tight">Catálogo publicado recientemente</h2>
            </div>
            <Link href="/marketplace">
              <Button variant="outline" className="rounded-full">
                Ir al marketplace
              </Button>
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/marketplace/productos/${product.id}`}
                storeLabel={featuredStore?.name}
              />
            ))}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
