import type { Order, OrderItemLine } from "@/lib/api";
import { api } from "@/lib/api";

function itemQuantity(item: OrderItemLine) {
  return Number(item?.quantity ?? 1) || 0;
}

function itemName(item: OrderItemLine) {
  const name = String(item?.name || item?.code || "Produto").trim();
  const code = String(item?.code || item?.sku || "").trim();
  const batch = item?.batch ? String(item.batch) : "";
  return `${name}${code && code !== name ? ` - ${code}` : ""}${batch ? ` (${batch})` : ""}`;
}

function orderName(order: Order) {
  const name = order.receiver_name || order.associate_name || "—";
  const tags = Array.isArray(order.tags)
    ? order.tags.map((tag) => (typeof tag === "string" ? tag : String(tag)))
    : [];
  return tags.some((tag) => String(tag).toLowerCase() === "correio")
    ? `${name} (correio)`
    : name;
}

function dateLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("pt-BR");
}

function reportTimestamp() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function productionReportFilename() {
  return `itens_producao_${reportTimestamp().replace(/\D/g, "_")}.pdf`;
}

function parseItems(order: Order): OrderItemLine[] {
  if (Array.isArray(order.items)) return order.items;
  try {
    const p = JSON.parse(String(order.items || "[]"));
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

async function buildBasePdf(orders: Order[]) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const products = new Map<string, number>();
  const dispensationRows: unknown[] = [];

  orders.forEach((order, orderIndex) => {
    const items = parseItems(order);
    items.forEach((item) => {
      const name = itemName(item);
      products.set(name, (products.get(name) || 0) + itemQuantity(item));
    });

    if (!items.length) {
      dispensationRows.push([
        String(orderIndex + 1),
        String(order.id),
        orderName(order),
        "",
        "",
        dateLabel(order.date_created),
        "",
      ]);
    }

    items.forEach((item, itemIndex) => {
      dispensationRows.push([
        itemIndex === 0 ? String(orderIndex + 1) : "",
        itemIndex === 0 ? String(order.id) : "",
        itemIndex === 0 ? orderName(order) : "",
        item.code || item.sku || "",
        itemQuantity(item),
        itemIndex === 0 ? dateLabel(order.date_created) : "",
        item.batch || "",
      ]);
    });

    const info = order.details || order.info || order.order_notes;
    if (info) {
      dispensationRows.push([
        {
          content: `Informações: ${String(info).trim()}`,
          colSpan: 7,
          styles: { halign: "left", fontStyle: "italic", fillColor: [248, 248, 248] },
        },
      ]);
    }
  });

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Itens para Produção", 14, 14);
  doc.setFontSize(10);
  doc.text(`Data: ${reportTimestamp()}h`, 14, 22);
  autoTable(doc, {
    head: [["Produto", "Quantidade"]],
    body: [...products].map(([name, quantity]) => [name, quantity]),
    startY: 28,
    theme: "grid",
    styles: { fontSize: 10 },
  });

  doc.addPage();
  doc.setFontSize(16);
  doc.text("Registro de dispensação", doc.internal.pageSize.getWidth() / 2, 14, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.text(`Nº de pedidos: ${orders.length}`, doc.internal.pageSize.getWidth() / 2, 22, {
    align: "center",
  });
  autoTable(doc, {
    head: [
      [
        "Item",
        "Nº do Pedido",
        "Nome para entrega",
        "Código do produto",
        "Qtde",
        "Data de criação",
        "Lote dispensado",
      ],
    ],
    body: dispensationRows as string[][],
    startY: 28,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.5 },
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 30;
  const y = Math.min(finalY + 8, pageHeight - 35);
  doc.text("Observações:", 14, y);
  doc.rect(14, y + 3, pageWidth - 28, Math.max(20, pageHeight - y - 17));
  return doc;
}

async function prescriptionBytesForOrder(order: Order) {
  if (!order.user_code) return null;
  try {
    const userRes = await api.getUserByCode(order.user_code);
    const prescriptionId = (userRes.data as { prescription?: string | number })?.prescription;
    if (!prescriptionId) return null;
    const fileRes = await api.getFile(prescriptionId);
    const file = fileRes.data;
    if (!file?.id) return null;
    const response = await fetch(api.fileDownloadPath(file.id), { credentials: "include" });
    if (!response.ok) throw new Error(`Receita indisponível (${response.status})`);
    const blob = await response.blob();
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      mime: file.mime_type || blob.type || "",
      name: file.filename || "",
    };
  } catch {
    return null;
  }
}

function isPdf(file: { mime?: string; name?: string }) {
  return (
    String(file.mime || "").includes("pdf") ||
    String(file.name || "").toLowerCase().endsWith(".pdf")
  );
}

function imageKind(file: { mime?: string; name?: string }) {
  const value = `${file.mime || ""} ${file.name || ""}`.toLowerCase();
  if (value.includes("png")) return "png" as const;
  if (value.includes("jpg") || value.includes("jpeg")) return "jpg" as const;
  return null;
}

export async function exportProductionReport(
  orders: Order[],
  onProgress?: (orderId: number, message: string) => void,
) {
  const skipped: Array<{ order: Order; message: string }> = [];
  const prescriptions: Array<{ order: Order; prescription: Awaited<ReturnType<typeof prescriptionBytesForOrder>> }> =
    [];

  for (const order of orders) {
    onProgress?.(order.id, "Processando receita…");
    const prescription = await prescriptionBytesForOrder(order);
    if (!prescription) skipped.push({ order, message: "Receita indisponível" });
    prescriptions.push({ order, prescription });
    onProgress?.(order.id, "Pronto");
  }

  const base = await buildBasePdf(orders);
  const { PDFDocument } = await import("pdf-lib");
  const output = await PDFDocument.load(base.output("arraybuffer"));

  for (const { order, prescription } of prescriptions) {
    if (!prescription?.bytes) continue;
    try {
      if (isPdf(prescription)) {
        const source = await PDFDocument.load(prescription.bytes);
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
        continue;
      }
      const kind = imageKind(prescription);
      if (!kind) throw new Error("Formato de receita não suportado");
      const image =
        kind === "png"
          ? await output.embedPng(prescription.bytes)
          : await output.embedJpg(prescription.bytes);
      const page = output.addPage([595.28, 841.89]);
      page.drawText(`Receita — ${orderName(order)} — Pedido ${order.id}`, {
        x: 36,
        y: 805,
        size: 12,
      });
      const scale = Math.min(523 / image.width, 735 / image.height);
      page.drawImage(image, {
        x: (595.28 - image.width * scale) / 2,
        y: 35,
        width: image.width * scale,
        height: image.height * scale,
      });
    } catch (err) {
      skipped.push({
        order,
        message: err instanceof Error ? err.message : "Não foi possível incluir a receita",
      });
    }
  }

  const bytes = await output.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return { skipped, pdfUrl: url, filename: productionReportFilename() };
}

export function openProductionReportPdf(pdfUrl: string, filename = productionReportFilename()) {
  if (!pdfUrl) return;
  window.open(pdfUrl, "_blank", "noopener,noreferrer");
  const anchor = document.createElement("a");
  anchor.href = pdfUrl;
  anchor.download = filename;
  anchor.click();
}
