// server.js - Servidor de Monitoramento Híbrido Poco X8 (Nuvem + Local)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { scrapeAmazon } = require('./scrapers/amazon');
const { scrapeMercadoLivre } = require('./scrapers/mercadolivre');
const { processAndSort } = require('./scrapers/filter');
const { getHistory, saveHunt } = require('./scrapers/history');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getCachedLatest() {
  try {
    const p = path.join(__dirname, 'data', 'latest.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8')).items || [];
  } catch (_) {}
  return [];
}

app.get('/api/hunt', async (req, res) => {
  const query = 'Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto';
  console.log(`[HUNT] Executando varredura ao vivo para: "${query}"`);

  // Executa busca na Amazon e Mercado Livre
  const [amzResult, mlResult] = await Promise.allSettled([
    scrapeAmazon('Xiaomi Poco X8 5G 256GB preto'),
    scrapeMercadoLivre('celular-xiaomi-poco-x8-5g-256gb-dual-sim-8gb-ram-preto')
  ]);

  const liveAmz = amzResult.status === 'fulfilled' ? amzResult.value : [];
  const liveMl = mlResult.status === 'fulfilled' ? mlResult.value : [];
  const cachedItems = getCachedLatest();

  // Combina dados ao vivo com a base persistida mais recente
  const combined = [...liveAmz, ...liveMl, ...cachedItems];
  const unique = Array.from(new Map(combined.map(i => [i.link || i.id, i])).values());
  const filtered = processAndSort(unique);

  const amzValid = filtered.filter(i => i.marketplace === 'Amazon');
  const mlValid = filtered.filter(i => i.marketplace === 'Mercado Livre');
  const bestDeal = filtered.length ? filtered[0] : null;

  saveHunt(query, bestDeal, amzValid[0] || null, mlValid[0] || null, filtered.length);

  res.json({
    success: true,
    target: 'Xiaomi Poco X8 5G 256GB 8GB RAM Preto (100% Exclusivo)',
    timestamp: new Date().toISOString(),
    stats: {
      totalFound: unique.length,
      totalExactMatches: filtered.length,
      amazonCount: amzValid.length,
      mlCount: mlValid.length
    },
    bestDeal,
    amazonLowest: amzValid[0] || null,
    mlLowest: mlValid[0] || null,
    items: filtered
  });
});

app.get('/api/history', (req, res) => res.json({ success: true, history: getHistory() }));

app.listen(PORT, () => console.log(`[SERVER] Rodando em http://localhost:${PORT}`));
