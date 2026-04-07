"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Store,
  Package,
  ShoppingCart,
  HardHat,
  FileText,
  Calculator,
  ClipboardList,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getUserDisplayName } from "@/lib/bim";
import { toast } from "sonner";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Marketplace",
    items: [
      { label: "Mi Tienda", href: "/dashboard/mi-tienda", icon: Store },
      {
        label: "Mis Productos",
        href: "/dashboard/mis-productos",
        icon: Package,
      },
      { label: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingCart },
    ],
  },
  {
    label: "Gestión BIM",
    items: [
      { label: "Obras", href: "/dashboard/obras", icon: Building2 },
      { label: "Contratistas", href: "/dashboard/contratistas", icon: HardHat },
      {
        label: "Presupuestos",
        href: "/dashboard/presupuestos",
        icon: FileText,
      },
      { label: "APU", href: "/dashboard/precios-unitarios", icon: Calculator },
      {
        label: "Certificaciones",
        href: "/dashboard/certificaciones",
        icon: ClipboardList,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = getUserDisplayName(user);

  function handleLogout() {
    logout();
    toast.success("Sesión cerrada");
    router.push("/auth/login");
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">BIM</span>
        </div>
        <span className="font-semibold text-sm">BIM Platform</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                        active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-zinc-600 hover:bg-zinc-100",
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />

      {/* User menu */}
      <div className="p-2">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-md hover:bg-zinc-100 transition-colors text-left"
        >
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{displayName}</p>
              <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
            </div>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-zinc-400 transition-transform",
              userMenuOpen && "rotate-180",
            )}
          />
        </button>
        {userMenuOpen && (
          <div className="mt-1 rounded-md border bg-white shadow-md overflow-hidden">
            <Link
              href="/dashboard/perfil"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => setUserMenuOpen(false)}
            >
              <User className="w-3.5 h-3.5" />
              Mi perfil
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
