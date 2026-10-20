"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, qs, type Associate, type Professional } from "@/lib/api";
import { Alert, Button, Loader } from "@/components/ui";

function professionalLabel(p: Professional) {
  return (
    [p.name, p.last_name].filter(Boolean).join(" ").trim() ||
    p.professional_code ||
    String(p.id)
  );
}

function professionalKey(p: Professional) {
  return String(p.professional_code || p.id);
}

type Props = {
  associate: Associate;
  onReloadAssociate?: () => Promise<void>;
};

export function AssociatePrescriberPanel({ associate, onReloadAssociate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingPros, setLoadingPros] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [datePrescription, setDatePrescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoadingPros(true);
      try {
        const res = await api.listProfessionals(
          qs({ is_prescriber: "true", limit: 500, sort: "name" }),
        );
        setProfessionals(Array.isArray(res.data) ? res.data : []);
      } catch {
        setProfessionals([]);
      } finally {
        setLoadingPros(false);
      }
    })();
  }, []);

  useEffect(() => {
    const code =
      associate.prescriber_code != null ? String(associate.prescriber_code) : "";
    setDatePrescription(
      associate.date_prescription ? String(associate.date_prescription).slice(0, 10) : "",
    );
    if (code) {
      setSelectedKey(code);
      return;
    }
    if (associate.prescriber) {
      setSelectedKey(`legacy:${associate.prescriber}`);
      return;
    }
    setSelectedKey("");
  }, [associate.id, associate.prescriber, associate.prescriber_code, associate.date_prescription]);

  const filtered = professionals.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return professionalLabel(p).toLowerCase().includes(q);
  });

  const savePrescriber = useCallback(
    async (clear: boolean) => {
      setBusy(true);
      setError(null);
      setOk(null);
      try {
        let prescriber: string | null = null;
        let prescriber_code: string | null = null;
        if (!clear && selectedKey) {
          if (selectedKey.startsWith("legacy:")) {
            prescriber = selectedKey.slice("legacy:".length);
          } else {
            const pro =
              professionals.find((p) => professionalKey(p) === selectedKey) || null;
            if (pro) {
              prescriber = professionalLabel(pro);
              prescriber_code = professionalKey(pro);
            }
          }
        }
        await api.updateUser(associate.id, {
          prescriber,
          prescriber_code,
          date_prescription: datePrescription || null,
        });
        setOk(clear ? "Prescritor removido." : "Prescritor salvo.");
        await onReloadAssociate?.();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Falha ao salvar prescritor");
      } finally {
        setBusy(false);
      }
    },
    [associate.id, datePrescription, onReloadAssociate, professionals, selectedKey],
  );

  async function onUploadPrescription(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError(null);
    setOk(null);
    try {
      const file = fileList[0];
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("filename", file.name);
      fd.append("user_id", String(associate.id));
      fd.append("doc_kind", "prescription");
      await api.uploadFile(fd);
      setOk("Receita enviada.");
      await onReloadAssociate?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const legacyOption = selectedKey.startsWith("legacy:")
    ? [{ key: selectedKey, label: associate.prescriber || selectedKey.slice(7) }]
    : [];

  return (
    <div className="form-grid form-grid--2" style={{ marginTop: "0.75rem" }}>
      {error ? <Alert>{error}</Alert> : null}
      {ok ? <Alert tone="ok">{ok}</Alert> : null}

      <div className="panel-box">
        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem" }}>Prescritor</h3>
        <div className="field">
          <label htmlFor="presc-search">Buscar</label>
          <input
            id="presc-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome do prescritor…"
          />
        </div>
        <div className="field">
          <label htmlFor="presc-select">Prescritor vinculado</label>
          <select
            id="presc-select"
            value={selectedKey}
            disabled={loadingPros}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedKey(v);
              if (!v) void savePrescriber(true);
            }}
          >
            <option value="">— Nenhum —</option>
            {legacyOption.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label} (legado)
              </option>
            ))}
            {filtered.map((p) => {
              const key = professionalKey(p);
              return (
                <option key={key} value={key}>
                  {professionalLabel(p)}
                </option>
              );
            })}
          </select>
        </div>
        {loadingPros ? <Loader label="Carregando prescritores…" /> : null}
        <div className="page__actions" style={{ justifyContent: "flex-end" }}>
          <Button type="button" disabled={busy} onClick={() => void savePrescriber(false)}>
            {busy ? "Salvando…" : "Salvar prescritor"}
          </Button>
        </div>
      </div>

      <div className="panel-box">
        <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.75rem" }}>Receita</h3>
        <div className="field">
          <label htmlFor="presc-date">Data da receita</label>
          <input
            id="presc-date"
            type="date"
            value={datePrescription}
            onChange={(e) => setDatePrescription(e.target.value)}
          />
        </div>
        {associate.prescription ? (
          <p style={{ fontSize: "0.88rem" }}>
            Arquivo:{" "}
            <a
              href={api.fileDownloadPath(associate.prescription)}
              target="_blank"
              rel="noreferrer"
            >
              abrir #{associate.prescription}
            </a>
          </p>
        ) : (
          <p style={{ color: "var(--dharma-muted)", fontSize: "0.88rem" }}>
            Nenhuma receita cadastrada.
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/*,application/pdf"
          onChange={(e) => void onUploadPrescription(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Enviando…" : "Enviar receita"}
        </Button>
      </div>
    </div>
  );
}
