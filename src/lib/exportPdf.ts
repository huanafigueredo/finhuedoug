import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionForExport {
  date: string;
  description: string;
  person: string;
  forWho: string;
  category: string;
  bank: string;
  paymentMethod: string;
  totalValue: number;
  type: "income" | "expense";
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
}

interface ExportFilters {
  month?: string;
  year?: string;
  category?: string;
  type?: string;
  person?: string;
}

interface ExportTotals {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getMonthName(monthNum: string): string {
  const months: Record<string, string> = {
    "1": "Janeiro",
    "2": "Fevereiro",
    "3": "Março",
    "4": "Abril",
    "5": "Maio",
    "6": "Junho",
    "7": "Julho",
    "8": "Agosto",
    "9": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };
  return months[monthNum] || monthNum;
}

export function exportTransactionsToPdf(
  transactions: TransactionForExport[],
  filters: ExportFilters,
  totals: ExportTotals
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const dangerColor: [number, number, number] = [239, 68, 68]; // Red
  const textColor: [number, number, number] = [30, 41, 59]; // Slate

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Lançamentos", margin, 16);

  // Period info
  let periodText = "Período: ";
  if (filters.month && filters.month !== "Todos" && filters.year && filters.year !== "Todos") {
    periodText += `${getMonthName(filters.month)}/${filters.year}`;
  } else if (filters.year && filters.year !== "Todos") {
    periodText += filters.year;
  } else {
    periodText += "Todos";
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(periodText, pageWidth - margin, 12, { align: "right" });

  // Applied filters line
  const appliedFilters: string[] = [];
  if (filters.category && filters.category !== "Todas") {
    appliedFilters.push(`Categoria: ${filters.category}`);
  }
  if (filters.type && filters.type !== "Todos") {
    appliedFilters.push(`Tipo: ${filters.type}`);
  }
  if (filters.person && filters.person !== "Todos") {
    appliedFilters.push(`Pessoa: ${filters.person}`);
  }

  if (appliedFilters.length > 0) {
    doc.text(`Filtros: ${appliedFilters.join(" | ")}`, pageWidth - margin, 18, { align: "right" });
  }

  // Table data
  const tableData = transactions.map((t) => {
    let description = t.description;
    if (t.isInstallment && t.installmentNumber && t.totalInstallments) {
      description += ` (${t.installmentNumber}/${t.totalInstallments})`;
    }

    return [
      t.date,
      description,
      t.person,
      t.forWho,
      t.category,
      t.bank,
      t.paymentMethod,
      formatCurrency(t.totalValue),
      t.type === "income" ? "Receita" : "Despesa",
    ];
  });

  // Generate table
  autoTable(doc, {
    startY: 32,
    head: [["Data", "Descrição", "Quem Pagou", "Para Quem", "Categoria", "Conta", "Pagamento", "Valor", "Tipo"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Data
      1: { cellWidth: 55 }, // Descrição
      2: { cellWidth: 25 }, // Quem Pagou
      3: { cellWidth: 25 }, // Para Quem
      4: { cellWidth: 30 }, // Categoria
      5: { cellWidth: 30 }, // Conta
      6: { cellWidth: 28 }, // Pagamento
      7: { cellWidth: 28, halign: "right" }, // Valor
      8: { cellWidth: 22 }, // Tipo
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      // Color income/expense in value and type columns
      if (data.section === "body") {
        const rowData = data.row.raw as string[];
        const tipo = rowData[8];
        
        if (data.column.index === 7 || data.column.index === 8) {
          if (tipo === "Receita") {
            data.cell.styles.textColor = successColor;
          } else {
            data.cell.styles.textColor = dangerColor;
          }
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Totals section
  const totalsY = finalY + 10;
  
  if (totalsY < pageHeight - 40) {
    // Draw totals box
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(pageWidth - margin - 90, totalsY, 90, 35, 3, 3, "S");

    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Receitas
    doc.text("Total Receitas:", pageWidth - margin - 85, totalsY + 10);
    doc.setTextColor(...successColor);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(totals.totalIncome), pageWidth - margin - 5, totalsY + 10, { align: "right" });

    // Despesas
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.text("Total Despesas:", pageWidth - margin - 85, totalsY + 18);
    doc.setTextColor(...dangerColor);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(totals.totalExpenses), pageWidth - margin - 5, totalsY + 18, { align: "right" });

    // Saldo
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.text("Saldo:", pageWidth - margin - 85, totalsY + 28);
    const balanceColor = totals.balance >= 0 ? successColor : dangerColor;
    doc.setTextColor(...balanceColor);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(totals.balance), pageWidth - margin - 5, totalsY + 28, { align: "right" });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const generatedText = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    doc.text(generatedText, margin, pageHeight - 8);
    
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Generate filename
  let filename = "lancamentos";
  if (filters.month && filters.month !== "Todos" && filters.year && filters.year !== "Todos") {
    filename += `_${filters.month.padStart(2, "0")}-${filters.year}`;
  } else if (filters.year && filters.year !== "Todos") {
    filename += `_${filters.year}`;
  }
  filename += ".pdf";

  doc.save(filename);
}
