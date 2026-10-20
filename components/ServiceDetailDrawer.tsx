"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError, qs, type Service, type Tag } from "@/lib/api";
import { dateTime, money } from "@/lib/format";
import { Alert, Badge, Button, Drawer, Loader } from "@/components/ui";

const PAYMENT_TYPES = ["Pix", "Cartão", "Dinheiro", "Boleto", "Cortesia", "Outro"];

type ReceiptRow = {
  id: number | string;
  filename: string;
  mime_type?: string | null;
};

function toDatetimeLocal(raw?: string | null) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeServiceTags(raw: Service["tags"]): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => (typeof t === "string" ? t : String((t as { tag?: string; name?: string })?.tag || (t as { name?: string })?.name || "")))
    .filter(Boolean);
}

type Props = {
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ServiceDetailDrawer({ service, onClose, onSaved }: Props) {
  const [observations, setObservations] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [price, setPrice] = useState("");
  const [donation, setDonation] = useState("0");
  const [pricePaid, setPricePaid] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [status, setStatus] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagOpts, setTagOpts] = useState<string[]>([]);
  const [tagPick, setTagPick] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [groupServices, setGroupServices] = useState<Service[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReceipts = useCallback(async (serviceId: number) => {
    try {
      const query = qs({
        filter: JSON.stringify({ service_id: { _eq: serviceId } }),
        limit: 50,
        sort: "-id",
      });
      const links = await api.listItems<{ file_id?: number | string; id?: number }>(
        "services_files",
        query,
      );
      const rows = Array.isArray(links.data) ? links.data : [];
      const files = await Promise.all(
        rows.map(async (link) => {
          const fileId = link.file_id;
          if (!fileId) return null;
          try {
            const meta = await api.getFile(fileId);
            const f = meta.data || {};
            return {
              id: f.id ?? fileId,
              filename: f.filename || String(fileId),
              mime_type: f.mime_type || null,
            };
          } catch {
            return { id: fileId, filename: String(fileId), mime_type: null };
          }
        }),
      );
      setReceipts(files.filter(Boolean) as ReceiptRow[]);
    } catch {
      setReceipts([]);
    }
  }, []);

  useEffect(() => {
    if (!service) return;
    setObservations(service.observations || "");
    setConsultationDate(toDatetimeLocal(service.consultation_date));
    setPrice(service.price != null ? String(service.price) : "");
    setDonation(service.donation != null ? String(service.donation) : "0");
    setPricePaid(
      service.price_paid != null
        ? String(service.price_paid)
        : String(Math.max(0, (Number(service.price) || 0) - (Number(service.donation) || 0))),
    );
    setPaymentType(service.payment_type || "");
    setStatus(service.status || "");
    setTags(normalizeServiceTags(service.tags));
    setReceiptFile(null);
    setError(null);

    void (async () => {
      try {
        const [tagRes, groupRes] = await Promise.all([
          api.listTags(qs({ limit: 200, sort: "tag" })),
          service.booking_group_code
            ? api.listServicesByGroup(service.booking_group_code)
            : Promise.resolve({ data: [service] as Service[] }),
          loadReceipts(service.id),
        ]);
        const tagRows = Array.isArray(tagRes.data) ? tagRes.data : [];
        setTagOpts(
          tagRows
            .map((t: Tag) => t.tag)
            .filter((t): t is string => Boolean(t)),
        );
        setGroupServices(Array.isArray(groupRes.data) ? groupRes.data : [service]);
      } catch {
        setTagOpts([]);
        setGroupServices([service]);
      }
    })();
  }, [service, loadReceipts]);

  function syncPaid(nextPrice: string, nextDonation: string) {
    const p = Number(nextPrice) || 0;
    const d = Number(nextDonation) || 0;
    setPricePaid(String(Math.max(0, p - d)));
  }

  function addTag(name: string) {
    const t = name.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagPick("");
  }

  async function persistUpdate(extra?: Record<string, unknown>) {
    if (!service) return;
    await api.updateService(service.id, {
      observations: observations.trim() || null,
      consultation_date: consultationDate || null,
      price: price === "" ? null : Number(price),
      donation: donation === "" ? 0 : Number(donation),
      price_paid: pricePaid === "" ? null : Number(pricePaid),
      payment_type: paymentType || null,
      status: status || undefined,
      tags,
      ...extra,
    } as Parameters<typeof api.updateService>[1]);
    onSaved();
    onClose();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!service) return;
    setBusy(true);
    setError(null);
    try {
      await persistUpdate();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EVENT_DATE_CONFIRMATION_REQUIRED") {
        const okConfirm = window.confirm(
          "Este atendimento tem evento no calendário. Substituir pelo novo horário?",
        );
        if (okConfirm) {
          try {
            await persistUpdate({ replace_calendar_event: true });
            return;
          } catch (inner) {
            setError(inner instanceof ApiError ? inner.message : "Falha ao salvar");
            return;
          }
        }
      } else {
        setError(err instanceof ApiError ? err.message : "Falha ao salvar");
      }
    } finally {
      setBusy(false);
    }
  }

  async function uploadReceipt() {
    if (!service || !receiptFile) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", receiptFile);
      fd.append("filename", receiptFile.name || "comprovante");
      const up = await api.uploadFile(fd);
      const fileId = up.data?.id ?? (up.data as { file_id?: number })?.file_id;
      if (!fileId) throw new Error("Upload sem id de arquivo");
      try {
        await api.attachFileToItem(fileId, { collection: "services", item_id: service.id });
      } catch {
        await api.createItem("services_files", {
          service_id: service.id,
          file_id: fileId,
        });
      }
      await api.markServicePaid(service.id);
      setReceiptFile(null);
      await loadReceipts(service.id);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no comprovante");
    } finally {
      setBusy(false);
    }
  }

  async function markPaidOnly() {
    if (!service) return;
    setBusy(true);
    setError(null);
    try {
      await api.markServicePaid(service.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao marcar pago");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={Boolean(service)}
      onClose={onClose}
      title={service ? `Atendimento #${service.id}` : "Atendimento"}
      footer={
        <>
          <Button type="button" variant="accent" disabled={busy} onClick={() => void markPaidOnly()}>
            Marcar pago (sem arquivo)
          </Button>
          <Button type="submit" form="service-detail-form" disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      {!service ? (
        <Loader label="Carregando…" />
      ) : (
        <>
          {error ? <Alert>{error}</Alert> : null}
          <dl className="detail-list">
            <div>
              <dt>Associado</dt>
              <dd>{service.associate_name || service.associate_user_code || "—"}</dd>
            </div>
            <div>
              <dt>Profissional</dt>
              <dd>{service.professional_name || "—"}</dd>
            </div>
            <div>
              <dt>Criado</dt>
              <dd>{dateTime(service.date_created)}</dd>
            </div>
            <div>
              <dt>Valor atual</dt>
              <dd>{money(service.price_paid ?? service.price)}</dd>
            </div>
          </dl>

          {groupServices.length > 1 ? (
            <>
              <h3 style={{ fontSize: "0.9rem", margin: "0.75rem 0 0.35rem" }}>
                Grupo ({service.booking_group_code})
              </h3>
              <ul className="file-list">
                {groupServices.map((s) => (
                  <li key={s.id}>
                    #{s.id} · {s.status} · {money(s.price_paid ?? s.price)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <form id="service-detail-form" className="form-grid" onSubmit={onSubmit}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="svc-tags">Tags</label>
              <div className="page__toolbar" style={{ margin: 0 }}>
                <select
                  id="svc-tags"
                  value={tagPick}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) addTag(v);
                  }}
                >
                  <option value="">Adicionar tag…</option>
                  {tagOpts
                    .filter((o) => !tags.includes(o))
                    .map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                </select>
                <input
                  type="text"
                  placeholder="Nova tag"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagDraft);
                      setTagDraft("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    addTag(tagDraft);
                    setTagDraft("");
                  }}
                >
                  +
                </Button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                {tags.map((t) => (
                  <Badge key={t}>
                    {t}
                    <button
                      type="button"
                      className="link-btn"
                      style={{ marginLeft: "0.35rem" }}
                      onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Comprovantes</label>
              {receipts.length === 0 ? (
                <p style={{ color: "var(--dharma-muted)", margin: "0.25rem 0" }}>Nenhum anexo.</p>
              ) : (
                <ul className="file-list">
                  {receipts.map((f) => (
                    <li key={String(f.id)}>
                      <a href={api.fileDownloadPath(f.id)} target="_blank" rel="noreferrer">
                        {f.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className="page__toolbar" style={{ marginTop: "0.5rem" }}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="accent"
                  disabled={!receiptFile || busy}
                  onClick={() => void uploadReceipt()}
                >
                  Enviar e marcar pago
                </Button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="svc-obs">Observações</label>
              <textarea
                id="svc-obs"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-date">Data consulta</label>
              <input
                id="svc-date"
                type="datetime-local"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-price">Preço</label>
              <input
                id="svc-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  syncPaid(e.target.value, donation);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-donation">Doação</label>
              <input
                id="svc-donation"
                type="number"
                min="0"
                step="0.01"
                value={donation}
                onChange={(e) => {
                  setDonation(e.target.value);
                  syncPaid(price, e.target.value);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-paid">Pago</label>
              <input
                id="svc-paid"
                type="number"
                min="0"
                step="0.01"
                value={pricePaid}
                onChange={(e) => setPricePaid(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="svc-paytype">Pagamento</label>
              <select
                id="svc-paytype"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="">—</option>
                {PAYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="svc-st">Status</label>
              <select id="svc-st" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Agendado</option>
                <option>Realizado</option>
                <option>Cancelado</option>
                <option>Aguardando pagamento</option>
                <option>Pagamento concluído</option>
              </select>
            </div>
          </form>
        </>
      )}
    </Drawer>
  );
}
