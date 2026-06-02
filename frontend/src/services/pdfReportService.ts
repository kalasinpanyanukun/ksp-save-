import jsPDF from "jspdf";

/**
 * สร้างรายงาน PDF แบบทางการ (ฟอนต์ Sarabun จาก Google Fonts ผ่าน CDN)
 * พร้อมหัวกระดาษโรงเรียน ชื่อรายงาน และวันที่/เวลาที่พิมพ์
 */

// ฟอนต์ Sarabun แบบ static (วางในโฟลเดอร์ public/fonts โหลด same-origin จึงไม่ติด CORS/CSP)
const SARABUN_REGULAR = "/fonts/Sarabun-Regular.ttf";
const SARABUN_BOLD = "/fonts/Sarabun-Bold.ttf";

const ORG_NAME = "โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์";
const SYSTEM_NAME = "ระบบบริหารเรือนพยาบาล KSP SAVE+";

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 1024;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    for (let j = 0; j < slice.length; j++) binary += String.fromCharCode(slice[j]!);
  }
  return btoa(binary);
}

let fontCache: Promise<{ regular: string; bold: string }> | null = null;
async function loadFonts() {
  if (!fontCache) {
    fontCache = (async () => {
      const [reg, bold] = await Promise.all([
        fetch(SARABUN_REGULAR).then((r) => r.arrayBuffer()),
        fetch(SARABUN_BOLD).then((r) => r.arrayBuffer()),
      ]);
      return { regular: bufferToBase64(reg), bold: bufferToBase64(bold) };
    })();
  }
  return fontCache;
}

export interface PdfColumn {
  header: string;
  weight?: number; // สัดส่วนความกว้างคอลัมน์ (ค่าเริ่มต้น 1)
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: (string | number)[][];
  orientation?: "p" | "l";
  fontSize?: number;
  chart?: {
    title: string;
    yLabel?: string;
    points: { label: string; value: number }[];
    threshold?: { value: number; label: string };
  };
}

export async function exportTablePdf(options: PdfReportOptions): Promise<void> {
  const { title, subtitle, columns, rows } = options;
  const orientation = options.orientation ?? (columns.length > 6 ? "l" : "p");
  const fontSize = options.fontSize ?? 14;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  let hasThai = true;
  try {
    const fonts = await loadFonts();
    doc.addFileToVFS("Sarabun-Regular.ttf", fonts.regular);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.addFileToVFS("Sarabun-Bold.ttf", fonts.bold);
    doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
    doc.setFont("Sarabun", "normal");
  } catch {
    hasThai = false;
  }
  const fontFamily = hasThai ? "Sarabun" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;

  const now = new Date();
  const printed = now.toLocaleString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // คำนวณความกว้างคอลัมน์ตามสัดส่วน
  const totalWeight = columns.reduce((sum, c) => sum + (c.weight ?? 1), 0);
  const colWidths = columns.map((c) => ((c.weight ?? 1) / totalWeight) * usableWidth);

  const lineHeight = fontSize * 0.3528 * 1.18; // pt -> mm
  const cellPadX = 1.6;
  const cellPadY = 1.6;

  function drawCenteredLines(
    lines: string[],
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const textHeight = lines.length * lineHeight;
    const startY = y + (height - textHeight) / 2 + lineHeight * 0.78;
    lines.forEach((line, index) => {
      doc.text(line, x + width / 2, startY + index * lineHeight, {
        align: "center",
      });
    });
  }

  function drawDocHeader() {
    let y = margin;
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(12);
    doc.text(ORG_NAME, pageWidth / 2, y + 3, { align: "center" });
    y += 6;
    doc.setFontSize(10.4);
    doc.setFont(fontFamily, "normal");
    doc.text(SYSTEM_NAME, pageWidth / 2, y + 2, { align: "center" });
    y += 6;
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(14.4);
    doc.text(title, pageWidth / 2, y + 3, { align: "center" });
    y += 7;
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(9.6);
    if (subtitle) {
      doc.text(subtitle, margin, y + 2);
    }
    doc.text(`พิมพ์เมื่อ: ${printed} น.`, pageWidth - margin, y + 2, { align: "right" });
    y += 5;
    doc.setDrawColor(150);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 3;
  }

  function drawTableHeader(startY: number) {
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(fontSize);
    let maxLines = 1;
    const cellLines = columns.map((c, i) => {
      const lines = doc.splitTextToSize(c.header, colWidths[i]! - cellPadX * 2);
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });
    const rowH = maxLines * lineHeight + cellPadY * 2;
    doc.setFillColor(210, 229, 251);
    doc.rect(margin, startY, usableWidth, rowH, "F");
    let x = margin;
    doc.setTextColor(13, 43, 69);
    cellLines.forEach((lines, i) => {
      drawCenteredLines(lines, x, startY, colWidths[i]!, rowH);
      x += colWidths[i]!;
    });
    // เส้นแนวตั้ง
    doc.setDrawColor(200);
    let vx = margin;
    for (let i = 0; i <= columns.length; i++) {
      doc.line(vx, startY, vx, startY + rowH);
      if (i < columns.length) vx += colWidths[i]!;
    }
    return startY + rowH;
  }

  function drawChart(startY: number) {
    const chart = options.chart;
    if (!chart || chart.points.length === 0) return startY;

    const chartHeight = orientation === "l" ? 68 : 56;
    const titleH = 8;
    const axisPadLeft = 13;
    const axisPadBottom = 12;
    const plotX = margin + axisPadLeft;
    const plotY = startY + titleH;
    const plotW = usableWidth - axisPadLeft - 3;
    const plotH = chartHeight - titleH - axisPadBottom;
    const values = chart.points.map((point) => point.value);
    const maxValue = Math.max(10, ...values, chart.threshold?.value ?? 0);
    const yMax = Math.ceil(maxValue / 10) * 10;

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 43, 69);
    doc.text(chart.title, margin, startY + 4);

    doc.setDrawColor(210, 225, 240);
    doc.setLineWidth(0.25);
    for (let i = 0; i <= 4; i++) {
      const y = plotY + (plotH / 4) * i;
      doc.line(plotX, y, plotX + plotW, y);
      const label = String(Math.round(yMax - (yMax / 4) * i));
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, plotX - 2, y + 1.5, { align: "right" });
    }

    doc.setDrawColor(120, 140, 160);
    doc.line(plotX, plotY, plotX, plotY + plotH);
    doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

    if (chart.threshold) {
      const y = plotY + plotH - (chart.threshold.value / yMax) * plotH;
      doc.setDrawColor(239, 68, 68);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(plotX, y, plotX + plotW, y);
      doc.setLineDashPattern([], 0);
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(190, 18, 60);
      doc.text(chart.threshold.label, plotX + plotW, y - 1.5, { align: "right" });
    }

    const step = chart.points.length > 1 ? plotW / (chart.points.length - 1) : 0;
    const coords = chart.points.map((point, index) => ({
      x: chart.points.length === 1 ? plotX + plotW / 2 : plotX + index * step,
      y: plotY + plotH - (point.value / yMax) * plotH,
    }));

    doc.setDrawColor(32, 119, 199);
    doc.setFillColor(32, 119, 199);
    doc.setLineWidth(0.7);
    coords.forEach((coord, index) => {
      if (index > 0) {
        const prev = coords[index - 1]!;
        doc.line(prev.x, prev.y, coord.x, coord.y);
      }
      doc.circle(coord.x, coord.y, 1.2, "F");
    });

    const labelEvery = Math.max(1, Math.ceil(chart.points.length / 8));
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    chart.points.forEach((point, index) => {
      if (index % labelEvery !== 0 && index !== chart.points.length - 1) return;
      const coord = coords[index]!;
      doc.text(point.label, coord.x, plotY + plotH + 5, { align: "center" });
    });

    if (chart.yLabel) {
      doc.setFontSize(7.5);
      doc.text(chart.yLabel, margin, plotY + 2);
    }

    return startY + chartHeight + 4;
  }

  let y = drawDocHeader();
  y = drawChart(y);
  y = drawTableHeader(y);

  doc.setFont(fontFamily, "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(20, 30, 50);

  rows.forEach((row, rowIndex) => {
    let maxLines = 1;
    const cellLines = columns.map((_, i) => {
      const text = String(row[i] ?? "");
      const lines = doc.splitTextToSize(text || "-", colWidths[i]! - cellPadX * 2);
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });
    const rowH = maxLines * lineHeight + cellPadY * 2;

    if (y + rowH > pageHeight - margin) {
      doc.addPage();
      y = drawDocHeader();
      y = drawTableHeader(y);
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(20, 30, 50);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(244, 248, 252);
      doc.rect(margin, y, usableWidth, rowH, "F");
    }
    let x = margin;
    cellLines.forEach((lines, i) => {
      drawCenteredLines(lines, x, y, colWidths[i]!, rowH);
      x += colWidths[i]!;
    });
    doc.setDrawColor(225);
    doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
    let vx = margin;
    for (let i = 0; i <= columns.length; i++) {
      doc.line(vx, y, vx, y + rowH);
      if (i < columns.length) vx += colWidths[i]!;
    }
    y += rowH;
  });

  // เลขหน้า
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`หน้า ${p} / ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`${title}-${stamp}.pdf`);
}
