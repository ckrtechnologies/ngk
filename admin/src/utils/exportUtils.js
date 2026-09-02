import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export tabular data to CSV
 * @param {string} filename - e.g. "users_export.csv"
 * @param {Array<string>} headers - e.g. ["Name", "Email", "Role", "Address"]
 * @param {Array<Array<string>>} rows - 2D array of data strings
 */
export const exportToCSV = (filename, headers, rows) => {
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  // Prepend UTF-8 BOM so Excel opens special characters cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export tabular data to Branded PDF
 * @param {string} filename - e.g. "users_export.pdf"
 * @param {string} title - e.g. "NGK User Directory Report"
 * @param {Array<string>} headers - e.g. ["Name", "Email", "Role", "Address", "Joined"]
 * @param {Array<Array<string>>} rows - 2D array of data strings
 */
export const exportToPDF = (filename, title, headers, rows) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Header Banner
  doc.setFillColor(198, 18, 46); // NGK Brand Crimson #C6122E
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('NGK SPARK PLUGS • ENTERPRISE MANAGEMENT SYSTEM', 40, 28);

  // Subtitle / Report Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(title, 40, 68);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const dateStr = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated on: ${dateStr} • Total Records: ${rows.length}`, 40, 82);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 95,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 6,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    margin: { left: 40, right: 40, bottom: 40 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'right' }
      );
      doc.text(
        'CONFIDENTIAL & PROPRIETARY — NGK AUTOMOTIVE',
        40,
        doc.internal.pageSize.getHeight() - 20
      );
    },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

export default { exportToCSV, exportToPDF };
