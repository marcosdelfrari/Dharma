"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  api,
  ApiError,
  type Associate,
  type CreateOrderBody,
  type CustomPaymentLine,
  type FreightOption,
  type InstitutionalClient,
  type Order,
  type OrderItemLine,
  type Product,
  qs,
} from "@/lib/api";
import {
  addressFromInstitutionalClient,
  institutionalContactEmail,
  institutionalDisplayName,
  institutionalContactPhone,
  institutionalReceiverName,
  isInstitutionalCompany,
} from "@/lib/institutional";
import { fullAssociateName, money } from "@/lib/format";
import { PATHS } from "@/lib/menu";
import { Alert, Button, Loader, PageTitle, Panel, SearchInput } from "@/components/ui";

type CartLine = OrderItemLine & { key: string };

function addressFromAssociate(row: Associate | null) {
  if (!row) return null;
  const cep = String(row.cep || "").replace(/\D/g, "");
  if (cep.length < 8) return null;
  return {
    street: row.street || "",
    number: row.street_number || "",
    neighborhood: row.neighborhood || "",
    city: row.city || "",
    state: row.state || "",
    cep,
  };
}

function parseCustomPayment(raw: Order["custom_payment"]): CustomPaymentLine[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CustomPaymentLine[];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function NewOrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingOrderId = Number(searchParams.get("edit") || "") || null;
  const presetUserCode = searchParams.get("user_code") || "";
  const presetIcCode = searchParams.get("ic") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [associateQuery, setAssociateQuery] = useState("");
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [selected, setSelected] = useState<Associate | null>(null);
  const [institutionalClient, setInstitutionalClient] = useState<InstitutionalClient | null>(
    null,
  );
  const [institutionalResults, setInstitutionalResults] = useState<InstitutionalClient[]>([]);
  const [loadingOwner, setLoadingOwner] = useState(
    Boolean(presetUserCode.trim() || presetIcCode.trim()),
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [delivery, setDelivery] = useState("0");
  const [applyFreightToTotal, setApplyFreightToTotal] = useState(true);
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [freightLoading, setFreightLoading] = useState(false);
  const [freightQuoteEnabled, setFreightQuoteEnabled] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  });
  const [donation, setDonation] = useState("0");
  const [customPayment, setCustomPayment] = useState<CustomPaymentLine[]>([]);
  const [customDraft, setCustomDraft] = useState({ item: "", qnt: "1", value: "0" });
  const [info, setInfo] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [orderTags, setOrderTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        setLoadingProducts(true);
        try {
          const res = await api.listProducts(
            qs({
              limit: 40,
              sort: "name",
              search: productSearch.trim() || undefined,
              "filter[status][_eq]": "published",
            }),
          );
          setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Falha ao carregar produtos");
        } finally {
          setLoadingProducts(false);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    const q = associateQuery.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.searchUsers(q);
          setAssociates(Array.isArray(res.data) ? res.data : []);
        } catch {
          setAssociates([]);
        }
      })();
    }, 280);
    return () => clearTimeout(t);
  }, [associateQuery]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.freightQuoteAvailability();
        const data = res.data;
        setFreightQuoteEnabled(Boolean(data?.loggi || data?.melhorenvio));
      } catch {
        setFreightQuoteEnabled(false);
      }
    })();
  }, []);

  useEffect(() => {
    const fromAssociate = addressFromAssociate(selected);
    const fromIc = addressFromInstitutionalClient(institutionalClient);
    const from = fromAssociate || fromIc;
    if (from) setAddress((prev) => ({ ...from, number: prev.number || from.number }));
  }, [selected, institutionalClient]);

  useEffect(() => {
    if (!editingOrderId) return;
    void (async () => {
      setLoadingOrder(true);
      setError(null);
      try {
        const res = await api.getOrder(editingOrderId);
        const o = res.data;
        if (o.institutional_client_code || o.institutional_client_id) {
          setSelected(null);
          try {
            if (o.institutional_client_code) {
              const icRes = await api.getInstitutionalClientByCode(o.institutional_client_code);
              setInstitutionalClient(icRes.data);
            } else if (o.institutional_client_id) {
              const icRes = await api.getInstitutionalClient(o.institutional_client_id);
              setInstitutionalClient(icRes.data);
            }
          } catch {
            /* optional */
          }
        } else if (o.user_code) {
          try {
            const userRes = await api.getUserByCode(o.user_code);
            setSelected(userRes.data);
            setInstitutionalClient(null);
          } catch {
            /* optional */
          }
        }
        const lines = Array.isArray(o.items)
          ? o.items
          : (() => {
              try {
                const p = JSON.parse(String(o.items || "[]"));
                return Array.isArray(p) ? p : [];
              } catch {
                return [];
              }
            })();
        setCart(
          lines.map((line, idx) => ({
            ...line,
            key: `${line.sku || idx}-${idx}`,
            quantity: line.quantity || 1,
            amount: Number(line.amount) || 0,
          })),
        );
        setDiscount(String(o.discount ?? 0));
        setDonation(String(o.donation ?? 0));
        setDelivery(String(o.delivery_price ?? 0));
        setCustomPayment(parseCustomPayment(o.custom_payment));
        setSelectedFreight(o.freight_option || null);
        setInfo(o.info || o.order_notes || o.details || "");
        if (Array.isArray(o.tags)) {
          setOrderTags(
            o.tags.map((t) => (typeof t === "string" ? t : String(t))).filter(Boolean),
          );
        }
        const addr = o.address as typeof address | null;
        if (addr && typeof addr === "object") {
          setAddress({
            street: String(addr.street || ""),
            number: String(addr.number || ""),
            neighborhood: String(addr.neighborhood || ""),
            city: String(addr.city || ""),
            state: String(addr.state || ""),
            cep: String(addr.cep || ""),
          });
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Falha ao carregar pedido");
      } finally {
        setLoadingOrder(false);
      }
    })();
  }, [editingOrderId]);

  useEffect(() => {
    const ic = presetIcCode.trim();
    const code = presetUserCode.trim();
    if (editingOrderId || (!ic && !code)) {
      if (!ic && !code) setLoadingOwner(false);
      return;
    }
    void (async () => {
      setLoadingOwner(true);
      setError(null);
      try {
        if (ic) {
          const res = await api.getInstitutionalClientByCode(ic);
          setInstitutionalClient(res.data);
          setSelected(null);
          const addr = addressFromInstitutionalClient(res.data);
          if (addr) setAddress(addr);
        } else {
          const res = await api.getUserByCode(code);
          setSelected(res.data);
          setInstitutionalClient(null);
          const addr = addressFromAssociate(res.data);
          if (addr) setAddress(addr);
        }
      } catch {
        setError(
          ic
            ? `Cliente institucional ${ic} não encontrado.`
            : "Associado não encontrado para user_code informado.",
        );
      } finally {
        setLoadingOwner(false);
      }
    })();
  }, [presetUserCode, presetIcCode, editingOrderId]);

  useEffect(() => {
    const q = associateQuery.trim();
    if (q.length < 2) {
      setInstitutionalResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.listInstitutionalClients(
            qs({ search: q, limit: 8, sort: "-id" }),
          );
          setInstitutionalResults(Array.isArray(res.data) ? res.data : []);
        } catch {
          setInstitutionalResults([]);
        }
      })();
    }, 280);
    return () => clearTimeout(t);
  }, [associateQuery]);

  const associateResults =
    associateQuery.trim().length < 2 ? [] : associates;

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.amount * line.quantity, 0),
    [cart],
  );
  const discountN = Number(discount) || 0;
  const donationN = Number(donation) || 0;
  const customSum = customPayment.reduce((s, r) => s + (Number(r.value) || 0), 0);
  const quotedFreight = selectedFreight?.price ?? (Number(delivery) || 0);
  const deliveryN = applyFreightToTotal ? quotedFreight : 0;
  const total = Math.max(0, subtotal + deliveryN - discountN - donationN - customSum);

  function addCustomPayment() {
    if (!customDraft.item.trim() || !(Number(customDraft.value) > 0)) return;
    setCustomPayment((prev) => [
      ...prev,
      {
        item: customDraft.item.trim(),
        qnt: Number(customDraft.qnt) || 1,
        value: Number(customDraft.value) || 0,
      },
    ]);
    setCustomDraft({ item: "", qnt: "1", value: "0" });
  }

  async function quoteFreight() {
    const cep = address.cep.replace(/\D/g, "");
    if (cep.length < 8) {
      setError("Informe um CEP válido para cotar frete.");
      return;
    }
    setFreightLoading(true);
    setError(null);
    try {
      const res = await api.freightQuote({
        address: { ...address, cep },
        items: cart.map(({ sku, code, name, amount, quantity, batch }) => ({
          sku,
          code,
          name,
          amount,
          quantity,
          batch,
        })),
      });
      const options = res.data?.options || [];
      setFreightOptions(options);
      setApplyFreightToTotal(res.data?.apply_to_total !== false);
      const selKey = res.data?.selected_option_key;
      const sel =
        options.find((o) => o.option_key === selKey) || options[0] || null;
      setSelectedFreight(sel);
      if (sel?.price != null) setDelivery(String(sel.price));
    } catch (err) {
      setFreightOptions([]);
      setSelectedFreight(null);
      setError(err instanceof ApiError ? err.message : "Falha ao cotar frete");
    } finally {
      setFreightLoading(false);
    }
  }

  function addProduct(product: Product) {
    const sku = product.sku || String(product.id);
    setCart((prev) => {
      const existing = prev.find((line) => line.sku === sku);
      if (existing) {
        return prev.map((line) =>
          line.sku === sku ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          key: `${sku}-${Date.now()}`,
          sku,
          code: sku,
          name: product.name || sku,
          amount: Number(product.price) || 0,
          quantity: 1,
          batch: product.batch || undefined,
        },
      ];
    });
  }

  function updateQty(key: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((line) => (line.key === key ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const isIc = Boolean(institutionalClient?.id && institutionalClient.client_code);
    if (!isIc && !selected?.user_code) {
      setError("Selecione um associado ou cliente institucional.");
      return;
    }
    if (!cart.length) {
      setError("Adicione ao menos um produto.");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(null);
    const cep = address.cep.replace(/\D/g, "");
    try {
      const shared = {
        items: cart.map(({ sku, code, name, amount, quantity, batch }) => ({
          sku,
          code,
          name,
          amount,
          quantity,
          batch,
        })),
        total,
        delivery_price: deliveryN,
        discount: discountN,
        donation: donationN,
        custom_payment: customPayment.length ? customPayment : undefined,
        tags: orderTags.length ? orderTags : undefined,
        freight_carrier: selectedFreight?.provider || null,
        freight_option: selectedFreight,
        address:
          cep.length >= 8 && address.street && address.city
            ? {
                street: address.street,
                number: address.number || undefined,
                neighborhood: address.neighborhood || address.street,
                city: address.city,
                state: address.state,
                cep,
              }
            : undefined,
        status: "Aguardando pagamento",
        info: info.trim() || undefined,
      };

      const body: CreateOrderBody = isIc
        ? {
            ...shared,
            institutional_client_id: institutionalClient!.id,
            institutional_client_code: institutionalClient!.client_code,
            associate_name: institutionalDisplayName(institutionalClient!),
            name_associate: institutionalDisplayName(institutionalClient!),
            receiver_name: institutionalReceiverName(institutionalClient!),
            email: institutionalContactEmail(institutionalClient!),
          }
        : {
            ...shared,
            user_code: selected!.user_code!,
            associate_name: fullAssociateName(selected!),
            receiver_name: fullAssociateName(selected!),
            email: selected!.email_account || undefined,
          };

      const res = editingOrderId
        ? await api.updateOrder(editingOrderId, body)
        : await api.createOrder(body);
      setOk(`Pedido #${res.data.id} ${editingOrderId ? "atualizado" : "criado"}.`);
      setCart([]);
      setTimeout(() => router.push(PATHS.orders), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o pedido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle>{editingOrderId ? `Editar pedido #${editingOrderId}` : "Novo pedido"}</PageTitle>
      {loadingOrder || loadingOwner ? (
        <Loader label={loadingOrder ? "Carregando pedido…" : "Carregando cliente…"} />
      ) : null}
      <form onSubmit={onSubmit}>
        <div className="cart">
          <Panel>
            <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>
              Associado / cliente institucional
            </h2>
            {institutionalClient ? (
              <div className="page__toolbar">
                <div>
                  <strong>{institutionalDisplayName(institutionalClient)}</strong>
                  <div style={{ color: "var(--dharma-muted)", fontSize: "0.88rem" }}>
                    Cliente institucional · {institutionalClient.client_code || "—"}
                    {isInstitutionalCompany(institutionalClient)
                      ? ` · ${institutionalReceiverName(institutionalClient)}`
                      : ""}
                  </div>
                  <div style={{ color: "var(--dharma-muted)", fontSize: "0.88rem" }}>
                    {institutionalContactEmail(institutionalClient) || "sem e-mail"}
                    {institutionalContactPhone(institutionalClient)
                      ? ` · ${institutionalContactPhone(institutionalClient)}`
                      : ""}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--dharma-muted)", margin: "0.35rem 0 0" }}>
                    Cliente institucional — prescrição não exigida.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setInstitutionalClient(null);
                    setAssociateQuery("");
                  }}
                  disabled={Boolean(presetIcCode.trim() && !editingOrderId)}
                >
                  Trocar
                </Button>
              </div>
            ) : selected ? (
              <div className="page__toolbar">
                <div>
                  <strong>{fullAssociateName(selected)}</strong>
                  <div style={{ color: "var(--dharma-muted)", fontSize: "0.88rem" }}>
                    {selected.user_code} · {selected.email_account || "sem e-mail"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelected(null);
                    setAssociateQuery("");
                  }}
                  disabled={Boolean(presetUserCode.trim() && !editingOrderId)}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <>
                <SearchInput
                  placeholder="Buscar associado ou empresa (mín. 2 letras)…"
                  value={associateQuery}
                  onChange={(e) => setAssociateQuery(e.target.value)}
                />
                {institutionalResults.length > 0 ? (
                  <>
                    <h3 style={{ fontSize: "0.9rem", margin: "0.75rem 0 0.35rem" }}>
                      Clientes institucionais
                    </h3>
                    <div className="table-wrap">
                      <table className="table">
                        <tbody>
                          {institutionalResults.map((row) => (
                            <tr key={`ic-${row.id}`}>
                              <td>{row.client_code || "—"}</td>
                              <td>{institutionalDisplayName(row)}</td>
                              <td>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setInstitutionalClient(row);
                                    setSelected(null);
                                    const addr = addressFromInstitutionalClient(row);
                                    if (addr) setAddress(addr);
                                  }}
                                >
                                  Selecionar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
                {associateResults.length > 0 ? (
                  <>
                    <h3 style={{ fontSize: "0.9rem", margin: "0.75rem 0 0.35rem" }}>
                      Associados
                    </h3>
                    <div className="table-wrap">
                      <table className="table">
                        <tbody>
                          {associateResults.slice(0, 8).map((row) => (
                            <tr key={row.id}>
                              <td>{row.user_code}</td>
                              <td>{fullAssociateName(row)}</td>
                              <td>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelected(row);
                                    setInstitutionalClient(null);
                                    const addr = addressFromAssociate(row);
                                    if (addr) setAddress(addr);
                                  }}
                                >
                                  Selecionar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </>
            )}

            <h2 style={{ margin: "1.25rem 0 0.85rem", fontSize: "1.05rem" }}>Produtos</h2>
            <SearchInput
              placeholder="Buscar produto…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {loadingProducts ? (
              <Loader label="Carregando catálogo…" />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nome</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku || "—"}</td>
                        <td>{product.name}</td>
                        <td>{money(product.price)}</td>
                        <td>{product.amount ?? 0}</td>
                        <td>
                          <Button type="button" variant="ghost" onClick={() => addProduct(product)}>
                            Adicionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel>
            <h2 style={{ marginBottom: "0.85rem", fontSize: "1.05rem" }}>Carrinho</h2>
            {error ? <Alert>{error}</Alert> : null}
            {ok ? <Alert tone="ok">{ok}</Alert> : null}

            {!cart.length ? (
              <p style={{ color: "var(--dharma-muted)" }}>Nenhum item ainda.</p>
            ) : (
              cart.map((line) => (
                <div className="cart__line" key={line.key}>
                  <div>
                    <strong>{line.name}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--dharma-muted)" }}>
                      {money(line.amount)} · {line.sku}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    style={{ width: "4.5rem" }}
                    onChange={(e) => updateQty(line.key, Number(e.target.value) || 1)}
                  />
                  <strong>{money(line.amount * line.quantity)}</strong>
                </div>
              ))
            )}

            <h2 style={{ margin: "1rem 0 0.65rem", fontSize: "1.05rem" }}>Entrega</h2>
            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="cep">CEP</label>
                <input
                  id="cep"
                  value={address.cep}
                  onChange={(e) => setAddress((a) => ({ ...a, cep: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="city">Cidade / UF</label>
                <input
                  id="city"
                  value={`${address.city}${address.state ? ` / ${address.state}` : ""}`}
                  onChange={(e) => {
                    const [city, state] = e.target.value.split("/").map((s) => s.trim());
                    setAddress((a) => ({
                      ...a,
                      city: city || "",
                      state: state || a.state,
                    }));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="street">Rua</label>
                <input
                  id="street"
                  value={address.street}
                  onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="number">Número</label>
                <input
                  id="number"
                  value={address.number}
                  onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))}
                />
              </div>
            </div>
            {freightQuoteEnabled ? (
              <div className="page__toolbar" style={{ marginTop: "0.65rem" }}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={freightLoading || !cart.length}
                  onClick={() => void quoteFreight()}
                >
                  {freightLoading ? "Calculando…" : "Calcular frete"}
                </Button>
                {freightOptions.length > 0 ? (
                  <select
                    value={selectedFreight?.option_key || ""}
                    onChange={(e) => {
                      const opt =
                        freightOptions.find((o) => o.option_key === e.target.value) ||
                        null;
                      setSelectedFreight(opt);
                      if (opt?.price != null) setDelivery(String(opt.price));
                    }}
                  >
                    {freightOptions.map((o) => (
                      <option key={o.option_key || o.label} value={o.option_key || ""}>
                        {o.label || o.provider} — {money(o.price)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : null}

            <div className="form-grid form-grid--2" style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="delivery">Frete (manual)</label>
                <input
                  id="delivery"
                  type="number"
                  min="0"
                  step="0.01"
                  value={delivery}
                  onChange={(e) => {
                    setDelivery(e.target.value);
                    setSelectedFreight(null);
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="discount">Desconto</label>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="donation">Doação</label>
                <input
                  id="donation"
                  type="number"
                  min="0"
                  step="0.01"
                  value={donation}
                  onChange={(e) => setDonation(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: "0.85rem" }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                Pagamento personalizado (troca)
              </h3>
              <div className="form-grid form-grid--2">
                <div className="field">
                  <label htmlFor="cp-item">Item</label>
                  <input
                    id="cp-item"
                    value={customDraft.item}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, item: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-qnt">Qtd</label>
                  <input
                    id="cp-qnt"
                    type="number"
                    min="1"
                    value={customDraft.qnt}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, qnt: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cp-value">Valor a descontar</label>
                  <input
                    id="cp-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={customDraft.value}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, value: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={addCustomPayment}>
                Adicionar linha
              </Button>
              {customPayment.length > 0 ? (
                <ul className="file-list">
                  {customPayment.map((pay, idx) => (
                    <li key={`${pay.item}-${idx}`}>
                      {pay.item} · qtd {pay.qnt} · {money(pay.value)}{" "}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() =>
                          setCustomPayment((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="field" style={{ marginTop: "0.85rem" }}>
              <label htmlFor="tags">Tags do pedido</label>
              <div className="page__toolbar">
                <input
                  id="tags"
                  value={tagInput}
                  placeholder="Ex.: correio, urgente"
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = tagInput.trim();
                      if (t && !orderTags.includes(t)) setOrderTags((prev) => [...prev, t]);
                      setTagInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const t = tagInput.trim();
                    if (t && !orderTags.includes(t)) setOrderTags((prev) => [...prev, t]);
                    setTagInput("");
                  }}
                >
                  Adicionar
                </Button>
              </div>
              {orderTags.length ? (
                <div className="facet-chips">
                  {orderTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="facet-chips__chip is-active"
                      onClick={() => setOrderTags((prev) => prev.filter((x) => x !== tag))}
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="field" style={{ marginTop: "0.85rem" }}>
              <label htmlFor="info">Observações</label>
              <textarea
                id="info"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
              />
            </div>

            <div className="cart__totals">
              <div>Subtotal: {money(subtotal)}</div>
              <div>Frete: {money(deliveryN)}</div>
              <div>Desconto: {money(discountN)}</div>
              <div>Doação: {money(donationN)}</div>
              <div>Trocas: {money(customSum)}</div>
              <div style={{ fontSize: "1.15rem" }}>Total: {money(total)}</div>
            </div>

            <div className="page__actions" style={{ marginTop: "1rem" }}>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Salvando…" : editingOrderId ? "Salvar pedido" : "Criar pedido"}
              </Button>
            </div>
          </Panel>
        </div>
      </form>
    </>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<Loader label="Carregando…" />}>
      <NewOrderPageInner />
    </Suspense>
  );
}
