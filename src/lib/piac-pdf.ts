import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PiacData } from "@/types/piac";
import {
  buildIdentificacionRows,
  buildNucleoRows,
  buildEvaluacionesTableData,
  buildPdfFilename,
} from "./piac-pdf-utils";

const UMCE_BLUE = [0, 51, 102] as const; // #003366
const HEADER_GRAY = [245, 245, 245] as const;

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...UMCE_BLUE);
  doc.text(title, 14, y);
  return y + 2;
}

export function generatePiacPdf(data: PiacData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header band ───────────────────────────────────────────────────
  doc.setFillColor(...UMCE_BLUE);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Universidad Metropolitana de Ciencias de la Educación", 14, 12);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Plan Individual de Actividad Curricular (PIAC)", 14, 19);

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-CL")}`, 14, 25);

  let y = 36;

  // ─── 1. Identificación y Modalidad ─────────────────────────────────
  y = addSectionTitle(doc, "1. Identificación y Modalidad", y);
  autoTable(doc, {
    startY: y,
    head: [],
    body: buildIdentificacionRows(data),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 45,
        fillColor: [...HEADER_GRAY] as [number, number, number],
      },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ─── 2. Núcleos ────────────────────────────────────────────────────
  data.nucleos.forEach((nucleo, i) => {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    y = addSectionTitle(doc, `2.${i + 1}. Núcleo: ${nucleo.nombre || `Núcleo ${i + 1}`}`, y);
    autoTable(doc, {
      startY: y,
      head: [],
      body: buildNucleoRows(nucleo, i),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: {
          fontStyle: "bold",
          cellWidth: 45,
          fillColor: [...HEADER_GRAY] as [number, number, number],
        },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  });

  // ─── 3. Evaluaciones ──────────────────────────────────────────────
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  y = addSectionTitle(doc, "3. Evaluaciones", y);
  const evalRows = buildEvaluacionesTableData(data.evaluaciones, data.nucleos);

  autoTable(doc, {
    startY: y,
    head: [["Evaluación", "Tipo", "Núcleo", "Ponderación", "Entrega"]],
    body: evalRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: {
      fillColor: [...UMCE_BLUE] as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ─── 4. Bibliografía ──────────────────────────────────────────────
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  y = addSectionTitle(doc, "4. Bibliografía", y);
  const biblioRows: string[][] = [];
  if (data.bibliografiaObligatoria) {
    biblioRows.push(["Obligatoria", data.bibliografiaObligatoria]);
  }
  if (data.bibliografiaComplementaria) {
    biblioRows.push(["Complementaria", data.bibliografiaComplementaria]);
  }
  if (biblioRows.length === 0) {
    biblioRows.push(["—", "Sin bibliografía registrada"]);
  }

  autoTable(doc, {
    startY: y,
    head: [],
    body: biblioRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 45,
        fillColor: [...HEADER_GRAY] as [number, number, number],
      },
    },
    margin: { left: 14, right: 14 },
  });

  // ─── Footer on every page ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `UMCE · PIAC · ${data.nombreActividad || "—"} · Página ${i}/${totalPages}`,
      14,
      pageHeight - 8
    );
  }

  // ─── Save ──────────────────────────────────────────────────────────
  doc.save(buildPdfFilename(data));
}
