import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { clampText, getPrimaryProductImage, getProductShortMeta } from "@/lib/marketplace";
import type { Product } from "@/types/marketplace";

interface ProductCardProps {
  product: Product;
  href: string;
  storeLabel?: string;
}

export function ProductCard({ product, href, storeLabel }: ProductCardProps) {
  const imageUrl = getPrimaryProductImage(product);

  return (
    <Link href={href}>
      <Card className="h-full border-zinc-200 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-zinc-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-zinc-200 text-zinc-400">
              <Building2 className="h-8 w-8" />
            </div>
          )}
        </div>

        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{product.listing_type}</Badge>
            {product.vertical_type && <Badge variant="outline">{product.vertical_type}</Badge>}
          </div>
          <div>
            <h3 className="line-clamp-2 text-base font-semibold text-zinc-950">{product.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {clampText(product.description_sale, 90) || getProductShortMeta(product)}
            </p>
          </div>
          {storeLabel && <p className="text-xs uppercase tracking-wide text-zinc-400">{storeLabel}</p>}
        </CardContent>

        <CardFooter className="mt-auto flex items-center justify-between border-t bg-zinc-50/70">
          <span className="text-sm font-medium text-zinc-900">Ver detalle</span>
          <ArrowRight className="h-4 w-4 text-zinc-500" />
        </CardFooter>
      </Card>
    </Link>
  );
}
