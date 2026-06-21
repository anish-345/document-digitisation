import ExcelJS from "exceljs";

export const config = {
  api: {
    bodyParser: true,
    responseLimit: "50mb",
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, filename } = req.body;
    const { columns, rows } = data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Extracted Data");

    // Add headers with styling
    const headerRow = worksheet.addRow(columns);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }, // Indigo-600
    };
    headerRow.alignment = { horizontal: "center" };

    // Add data rows
    rows.forEach((row: any) => {
      const values = columns.map((col: string) => row[col] || "");
      worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "export.xlsx"}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to generate Excel file" });
  }
}
