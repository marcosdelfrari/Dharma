"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Associate, type UserFile } from "@/lib/api";
import { Alert, Button, Loader } from "@/components/ui";

type Props = {
  associate: Associate | null;
};

export function AssociateDocumentsPanel({ associate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!associate?.id) {
      setFiles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.listUserFiles(associate.id);
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao listar arquivos");
    } finally {
      setLoading(false);
    }
  }, [associate?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(fileList: FileList | null) {
    if (!associate?.id || !fileList?.length) return;
    setUploading(true);
    setError(null);
    setOk(null);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("filename", file.name);
        fd.append("user_id", String(associate.id));
        fd.append("doc_kind", "prescription");
        await api.uploadFile(fd);
      }
      setOk("Arquivo(s) enviado(s).");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!associate?.id) return null;

  const prescriptionId = associate.prescription;

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Documentos</h3>
      {error ? <Alert>{error}</Alert> : null}
      {ok ? <Alert tone="ok">{ok}</Alert> : null}

      {prescriptionId ? (
        <p style={{ fontSize: "0.88rem", marginBottom: "0.5rem" }}>
          Receita cadastrada:{" "}
          <a
            href={api.fileDownloadPath(prescriptionId)}
            target="_blank"
            rel="noreferrer"
          >
            abrir arquivo #{prescriptionId}
          </a>
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => void onUpload(e.target.files)}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Enviando…" : "Enviar documento"}
      </Button>

      {loading ? (
        <Loader label="Carregando arquivos…" />
      ) : files.length === 0 ? (
        <p style={{ color: "var(--dharma-muted)", fontSize: "0.88rem" }}>
          Nenhum arquivo vinculado ao associado.
        </p>
      ) : (
        <ul className="file-list">
          {files.map((f) => (
            <li key={f.id}>
              <a href={f.url || api.fileDownloadPath(f.id)} target="_blank" rel="noreferrer">
                {f.filename || `Arquivo ${f.id}`}
              </a>
              {f.doc_kind ? ` · ${f.doc_kind}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
