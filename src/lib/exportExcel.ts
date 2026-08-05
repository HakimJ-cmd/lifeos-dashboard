import * as XLSX from "xlsx-js-style";

type ColumnDef = {
  header: string;
  width: number;
  /** Format angka ala Excel, contoh: '"Rp"#,##0' untuk mata uang Rupiah. Kosongkan untuk teks biasa. */
  numberFormat?: string;
};

const BORDER_THIN = { style: "thin", color: { rgb: "FFD9D9D9" } } as const;
const CELL_BORDER = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "FF5B53F0" } }, // ungu, senada dengan aksen aplikasi
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: CELL_BORDER,
};

/**
 * Bikin & langsung download 1 file .xlsx dengan tampilan rapi: judul di atas,
 * header tabel berwarna + bold, border tiap sel, kolom angka diformat Rupiah,
 * dan auto-filter di header. Dipakai untuk semua fitur export Excel di app ini
 * (bukan cuma laporan keuangan) supaya tampilannya konsisten.
 */
export function exportStyledExcel({
  filename,
  sheetName,
  title,
  columns,
  rows,
}: {
  filename: string;
  sheetName: string;
  title: string;
  columns: ColumnDef[];
  rows: (string | number)[][];
}) {
  const subtitle = `Diekspor: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`;
  const headerRowIdx = 3; // baris ke-4 (0-based): judul, subjudul, baris kosong, lalu header

  const aoa: (string | number)[][] = [
    [title],
    [subtitle],
    [],
    columns.map((c) => c.header),
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
  ];
  ws["!cols"] = columns.map((c) => ({ wch: c.width }));

  const titleCell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  if (titleCell) titleCell.s = { font: { bold: true, sz: 14 } };
  const subtitleCell = ws[XLSX.utils.encode_cell({ r: 1, c: 0 })];
  if (subtitleCell) subtitleCell.s = { font: { italic: true, sz: 9, color: { rgb: "FF666666" } } };

  columns.forEach((_, ci) => {
    const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: ci });
    if (ws[ref]) ws[ref].s = HEADER_STYLE;
  });

  rows.forEach((row, ri) => {
    const r = headerRowIdx + 1 + ri;
    row.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r, c: ci });
      const cell = ws[ref];
      if (!cell) return;
      const fmt = columns[ci].numberFormat;
      cell.s = {
        border: CELL_BORDER,
        alignment: { vertical: "center", horizontal: fmt ? "right" : "left" },
        fill: { fgColor: { rgb: ri % 2 === 0 ? "FFFFFFFF" : "FFF7F7FB" } }, // selang-seling biar gampang dibaca
      };
      if (fmt) cell.z = fmt;
    });
  });

  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: headerRowIdx, c: 0 }, e: { r: headerRowIdx, c: columns.length - 1 } }),
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
