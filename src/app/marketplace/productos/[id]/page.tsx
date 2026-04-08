"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, ClipboardPenLine, MapPin, PackageSearch, Send } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PublicSiteFooter } from "@/components/public/site-footer";
import { PublicSiteHeader } from "@/components/public/site-header";
import { ProductCard } from "@/components/public/product-card";
import { Textarea } from "@/components/ui/textarea";
import { categoriesApi, productsApi, publicIntentsApi, publicStoresApi } from "@/lib/api/api";
import {
  clampText,
  getStoreCityLabel,
  getStoreTypeLabel,
} from "@/lib/marketplace";

export default function PublicProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadCountry, setLeadCountry] = useState("");
  const [leadQty, setLeadQty] = useState("1");
  const [leadMessage, setLeadMessage] = useState("");
  const productId = params?.id;

  const productQuery = useQuery({
    queryKey: ["public-product", productId],
    queryFn: async () => {
      try {
        const response = await productsApi.getPublicById(productId!);
        return response.data;
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }

        const fallback = await productsApi.getById(productId!);
        if (fallback.data.is_published !== 1) {
          throw error;
        }

        return fallback.data;
      }
    },
    enabled: Boolean(productId),
  });

  const product = productQuery.data;

  const storeQuery = useQuery({
    queryKey: ["public-store-for-product", product?.partner_id],
    queryFn: () => publicStoresApi.getById(product!.partner_id).then((response) => response.data),
    enabled: Boolean(product?.partner_id),
  });

  const categoriesQuery = useQuery({
    queryKey: ["public-product-categories", product?.tenant_id, product?.vertical_type],
    queryFn: () =>
      categoriesApi
        .getAll({ tenant_id: product?.tenant_id, vertical: product?.vertical_type })
        .then((response) => response.data),
    enabled: Boolean(product?.tenant_id && product?.vertical_type),
  });

  const relatedProductsQuery = useQuery({
    queryKey: ["public-related-products", product?.tenant_id, product?.categ_id, product?.id],
    queryFn: () =>
      productsApi
        .getAll({ tenant_id: product?.tenant_id, categ_id: product?.categ_id, limit: 8 })
        .then((response) => response.data.data),
    enabled: Boolean(product?.tenant_id),
  });

  const sameStoreProductsQuery = useQuery({
    queryKey: ["public-store-products", product?.partner_id],
    queryFn: () => publicStoresApi.getProducts(product!.partner_id, { limit: 8 }).then((response) => response.data.data),
    enabled: Boolean(product?.partner_id),
  });

  const gallery = [
    ...(product?.images?.map((image) => image.image_url) ?? []),
    ...(typeof product?.cover_image_url === "string" ? [product.cover_image_url] : []),
  ].filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);

  const activeImage = selectedImage && gallery.includes(selectedImage) ? selectedImage : gallery[0] ?? null;
  const store = storeQuery.data;
  const category = categoriesQuery.data?.find((item) => item.id === product?.categ_id);
  const relatedProducts = (relatedProductsQuery.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4);
  const sameStoreProducts = (sameStoreProductsQuery.data ?? []).filter((item) => item.id !== product?.id).slice(0, 4);

  const leadMutation = useMutation({
    mutationFn: () => {
      if (!product) {
        throw new Error("Product not loaded");
      }

      return publicIntentsApi.createProductLead({
        product_tmpl_id: product.id,
        buyer_name: leadName.trim(),
        buyer_email: leadEmail.trim(),
        buyer_phone: leadPhone.trim() || undefined,
        company: leadCompany.trim() || undefined,
        city: leadCity.trim() || undefined,
        country: leadCountry.trim() || undefined,
        qty: Number.parseInt(leadQty || "1", 10) || 1,
        message: leadMessage.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Solicitud enviada correctamente al proveedor");
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadCompany("");
      setLeadCity("");
      setLeadCountry("");
      setLeadQty("1");
      setLeadMessage("");
    },
    onError: () => {
      toast.error("No se pudo registrar la solicitud comercial. Intenta nuevamente.");
    },
  });

  function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) {
      toast.error("No se pudo preparar la solicitud para este producto");
      return;
    }

    if (!leadName.trim() || !leadEmail.trim()) {
      toast.error("Completa al menos tu nombre y correo para solicitar información");
      return;
    }

    leadMutation.mutate();
  }

  if (productQuery.isLoading) {
    return <div className="min-h-screen bg-[#f7f6f3]" />;
  }

  if (!product || productQuery.isError || storeQuery.isError) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] text-zinc-900">
        <PublicSiteHeader query={query} onQueryChange={setQuery} onSearchSubmit={() => router.push(`/marketplace?q=${encodeURIComponent(query.trim())}`)} />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center lg:px-8">
          <PackageSearch className="mx-auto mb-4 h-10 w-10 text-zinc-300" />
          <p className="text-xl font-semibold text-zinc-950">No encontramos este producto</p>
          <p className="mt-2 text-sm text-zinc-500">Puede que ya no esté publicado o que el enlace no sea válido.</p>
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
          {category && <Badge variant="outline">{category.name}</Badge>}
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
              <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
                {gallery.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`relative h-20 w-20 overflow-hidden rounded-2xl border ${activeImage === imageUrl ? "border-zinc-900" : "border-zinc-200"}`}
                  >
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>

              <div className="order-1 space-y-5 lg:order-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{product.listing_type}</Badge>
                    <Badge variant="outline">{product.vertical_type}</Badge>
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">{product.name}</h1>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-500">
                    {product.description_sale || "Producto publicado dentro del marketplace BIM Dueck."}
                  </p>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-zinc-100">
                  {activeImage ? (
                    <Image src={activeImage} alt={product.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-zinc-200">
                      <Building2 className="h-10 w-10 text-zinc-300" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Proveedor</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                  {store?.logo_url ? (
                    <Image src={store.logo_url} alt={store.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover" unoptimized />
                  ) : (
                    <Building2 className="h-6 w-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold text-zinc-950">{store?.name ?? "Proveedor"}</p>
                  <p className="text-sm text-zinc-500">{store ? getStoreTypeLabel(store.entity_type) : "Marketplace"}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-zinc-500">
                {store && (
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {getStoreCityLabel(store)}
                  </p>
                )}
                <p>{clampText(store?.description, 160) || "Proveedor visible dentro del catálogo público."}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => router.push("/auth/register")} className="rounded-full">
                  Solicitar información
                </Button>
                {store && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/marketplace/tiendas/${store.id}`)}
                    className="rounded-full"
                  >
                    Ver tienda
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.push("/marketplace")} className="rounded-full">
                  Seguir explorando
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
                <ClipboardPenLine className="h-4 w-4" />
                Solicitud comercial
              </div>
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <Input placeholder="Tu nombre" value={leadName} onChange={(event) => setLeadName(event.target.value)} />
                <Input type="email" placeholder="Tu correo" value={leadEmail} onChange={(event) => setLeadEmail(event.target.value)} />
                <Input placeholder="Teléfono" value={leadPhone} onChange={(event) => setLeadPhone(event.target.value)} />
                <Input placeholder="Empresa" value={leadCompany} onChange={(event) => setLeadCompany(event.target.value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Ciudad" value={leadCity} onChange={(event) => setLeadCity(event.target.value)} />
                  <Input placeholder="País" value={leadCountry} onChange={(event) => setLeadCountry(event.target.value)} />
                </div>
                <Input type="number" min="1" placeholder="Cantidad" value={leadQty} onChange={(event) => setLeadQty(event.target.value)} />
                <Textarea
                  placeholder={`Quiero cotizar ${product.name} o recibir más detalles técnicos...`}
                  value={leadMessage}
                  onChange={(event) => setLeadMessage(event.target.value)}
                />
                <Button type="submit" className="w-full rounded-full" disabled={leadMutation.isPending}>
                  {leadMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                  <Send className="ml-1 h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Contexto</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p><span className="font-medium text-zinc-950">Tipo:</span> {product.type}</p>
                <p><span className="font-medium text-zinc-950">Publicación:</span> {product.listing_type}</p>
                <p><span className="font-medium text-zinc-950">Moneda:</span> {product.currency_code}</p>
                {category && <p><span className="font-medium text-zinc-950">Categoría:</span> {category.name}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-10">
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Relacionados</p>
                <h2 className="text-2xl font-semibold tracking-tight">Más de esta categoría</h2>
              </div>
              {category && (
                <Button variant="outline" className="rounded-full" onClick={() => router.push(`/marketplace/categorias/${category.id}`)}>
                  Ver categoría
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} href={`/marketplace/productos/${related.id}`} storeLabel={store?.name} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Proveedor</p>
              <h2 className="text-2xl font-semibold tracking-tight">Otros productos de esta tienda</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {sameStoreProducts.map((related) => (
                <ProductCard key={related.id} product={related} href={`/marketplace/productos/${related.id}`} storeLabel={store?.name} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
