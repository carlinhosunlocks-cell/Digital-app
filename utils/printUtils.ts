import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ServiceReport } from '../types';

export const printReport = (report: ServiceReport) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('DIGITAL EQUIPAMENTOS', 20, 25);
  
  doc.setFontSize(10);
  doc.text('RELATÓRIO TÉCNICO DE SERVIÇO', 20, 33);
  
  doc.setTextColor(150, 150, 150);
  doc.text(`OS #${report.id.slice(-6).toUpperCase()}`, pageWidth - 20, 25, { align: 'right' });

  // Client & Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Cliente: ${report.clientName}`, 20, 62);
  doc.text(`Técnico: ${report.technicianName}`, 20, 67);
  doc.text(`Data: ${new Date(report.date).toLocaleDateString()}`, 20, 72);
  doc.text(`Horário: ${report.startTime} - ${report.endTime}`, 20, 77);

  // Checklist Table
  const checklistData = [
    ['Portão Automático', report.services?.gate ? 'OK' : 'N/A'],
    ['Sistema CFTV', report.services?.cctv ? 'OK' : 'N/A'],
    ['Interfonia', report.services?.intercom ? 'OK' : 'N/A'],
    ['Fechaduras Eletroímã', report.services?.lock ? 'OK' : 'N/A'],
    ['Manutenção Preventiva', report.services?.preventive ? 'OK' : 'N/A'],
  ];

  (doc as any).autoTable({
    startY: 85,
    head: [['Item de Verificação', 'Status']],
    body: checklistData,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0] },
  });

  // Parts Used
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (report.partsUsed && report.partsUsed.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('MATERIAIS UTILIZADOS', 20, finalY);
    
    const partsData = report.partsUsed.map(p => [p.itemName, p.quantity.toString()]);
    
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Material', 'Quantidade']],
      body: partsData,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100] },
    });
    
    finalY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Comments
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES TÉCNICAS', 20, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitComments = doc.splitTextToSize(report.comments || 'Nenhuma observação adicional.', pageWidth - 40);
  doc.text(splitComments, 20, finalY + 7);

  // Signature
  const signatureY = finalY + 40;
  doc.line(20, signatureY, 90, signatureY);
  doc.setFontSize(8);
  doc.text('ASSINATURA DO TÉCNICO', 20, signatureY + 5);
  
  doc.line(pageWidth - 90, signatureY, pageWidth - 20, signatureY);
  doc.text('ASSINATURA DO CLIENTE', pageWidth - 90, signatureY + 5);
  
  if (report.signatureName) {
    doc.setFontSize(14);
    doc.text(report.signatureName, 110, signatureY - 5);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento gerado automaticamente pelo sistema Digital Equipamentos.', pageWidth / 2, 285, { align: 'center' });

  doc.save(`Relatorio_OS_${report.id.slice(-6)}.pdf`);
};
