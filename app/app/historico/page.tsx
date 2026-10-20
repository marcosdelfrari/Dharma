"use client";

import { useCallback, useState } from "react";
import { api, type ActivityItem, qs } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { useRemoteList } from "@/lib/useRemoteList";
import {
  Alert,
  Badge,
  DataTable,
  Loader,
  PageTitle,
  Panel,
  SearchInput,
} from "@/components/ui";

export default function HistoryPage() {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");

  const loader = useCallback(async () => {
    const res = await api.listActivity(
      qs({
        limit: 100,
        offset: 0,
        action: action || undefined,
        actor_user_code: actor.trim() || undefined,
      }),
    );
    return res.data;
  }, [action, actor]);

  // search unused — filters drive reload via deps in loader
  const { rows, loading, error } = useRemoteList(loader, `${action}|${actor}`, 200);

  return (
    <>
      <PageTitle>Histórico do sistema</PageTitle>
      <Panel>
        <div className="page__toolbar">
          <SearchInput
            placeholder="Filtrar por ação (ex: create, update)…"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <SearchInput
            placeholder="Código do ator…"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}

        {loading ? (
          <Loader label="Carregando histórico…" />
        ) : (
          <DataTable<ActivityItem>
            rows={rows}
            empty="Nenhuma atividade registrada."
            columns={[
              {
                key: "when",
                header: "Quando",
                render: (row) => dateTime(row.date_created),
              },
              {
                key: "action",
                header: "Ação",
                render: (row) => <Badge tone="accent">{row.action || "—"}</Badge>,
              },
              {
                key: "entity",
                header: "Entidade",
                render: (row) =>
                  [row.entity_type, row.entity_code || row.entity_id]
                    .filter(Boolean)
                    .join(" · ") || "—",
              },
              {
                key: "actor",
                header: "Autor",
                render: (row) => row.actor_name || row.actor_user_code || "Sistema",
              },
              {
                key: "summary",
                header: "Resumo",
                render: (row) => row.summary || "—",
              },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
