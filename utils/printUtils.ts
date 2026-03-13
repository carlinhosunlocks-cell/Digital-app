export const printReport = (report: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita popups para imprimir o relatório.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório Técnico - OS #${report.id.slice(-4)}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #000; }
        .logo span { color: #666; font-weight: normal; }
        .title { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; }
        .meta { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; color: #444; text-transform: uppercase; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold; }
        .value { font-size: 16px; font-weight: 500; }
        .checklist { list-style: none; padding: 0; margin: 0; }
        .checklist li { padding: 10px 0; border-bottom: 1px solid #f5f5f5; display: flex; justify-content: space-between; }
        .checklist li:last-child { border-bottom: none; }
        .status-ok { color: #16a34a; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
        .parts-table { w-full; border-collapse: collapse; width: 100%; }
        .parts-table th, .parts-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .parts-table th { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .footer { margin-top: 50px; padding-top: 30px; border-top: 2px solid #eee; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 250px; }
        .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 10px; display: flex; align-items: flex-end; justify-content: center; font-family: 'Brush Script MT', cursive; font-size: 24px; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Digital<span>Equipamentos</span></div>
          <p class="meta">Relatório Técnico de Manutenção</p>
        </div>
        <div style="text-align: right;">
          <h1 class="title">OS #${report.id.slice(-4)}</h1>
          <p class="meta">Data: ${new Date(report.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div class="grid">
        <div class="section">
          <h2 class="section-title">Dados do Cliente</h2>
          <div class="field">
            <div class="label">Cliente / Empresa</div>
            <div class="value">${report.clientName}</div>
          </div>
          <div class="field">
            <div class="label">Endereço do Serviço</div>
            <div class="value">${report.address || 'Não informado'}</div>
          </div>
        </div>
        <div class="section">
          <h2 class="section-title">Dados do Atendimento</h2>
          <div class="field">
            <div class="label">Técnico Responsável</div>
            <div class="value">${report.technicianName}</div>
          </div>
          <div class="field">
            <div class="label">Horário de Execução</div>
            <div class="value">${report.startTime || '--:--'} às ${report.endTime || '--:--'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Checklist de Sistemas</h2>
        <ul class="checklist">
          <li><span>Portão Automático</span> <span class="${report.services?.gate ? 'status-ok' : 'status-pending'}">${report.services?.gate ? 'Verificado' : 'Não Verificado'}</span></li>
          <li><span>Sistema CFTV</span> <span class="${report.services?.cctv ? 'status-ok' : 'status-pending'}">${report.services?.cctv ? 'Verificado' : 'Não Verificado'}</span></li>
          <li><span>Interfonia</span> <span class="${report.services?.intercom ? 'status-ok' : 'status-pending'}">${report.services?.intercom ? 'Verificado' : 'Não Verificado'}</span></li>
          <li><span>Fechaduras Eletroímã</span> <span class="${report.services?.lock ? 'status-ok' : 'status-pending'}">${report.services?.lock ? 'Verificado' : 'Não Verificado'}</span></li>
          <li><span>Manutenção Preventiva</span> <span class="${report.services?.preventive ? 'status-ok' : 'status-pending'}">${report.services?.preventive ? 'Realizada' : 'Não Realizada'}</span></li>
        </ul>
      </div>

      ${report.partsUsed && report.partsUsed.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Materiais Utilizados</h2>
        <table class="parts-table">
          <thead>
            <tr>
              <th>Qtd</th>
              <th>Descrição do Material</th>
            </tr>
          </thead>
          <tbody>
            ${report.partsUsed.map((part: any) => `
              <tr>
                <td>${part.quantity}x</td>
                <td>${part.itemName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="section">
        <h2 class="section-title">Observações Técnicas</h2>
        <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #eee;">${report.comments || 'Nenhuma observação adicional.'}</p>
      </div>

      <div class="footer">
        <div class="signature-box">
          <div class="signature-line">${report.technicianName}</div>
          <div class="label">Assinatura do Técnico</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">${report.signatureName || ''}</div>
          <div class="label">Assinatura do Cliente</div>
        </div>
      </div>

      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
