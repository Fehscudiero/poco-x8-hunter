// scrapers/history.js - Gerenciador de Histórico de Preços
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'data', 'history.json');

function getHistory() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler historico:', err.message);
    return [];
  }
}

function saveHunt(query, bestDeal, amazonLowest, mlLowest, totalItems) {
  const history = getHistory();
  const entry = {
    id: `hunt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    query,
    totalItems,
    bestDeal: bestDeal ? {
      title: bestDeal.title,
      price: bestDeal.price,
      marketplace: bestDeal.marketplace,
      link: bestDeal.link
    } : null,
    amazonLowest: amazonLowest ? amazonLowest.price : null,
    mlLowest: mlLowest ? mlLowest.price : null
  };

  history.push(entry);
  // Mantém os últimos 100 registros
  const trimmed = history.slice(-100);
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar historico:', err.message);
  }
  return entry;
}

module.exports = { getHistory, saveHunt };
