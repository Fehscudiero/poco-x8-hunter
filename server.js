// server.js - Servidor de Monitoramento de Preços Poco X8
const express = require('express');
const cors = require('cors');
const path = require('path');
const { scrapeAmazon } = require('./scrapers/amazon');
const { scrapeMercadoLivre } = require('./scrapers/mercadolivre');
const { processAndSort } = require('./scrapers/filter');
const { getHistory, saveHunt } = require('./scrapers/history');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hunt', async (req, res) => {
  const query = req.query.q || 'Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto';
  console.log(`[HUNT] Iniciando caçada para: "${query}"`);

  const [amzResult, mlResult] = await Promise.allSettled([
    scrapeAmazon(query),
    scrapeMercadoLivre(query)
  ]);

  const amzItems = amzResult.status === 'fulfilled' ? amzResult.value : [];
  const mlItems = mlResult.status === 'fulfilled' ? mlResult.value : [];
  const combined = [...amzItems, ...mlItems];
  const processed = processAndSort(combined, query);

  const amzValid = processed.filter(i => i.marketplace === 'Amazon');
  const mlValid = processed.filter(i => i.marketplace === 'Mercado Livre');

  const amazonLowest = amzValid.length ? amzValid[0] : null;
  const mlLowest = mlValid.length ? mlValid[0] : null;
  const bestDeal = processed.length ? processed[0] : null;

  saveHunt(query, bestDeal, amazonLowest, mlLowest, processed.length);

  res.json({
    success: true,
    query,
    timestamp: new Date().toISOString(),
    stats: {
      totalFound: combined.length,
      totalValid: processed.length,
      amazonCount: amzValid.length,
      mlCount: mlValid.length
    },
    bestDeal,
    amazonLowest,
    mlLowest,
    items: processed
  });
});

app.get('/api/history', (req, res) => {
  res.json({ success: true, history: getHistory() });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Rodando em http://localhost:${PORT}`);
});
