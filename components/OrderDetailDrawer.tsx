"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type FreightAddress,
  type Order,
  type OrderItemLine,
  type OrderTracking,
} from "@/lib/api";
import { shouldOfferFreightRecalc } from "@/lib/freight-recalc";
import { dateTime, money } from "@/lib/format";
import { PATHS } from "@/lib/menu";
import { Alert, Button, Drawer, Loader } from "@/components/ui";
import { FreightRecalcModal } from "@/components/FreightRecalcModal";
import { OrderPaymentModal } from "@/components/OrderPaymentModal";

function parseAddress(raw: unknown): FreightAddress {
  if (!raw || typeof raw !== "object") {
    return { street: "", number: "", neighborhood: "", city: "", state: "", cep: "" };
  }
  const a = raw as Record<string, unknown>;
  return {
    street: String(a.street || ""),
    number: String(a.number || a.street_number || ""),
    neighborhood: String(a.neighborhood || ""),
    city: String(a.city || ""),
    state: String(a.state || ""),
    cep: String(a.cep || ""),
  };
}

function parseItems(items?: Order["items"]): OrderItemLine[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try {
    const parsed = JSON.parse(String(items));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Props = {
  order: Order | null;
  loading: boolean;
  statuses: string[];
  pagarmeEnabled: boolean;
  busy: boolean;
  onClose: () => void;
  onChangeStatus: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onOrderUpdated?: (order: Order) => void;
};

export function OrderDetailDrawer({
  order,
  loading,
  statuses,
  pagarmeEnabled,
  busy,
  onClose,
  onChangeStatus,
  onDelete,
  onRefresh,
  onOrderUpdated,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState<FreightAddress>(() => parseAddress(null));
  const [addressBusy, setAddressBusy] = useState(false);
  const [freightAssist, setFreightAssist] = useState<{
    previous: FreightAddress;
    next: FreightAddress;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const items = parseItems(order?.items);
  const files = order?.files || [];

  useEffect(() => {
    if (order) setAddress(parseAddress(order.address));
  }, [order]);

  async function saveAddress() {
    if (!order) return;
    const previous = parseAddress(order.address);
    const next = { ...address, cep: address.cep.replace(/\D/g, "") };
    setAddressBusy(true);
    setLocalErr(null);
    try {
      const res = await api.updateOrder(order.id, { address: next });
      onOrderUpdated?.(res.data);
      setLocalMsg("Endereço atualizado.");
      if (shouldOfferFreightRecalc(order, previous, next)) {
        setFreightAssist({ previous, next });
      } else {
        await onRefresh();
      }
    } catch (err) {
      setLocalErr(err instanceof ApiError ? err.message : "Falha ao salvar endereço");
    } finally {
      setAddressBusy(false);
    }
  }

  async function loadTracking() {
    if (!order) return;
    setTrackingLoading(true);
    setLocalErr(null);
    try {
      const res = await api.getOrderTracking(order.id);
      setTracking(res.data);
    } catch (err) {
      setTracking(null);
      setLocalErr(err instanceof ApiError ? err.message : "Falha ao rastrear");
    } finally {
      setTrackingLoading(false);
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!order || !fileList?.length) return;
    setUploading(true);
    setLocalErr(null);
    setLocalMsg(null);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("filename", file.name);
        const uploaded = await api.uploadFile(fd);
        const fileId = uploaded.data?.id;
        if (!fileId) throw new Error("Upload sem id de arquivo");
        const attached = await api.attachOrderFile(order.id, {
          file_id: fileId,
          confirm_payment: true,
        });
        if (attached.data?.payment_confirmed) {
          setLocalMsg("Comprovante anexado — pagamento confirmado.");
        } else {
          setLocalMsg("Comprovante anexado.");
        }
      }
      await onRefresh();
    } catch (err) {
      setLocalErr(err instanceof ApiError ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <Drawer
        open={Boolean(order)}
        onClose={onClose}
        title={order ? `Pedido #${order.id}` : "Pedido"}
        footer={
          <>
            <Link href={`${PATHS.newOrder}?edit=${order?.id ?? ""}`}>
              <Button type="button" variant="ghost" disabled={!order}>
                Editar no carrinho
              </Button>
            </Link>
            <Button type="button" variant="danger" disabled={busy} onClick={() => void onDelete()}>
              Excluir
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </>
        }
      >
        {loading || !order ? (
          <Loader label="Carregando pedido…" />
        ) : (
          <>
            {localErr ? <Alert>{localErr}</Alert> : null}
            {localMsg ? <Alert tone="ok">{localMsg}</Alert> : null}

            <dl className="detail-list">
              <div>
                <dt>Associado</dt>
                <dd>
                  {order.associate_name || order.receiver_name || order.user_code || "—"}
                </dd>
              </div>
              <div>
                <dt>Criado</dt>
                <dd>{dateTime(order.date_created)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
              <div>
                <dt>Frete / desconto / doação</dt>
                <dd>
                  {money(order.delivery_price)} / {money(order.discount)} /{" "}
                  {money(order.donation)}
                </dd>
              </div>
              <div>
                <dt>Transportadora</dt>
                <dd>{order.freight_carrier || order.freight_option?.provider || "—"}</dd>
              </div>
              <div>
                <dt>Pagamento</dt>
                <dd>{order.payment_method || "—"}</dd>
              </div>
              <div>
                <dt>Rastreio</dt>
                <dd>{order.display_tracking_code || order.tracking_code || "—"}</dd>
              </div>
              <div>
                <dt>Observações</dt>
                <dd>{order.order_notes || order.details || order.info || "—"}</dd>
              </div>
            </dl>

            <h3 style={{ margin: "0.85rem 0 0.5rem", fontSize: "0.95rem" }}>Endereço</h3>
            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="od-cep">CEP</label>
                <input
                  id="od-cep"
                  value={address.cep}
                  onChange={(e) => setAddress((a) => ({ ...a, cep: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="od-city">Cidade</label>
                <input
                  id="od-city"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="od-street">Rua</label>
                <input
                  id="od-street"
                  value={address.street}
                  onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="od-num">Número</label>
                <input
                  id="od-num"
                  value={address.number}
                  onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={addressBusy || busy}
              onClick={() => void saveAddress()}
            >
              {addressBusy ? "Salvando…" : "Salvar endereço"}
            </Button>

            <div className="page__toolbar" style={{ margin: "0.75rem 0" }}>
              {pagarmeEnabled ? (
                <Button type="button" variant="accent" onClick={() => setPaymentOpen(true)}>
                  Pagar.me
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                disabled={trackingLoading}
                onClick={() => void loadTracking()}
              >
                {trackingLoading ? "Rastreando…" : "Atualizar rastreio"}
              </Button>
            </div>

            {tracking ? (
              <div className="tracking-box">
                {tracking.message ? <p>{tracking.message}</p> : null}
                {tracking.tracking_code ? (
                  <p>
                    Código: <strong>{tracking.tracking_code}</strong>
                  </p>
                ) : null}
                {tracking.tracking_url ? (
                  <p>
                    <a href={tracking.tracking_url} target="_blank" rel="noreferrer">
                      Abrir rastreio
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}

            <h3 style={{ margin: "0.85rem 0 0.5rem", fontSize: "0.95rem" }}>
              Comprovantes
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Enviando…" : "Enviar comprovante"}
            </Button>
            {!files.length ? (
              <p style={{ color: "var(--dharma-muted)", fontSize: "0.9rem" }}>
                Nenhum arquivo anexado.
              </p>
            ) : (
              <ul className="file-list">
                {files.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.url || api.fileDownloadPath(f.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.filename || `Arquivo ${f.id}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <div className="field" style={{ margin: "1rem 0" }}>
              <label htmlFor="order-status">Status</label>
              <select
                id="order-status"
                value={order.status || ""}
                disabled={busy}
                onChange={(e) => void onChangeStatus(e.target.value)}
              >
                {!statuses.includes(order.status || "") && order.status ? (
                  <option value={order.status}>{order.status}</option>
                ) : null}
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--dharma-muted)" }}>
                Com split SouCannabis, use Pagar.me ou comprovante para marcar pago.
              </small>
            </div>

            <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>Itens</h3>
            {!items.length ? (
              <p style={{ color: "var(--dharma-muted)" }}>Sem itens.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nome</th>
                      <th>Qtd</th>
                      <th>Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.sku || item.name}-${idx}`}>
                        <td>{item.sku || item.code || "—"}</td>
                        <td>{item.name || "—"}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Drawer>

      <OrderPaymentModal
        open={paymentOpen}
        order={order}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => void onRefresh()}
      />

      <FreightRecalcModal
        open={Boolean(freightAssist && order)}
        order={order}
        previousAddress={freightAssist?.previous || null}
        newAddress={freightAssist?.next || { cep: "" }}
        onClose={() => setFreightAssist(null)}
        onUpdated={(updated) => {
          onOrderUpdated?.(updated);
          setFreightAssist(null);
          void onRefresh();
        }}
      />
    </>
  );
}
