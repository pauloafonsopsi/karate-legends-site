// =====================================================
// GOOGLE APPS SCRIPT — PLANILHA DE ATLETAS
// Cole este código no Apps Script da planilha de Atletas
// =====================================================
//
// INSTRUÇÕES:
// 1. Na planilha de Atletas, adicione os cabeçalhos na linha 1:
//    Timestamp | Nome | Email | WhatsApp | Graduação | Associação | Cidade | País | Link do Vídeo | Redes Sociais
// 2. Vá em Extensões → Apps Script
// 3. Cole este código e salve
// 4. Implante como Web App com acesso "Qualquer pessoa"

function doGet(e) {
  try {
    var params = e.parameter || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Usa a primeira aba

    if (params.name) {
      sheet.appendRow([
        params.timestamp || new Date().toISOString(),
        params.name || '',
        params.email || '',
        params.whatsapp || '',
        params.belt || '',
        params.association || '',
        params.city || '',
        params.country || '',
        params.videoLink || '',
        params.socialMedia || ''
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Atletas API running' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet({ parameter: JSON.parse(e.postData.contents || '{}') });
}


// =====================================================
// GOOGLE APPS SCRIPT — PLANILHA DE PPV
// Cole este código no Apps Script da planilha de PPV
// =====================================================
//
// INSTRUÇÕES:
// 1. Na planilha de PPV, adicione os cabeçalhos na linha 1:
//    Timestamp | Nome | Email | WhatsApp
// 2. Vá em Extensões → Apps Script
// 3. Cole este código e salve
// 4. Implante como Web App com acesso "Qualquer pessoa"

/*
function doGet(e) {
  try {
    var params = e.parameter || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];

    if (params.name) {
      sheet.appendRow([
        params.timestamp || new Date().toISOString(),
        params.name || '',
        params.email || '',
        params.whatsapp || ''
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'PPV API running' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet({ parameter: JSON.parse(e.postData.contents || '{}') });
}
*/
