// =====================================================
// GOOGLE APPS SCRIPT — Cole este código no Apps Script
// da sua planilha do Google Sheets
// =====================================================
//
// INSTRUÇÕES:
// 1. Crie uma planilha no Google Sheets
// 2. Crie 2 abas: "Atletas" e "Interessados PPV"
// 3. Na aba "Atletas", adicione os cabeçalhos na linha 1:
//    Timestamp | Nome | Email | WhatsApp | Graduação | Associação | Cidade | País | Link do Vídeo | Redes Sociais
// 4. Na aba "Interessados PPV", adicione os cabeçalhos na linha 1:
//    Timestamp | Nome | Email | WhatsApp
// 5. Vá em Extensões → Apps Script
// 6. Cole TODO este código e salve
// 7. Clique em "Implantar" → "Nova implantação"
// 8. Tipo: "App da Web"
// 9. Executar como: "Eu"
// 10. Quem tem acesso: "Qualquer pessoa"
// 11. Clique em "Implantar" e copie a URL gerada
// 12. Envie a URL para mim e eu coloco no código do site!

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.type === 'athlete') {
      var sheet = ss.getSheetByName('Atletas');
      sheet.appendRow([
        data.timestamp,
        data.name,
        data.email,
        data.whatsapp,
        data.belt,
        data.association,
        data.city,
        data.country,
        data.videoLink,
        data.socialMedia
      ]);
    } else if (data.type === 'ppv_interest') {
      var sheet = ss.getSheetByName('Interessados PPV');
      sheet.appendRow([
        data.timestamp,
        data.name,
        data.email,
        data.whatsapp
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Karate Legends API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
