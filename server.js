// server.js - Servidor de Monitoramento Exclusivo Poco X8 256GB 8GB Preto
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
  const query = 'Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto';
  console.log(`[HUNT STRICT] Caçando EXCLUSIVAMENTE: "${query}"`);

  // Dispara consultas complementares para garantir que pegamos todos os anúncios válidos
  const [amz1, amz2, ml1, ml2] = await Promise.allSettled([
    scrapeAmazon('Xiaomi Poco X8'),
    scrapeAmazon('Poco X8 256GB preto'),
    scrapeMercadoLivre('Xiaomi Poco X8 256gb'),
    scrapeMercadoLivre('Poco X8 5G 256gb preto')
  ]);

  const rawAmz = [
    ...(amz1.status === 'fulfilled' ? amz1.value : []),
    ...(amz2.status === 'fulfilled' ? amz2.value : [])
  ];
  const rawMl = [
    ...(ml1.status === 'fulfilled' ? ml1.value : []),
    ...(ml2.status === 'fulfilled' ? ml2.value : [])
  ];

  // Remove duplicados de ID antes de filtrar
  const uniqueItems = Array.from(new Map([...rawAmz, ...rawMl].map(i => [i.id + i.title, i])).values());
  
  // FILTRAGEM ESTRITA: APENAS POCO X8 256GB 8GB RAM PRETO
  const strictlyFiltered = processAndSort(uniqueItems);

  const amzValid = strictlyFiltered.filter(i => i.marketplace === 'Amazon');
  const mlValid = strictlyFiltered.filter(i => i.marketplace === 'Mercado Livre');

  const amazonLowest = amzValid.length ? amzValid[0] : null;
  const mlLowest = mlValid.length ? mlValid[0] : null;
  const bestDeal = strictlyFiltered.length ? strictlyFiltered[0] : null;

  saveHunt(query, bestDeal, amazonLowest, mlLowest, strictlyFiltered.length);

  res.json({
    success: true,
    target: 'Xiaomi Poco X8 5G 256GB 8GB RAM Preto (100% Exclusivo)',
    timestamp: new Date().toISOString(),
    stats: {
      totalExamined: uniqueItems.length,
      totalExactMatches: strictlyFiltered.length,
      amazonCount: amzValid.length,
      mlCount: mlValid.length
    },
    bestDeal,
    amazonLowest,
    mlLowest,
    items: strictlyFiltered
  });
});

app.get('/api/history', (req, res) => res.json({ success: true, history: getHistory() }));

app.listen(PORT, () => console.log(`[SERVER] Rodando em http://localhost:${PORT}`));
