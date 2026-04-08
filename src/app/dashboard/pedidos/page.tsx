"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Search, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { StatCard } from "@/components/dashboard/bim/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ordersApi, storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDateLabel, nativeSelectClassName } from "@/lib/bim";
import { getMarketplaceContext, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Order } from "@/types/marketplace";

const statusOptions = ["confirmed", "in_progress", "done", "cancelled"] as const;

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);
  const [query, setQuery] = useState("");

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const ordersQuery = useQuery({
    queryKey: ["store-orders", managedStore?.id],
    queryFn: () =>
      ordersApi
        .getStoreOrders({ limit: 100, vertical_type: context.entityType }, managedStore?.id)
        .then((response) => response.data.data),
    enabled: Boolean(managedStore?.id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStoreStatus(id, status, managedStore?.id),
    onSuccess: () => {
      toast.success("Estado del pedido actualizado");
      queryClient.invalidateQueries({ queryKey: ["store-orders", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el pedido")),
  });

  const orders = ordersQuery.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOrders = orders.filter((order) =>
    !normalizedQuery
      ? true
      : [order.order_number, order.status, order.payment_status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  );

  const totalAmount = filteredOrders.reduce(
    (acc, order) => acc + Number.parseFloat(String(order.amount_total ?? 0)),
    0,
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pedidos" }]} />
      <PageHeader
        eyebrow="Marketplace"
        title="Pedidos"
        description="Consulta los pedidos asociados a tu tienda activa y sigue su estado operativo y de pago."
        actions={
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-9"
              placeholder="Buscar por número o estado"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        }
      />

      {managedStore && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Pedidos" value={String(filteredOrders.length)} description="Pedidos visibles" icon={ShoppingCart} />
          <StatCard title="En curso" value={String(filteredOrders.filter((order) => order.status === "in_progress").length)} description="Despacho o ejecución" icon={Truck} />
          <StatCard title="Completados" value={String(filteredOrders.filter((order) => order.status === "done").length)} description="Pedidos cerrados" icon={ClipboardList} />
          <StatCard title="Valor" value={formatCurrency(totalAmount)} description="Suma de importes" icon={ShoppingCart} />
        </div>
      )}

      {!managedStore && !storesQuery.isLoading && (
        <Card>
          <CardContent className="py-14 text-center text-sm text-zinc-500">
            No se encontró una tienda gestionable para consultar pedidos.
          </CardContent>
        </Card>
      )}

      {managedStore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos de la tienda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ordersQuery.isLoading && <div className="animate-pulse h-32 rounded-xl bg-zinc-100" />}
            {!ordersQuery.isLoading && filteredOrders.length === 0 && (
              <div className="py-14 text-center text-sm text-zinc-500">
                No hay pedidos que coincidan con la búsqueda actual.
              </div>
            )}
            {filteredOrders.map((order: Order) => (
              <div key={order.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900">{order.order_number ?? `Pedido #${order.id}`}</p>
                      <Badge variant="outline">{order.status}</Badge>
                      {order.payment_status && <Badge variant="outline">Pago: {order.payment_status}</Badge>}
                    </div>
                    <p className="text-sm text-zinc-500">
                      Fecha: {formatDateLabel(order.created_at)} · Total: {formatCurrency(order.amount_total, order.currency_code ?? "USD")}
                    </p>
                    {(order.lines ?? []).length > 0 && (
                      <div className="pt-2 text-xs text-zinc-500">
                        {(order.lines ?? []).map((line) => (
                          <p key={line.id}>
                            {line.name} · {line.qty} x {formatCurrency(line.price_unit, order.currency_code ?? "USD")}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className={nativeSelectClassName}
                      value={order.status}
                      disabled={updateStatusMutation.isPending}
                      onChange={(event) =>
                        updateStatusMutation.mutate({ id: order.id, status: event.target.value })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <Link href={`/dashboard/pedidos/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Ver detalle
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
