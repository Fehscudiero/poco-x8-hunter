// scrapers/history.js - Gerenciador de Histórico Exclusivo Poco X8 256GB
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'data', 'history.json');

function getHistory() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Garante que NUNCA retorne nada além de Poco X8 256GB
    return parsed.filter(h => {
      const t = (h.bestDeal?.title || '').toLowerCase();
      return t.includes('poco') && t.includes('x8') && t.includes('256');
    });
  } catch (err) {
    console.error('Erro ao ler historico:', err.message);
    return [];
  }
}

function saveHunt(query, bestDeal, amazonLowest, mlLowest, totalItems) {
  if (!bestDeal || !bestDeal.title.toLowerCase().includes('x8') || !bestDeal.title.toLowerCase().includes('256')) {
    return null; // Rejeita qualquer modelo diferente de Poco X8 256GB
  }

  const history = getHistory();
  const entry = {
    id: `hunt-x8-${Date.now()}`,
    timestamp: new Date().toISOString(),
    query: 'Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto',
    totalItems,
    bestDeal: {
      title: bestDeal.title,
      price: bestDeal.price,
      marketplace: bestDeal.marketplace,
      link: bestDeal.link
    },
    amazonLowest: amazonLowest ? amazonLowest.price : null,
    mlLowest: mlLowest ? mlLowest.price : null
  };

  history.push(entry);
  const trimmed = history.slice(-50);
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar historico:', err.message);
  }
  return entry;
}

module.exports = { getHistory, saveHunt };
