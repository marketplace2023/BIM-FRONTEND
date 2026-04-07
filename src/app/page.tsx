import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">BIM</span>
          </div>
          <span className="font-semibold text-sm">BIM Platform</span>
        </div>
        <Link href="/auth/login">
          <Button size="sm">Iniciar sesión</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-zinc-500 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Plataforma de gestión BIM + Marketplace
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 max-w-2xl">
          Gestión integral de obras y marketplace de la construcción
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl">
          Administra tus proyectos de construcción, presupuestos,
          certificaciones y contratistas — todo en un solo lugar.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button>Acceder al dashboard</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">Registrarse</Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {[
            "Obras & proyectos",
            "Presupuestos",
            "APU",
            "Certificaciones",
            "Contratistas",
            "Marketplace",
          ].map((f) => (
            <span
              key={f}
              className="rounded-full border bg-white px-3 py-1 text-xs text-zinc-600 shadow-sm"
            >
              {f}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
