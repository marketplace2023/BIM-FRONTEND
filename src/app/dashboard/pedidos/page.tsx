export default function PedidosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold mb-2">Pedidos</h1>
      <p className="text-sm text-zinc-500">
        El backend actual todavía no expone el módulo de pedidos dentro de `AppModule`, así que esta vista queda lista para la siguiente fase de Marketplace.
      </p>
      <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-600">
        Cuando el módulo se habilite, aquí podremos conectar:
        <br />
        `GET /orders`
        <br />
        `GET /orders/store`
        <br />
        `PATCH /orders/:id/status`
      </div>
    </div>
  );
}
