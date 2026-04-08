"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Receipt, Truck } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/common/breadcrumbs";
import { PageHeader } from "@/components/dashboard/bim/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ordersApi, storesApi } from "@/lib/api/api";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatCurrency, formatDateLabel, nativeSelectClassName } from "@/lib/bim";
import { getMarketplaceContext, resolveManagedStore } from "@/lib/marketplace";
import { useAuthStore } from "@/lib/stores/auth-store";

const orderStatusOptions = ["confirmed", "in_progress", "done", "cancelled"] as const;
const paymentStatusOptions = ["pending_validation", "paid", "failed", "cancelled"] as const;

export default function PedidoDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const context = getMarketplaceContext(user);
  const orderId = params?.id;

  const storesQuery = useQuery({
    queryKey: ["managed-stores"],
    queryFn: () => storesApi.getAll({ limit: 100 }).then((response) => response.data.data),
    enabled: Boolean(context.tenantId),
  });

  const managedStore = resolveManagedStore(storesQuery.data ?? [], user);

  const orderQuery = useQuery({
    queryKey: ["store-order", orderId, managedStore?.id],
    queryFn: () => ordersApi.getStoreById(orderId!, managedStore?.id).then((response) => response.data),
    enabled: Boolean(orderId && managedStore?.id),
  });

  const order = orderQuery.data;

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStoreStatus(orderId!, status, managedStore?.id),
    onSuccess: () => {
      toast.success("Estado del pedido actualizado");
      queryClient.invalidateQueries({ queryKey: ["store-order", orderId, managedStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["store-orders", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el estado")),
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentStatus: string) =>
      ordersApi.updatePaymentStatus(orderId!, paymentStatus, managedStore?.id),
    onSuccess: () => {
      toast.success("Estado de pago actualizado");
      queryClient.invalidateQueries({ queryKey: ["store-order", orderId, managedStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["store-orders", managedStore?.id] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el pago")),
  });

  if (orderQuery.isLoading || storesQuery.isLoading) {
    return <div className="animate-pulse h-48 rounded-2xl bg-zinc-100" />;
  }

  if (!managedStore || orderQuery.isError || !order) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pedidos", href: "/dashboard/pedidos" }, { label: "Detalle" }]} />
        <p className="text-sm text-red-500">No se pudo cargar el pedido solicitado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pedidos", href: "/dashboard/pedidos" }, { label: order.order_number ?? `#${order.id}` }]} />
      <PageHeader
        eyebrow="Marketplace"
        title={order.order_number ?? `Pedido #${order.id}`}
        description="Consulta líneas, estados y trazabilidad de pago del pedido seleccionado."
        actions={
          <Link href="/dashboard/pedidos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{order.status}</Badge>
                {order.payment_status && <Badge variant="outline">Pago: {order.payment_status}</Badge>}
              </div>
              <p>Creado: {formatDateLabel(order.created_at)}</p>
              <p>Total: {formatCurrency(order.amount_total, order.currency_code ?? "USD")}</p>
              <p>Base imponible: {formatCurrency(order.amount_untaxed, order.currency_code ?? "USD")}</p>
              <p>Impuestos: {formatCurrency(order.amount_tax, order.currency_code ?? "USD")}</p>
              {order.payment_reference && <p>Referencia: {order.payment_reference}</p>}
              {order.validated_at && <p>Validado: {formatDateLabel(order.validated_at)}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones de tienda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="order-status">Estado operativo</Label>
                <select
                  id="order-status"
                  className={nativeSelectClassName}
                  value={order.status}
                  onChange={(event) => statusMutation.mutate(event.target.value)}
                  disabled={statusMutation.isPending}
                >
                  {orderStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="payment-status">Estado de pago</Label>
                <select
                  id="payment-status"
                  className={nativeSelectClassName}
                  value={order.payment_status ?? "pending_validation"}
                  onChange={(event) => paymentMutation.mutate(event.target.value)}
                  disabled={paymentMutation.isPending}
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              {order.payment_notes ? <p>{order.payment_notes}</p> : <p>Sin notas de pago.</p>}
              {order.payment_proof_url ? (
                <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                  Ver comprobante
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p>Sin comprobante adjunto.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Líneas del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(order.lines ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">Este pedido no tiene líneas visibles.</p>
            )}
            {(order.lines ?? []).map((line) => (
              <div key={line.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{line.name}</p>
                    <p className="text-sm text-zinc-500">
                      {line.qty} x {formatCurrency(line.price_unit, order.currency_code ?? "USD")}
                    </p>
                  </div>
                  <div className="text-right text-sm font-medium text-zinc-900">
                    {formatCurrency(line.subtotal, order.currency_code ?? "USD")}
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border bg-zinc-50 p-4">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span className="inline-flex items-center gap-2 font-medium text-zinc-900">
                  <Receipt className="h-4 w-4" />
                  Total pedido
                </span>
                <span className="font-semibold text-zinc-950">
                  {formatCurrency(order.amount_total, order.currency_code ?? "USD")}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  Estado: {order.status}
                </span>
                <span>Pago: {order.payment_status ?? "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
