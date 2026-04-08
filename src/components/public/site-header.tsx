"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PublicSiteHeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

export function PublicSiteHeader({
  query,
  onQueryChange,
  onSearchSubmit,
}: PublicSiteHeaderProps) {
  const hasSearch = typeof query === "string" && onQueryChange;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/bim-dueck-logo.svg"
            alt="BIM Dueck"
            width={180}
            height={64}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-zinc-600 md:flex">
          <Link href="/" className="transition-colors hover:text-zinc-950">
            Inicio
          </Link>
          <Link href="/marketplace" className="transition-colors hover:text-zinc-950">
            Marketplace
          </Link>
          <Link href="/dashboard/obras" className="transition-colors hover:text-zinc-950">
            Gestión BIM
          </Link>
        </nav>

        {hasSearch && (
          <div className="relative hidden flex-1 lg:block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearchSubmit?.();
                }
              }}
              placeholder="Busca materiales, servicios o proveedores"
              className="h-11 rounded-full border-zinc-200 pl-9"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link href="/auth/register">
            <Button variant="outline" size="sm" className="rounded-full">
              Registrarte
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="sm" className="rounded-full">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>

      {hasSearch && (
        <div className="border-t border-zinc-100 px-4 py-3 lg:hidden">
          <div className="relative mx-auto max-w-7xl">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => onQueryChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSearchSubmit?.();
                }
              }}
              placeholder="Busca materiales, servicios o proveedores"
              className="h-11 rounded-full border-zinc-200 pl-9"
            />
          </div>
        </div>
      )}
    </header>
  );
}
