// =====================================================
// Google Apps Script — Planilha de ATLETAS
// =====================================================
// INSTRUÇÕES:
// 1. Abra sua planilha de Atletas no Google Sheets
// 2. Vá em Extensões → Apps Script
// 3. Apague todo o conteúdo e cole este código
// 4. Clique em "Implantar" → "Nova implantação"
// 5. Tipo: "App da Web"
// 6. Executar como: "Eu" | Quem tem acesso: "Qualquer pessoa"
// 7. Clique em "Implantar" e copie a URL gerada
// 8. IMPORTANTE: A primeira linha da planilha será o cabeçalho (criado automaticamente)
// =====================================================

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Cria cabeçalho se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Nome',
        'Email', 
        'WhatsApp',
        'Estilo',
        'Graduação',
        'Associação/Dojo',
        'Cidade',
        'País',
        'Link do Vídeo',
        'Certificado de Graduação',
        'Documento de Identificação',
        'Redes Sociais'
      ]);
    }
    
    var whatsapp = e.parameter.whatsapp || '';
    // Remove aspa simples de prefixo se presente
    if (whatsapp.charAt(0) === "'") {
      whatsapp = whatsapp.substring(1);
    }
    
    sheet.appendRow([
      e.parameter.timestamp || new Date().toISOString(),
      e.parameter.name || '',
      e.parameter.email || '',
      whatsapp,
      e.parameter.style || '',
      e.parameter.belt || '',
      e.parameter.association || '',
      e.parameter.city || '',
      e.parameter.country || '',
      e.parameter.videoLink || '',
      e.parameter.certificateLink || '',
      e.parameter.idLink || '',
      e.parameter.socialMedia || ''
    ]);
    
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput('ERROR: ' + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
