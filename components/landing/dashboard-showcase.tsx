import { MetricsChart } from "@/components/landing/metrics-chart";
import { RevealGroup, RevealItem } from "@/components/landing/motion";
import { SectionShell } from "@/components/landing/section-shell";

const series = [
  {
    id: "associados",
    name: "Associados",
    value: "318",
    tone: "text-dharma-lime",
    stroke: "#c3d800",
    fill: "rgba(195, 216, 0, 0.12)",
    shell:
      "border-dharma-lime/25 bg-background/60 bg-gradient-to-br from-dharma-lime/20 via-dharma-lime/10 to-transparent shadow-[inset_0_1px_0_rgba(195,216,0,0.28)]",
    points: [24, 29, 27, 36, 33, 42, 45],
  },
  {
    id: "pedidos",
    name: "Pedidos",
    value: "204",
    tone: "text-foreground",
    stroke: "#ededed",
    fill: "rgba(237, 237, 237, 0.06)",
    shell:
      "border-border bg-background/60 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
    points: [16, 19, 22, 20, 26, 29, 32],
  },
  {
    id: "servicos",
    name: "Atendimentos",
    value: "126",
    tone: "text-dharma-teal",
    stroke: "#5a9aa6",
    fill: "rgba(90, 154, 166, 0.15)",
    shell:
      "border-dharma-teal/30 bg-background/60 bg-gradient-to-br from-dharma-teal/25 via-dharma-teal/10 to-transparent shadow-[inset_0_1px_0_rgba(90,154,166,0.25)]",
    points: [10, 14, 12, 17, 16, 21, 19],
  },
];

const features = [
  {
    index: "02",
    title: "Acesso separado por papel",
    description:
      "Administrador, Acolhimento, Produção e Profissionais acessam apenas as telas liberadas para a sua função na associação.",
    points: ["Administrador", "Acolhimento", "Produção"],
  },
  {
    index: "03",
    title: "Operação em lote nos pedidos",
    description:
      "Filtre pedidos por status, gere o relatório de produção em PDF, aplique tags ou emita etiquetas Loggi e Melhor Envio de uma só vez.",
    points: ["Status em massa", "Etiquetas", "Relatório de produção"],
  },
  {
    index: "04",
    title: "Associados, pedidos, atendimentos e recepção",
    description:
      "No mesmo período, o dashboard de relatórios consolida o total de associados, o volume de pedidos na loja, os atendimentos realizados e a entrada pela recepção — sem precisar exportar planilhas para acompanhar o mês.",
    points: [
      "Visão mensal",
      "Associados",
      "Pedidos na loja",
      "Atendimentos",
    ],
    wide: true,
  },
];

export function LandingDashboardShowcase() {
  return (
    <SectionShell
      id="painel"
      title="Da triagem ao envio, uma leitura só."
      subtitle="Associados, pedidos, atendimentos e recepção reunidos no mesmo painel — para acompanhar a rotina com clareza."
      className="border-y border-border bg-surface/40"
    >
      <RevealGroup className="grid gap-4 sm:grid-cols-2">
        <RevealItem className="flex flex-col rounded-2xl border border-border bg-surface p-6 sm:col-span-2 sm:p-8 lg:col-span-1 lg:row-span-2">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            01 · Dashboard
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">
            Um painel para acompanhar os números do mês
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O crescimento da base de associados, os pedidos registrados na loja e
            os atendimentos realizados — lado a lado para leitura rápida da
            equipe.
          </p>
          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3">
            <MetricsChart
              series={series.map(({ id, stroke, fill, points }) => ({
                id,
                stroke,
                fill,
                points,
              }))}
            />
            <ul className="grid grid-cols-3 gap-2">
              {series.map((item) => (
                <li
                  key={item.id}
                  className={`min-w-0 rounded-lg border px-2.5 py-3 sm:px-3 ${item.shell}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.stroke }}
                      aria-hidden
                    />
                    <p className={`truncate text-[11px] font-medium ${item.tone}`}>
                      {item.name}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-base tabular-nums sm:text-lg">
                    {item.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">No período</p>
                </li>
              ))}
            </ul>
          </div>
        </RevealItem>

        {features.map((item) => (
          <RevealItem
            key={item.index}
            className={`flex flex-col rounded-2xl border border-border bg-surface p-6 ${
              item.wide ? "sm:col-span-2 sm:p-8" : ""
            }`}
          >
            <div
              className={
                item.wide
                  ? "flex flex-1 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
                  : "flex flex-1 flex-col"
              }
            >
              <div className={item.wide ? "min-w-0 lg:max-w-3xl" : undefined}>
                <p className="font-mono text-[11px] text-muted">{item.index}</p>
                <h3
                  className={`mt-3 font-semibold tracking-tight ${
                    item.wide ? "text-lg sm:text-xl" : "text-base"
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-2 text-muted-foreground ${
                    item.wide
                      ? "text-sm leading-7 sm:text-[15px]"
                      : "flex-1 text-sm leading-6"
                  }`}
                >
                  {item.description}
                </p>
              </div>
              <ul
                className={`flex flex-wrap gap-1.5 ${
                  item.wide ? "shrink-0 lg:max-w-md lg:justify-end" : "mt-4"
                }`}
              >
                {item.points.map((point) => (
                  <li
                    key={point}
                    className="rounded-full border border-border-subtle bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}
