import Image from "next/image";
import Link from "next/link";

export function PublicSiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-600 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Image
            src="/bim-dueck-logo.svg"
            alt="BIM Dueck"
            width={180}
            height={64}
            className="h-10 w-auto"
          />
          <p className="max-w-sm">
            Marketplace y plataforma BIM para obras, materiales, servicios y proveedores del sector construcción.
          </p>
        </div>

        <div>
          <p className="mb-3 font-medium text-zinc-950">Explorar</p>
          <div className="space-y-2">
            <Link href="/marketplace" className="block hover:text-zinc-950">Marketplace</Link>
            <Link href="/auth/register" className="block hover:text-zinc-950">Crear cuenta</Link>
            <Link href="/auth/login" className="block hover:text-zinc-950">Acceder</Link>
          </div>
        </div>

        <div>
          <p className="mb-3 font-medium text-zinc-950">Gestión BIM</p>
          <div className="space-y-2">
            <span className="block">Obras</span>
            <span className="block">Presupuestos</span>
            <span className="block">Certificaciones</span>
          </div>
        </div>

        <div>
          <p className="mb-3 font-medium text-zinc-950">Contacto</p>
          <div className="space-y-2">
            <span className="block">Argentina</span>
            <span className="block">Plataforma en desarrollo</span>
            <span className="block">info@bimdueck.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
