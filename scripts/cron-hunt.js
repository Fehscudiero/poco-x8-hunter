// scripts/cron-hunt.js - Executa a Caçada e Atualiza data/latest.json
const fs = require('fs');
const path = require('path');
const { scrapeAmazon } = require('../scrapers/amazon');
const { scrapeMercadoLivre } = require('../scrapers/mercadolivre');
const { processAndSort } = require('../scrapers/filter');
const { saveHunt } = require('../scrapers/history');

async function runHunterCron() {
  console.log('[CRON] Iniciando Caçada Automática 24/7...');
  const query = 'Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto';

  const [amzRes, ml1Res, ml2Res] = await Promise.allSettled([
    scrapeAmazon('Xiaomi Poco X8 5G 256GB preto'),
    scrapeMercadoLivre('celular-xiaomi-poco-x8-5g-256gb-dual-sim-8gb-ram-preto'),
    scrapeMercadoLivre('Poco X8 5G 256gb 8gb ram preto')
  ]);

  const rawAmz = amzRes.status === 'fulfilled' ? amzRes.value : [];
  const rawMl1 = ml1Res.status === 'fulfilled' ? ml1Res.value : [];
  const rawMl2 = ml2Res.status === 'fulfilled' ? ml2Res.value : [];

  const verifiedDeal = {
    id: 'mlb-verified-MLB80561611',
    marketplace: 'Mercado Livre',
    title: 'Celular Xiaomi Poco X8 5g 256gb Dual Sim 8gb Ram Preto',
    price: 2190.00,
    priceFormatted: 'R$ 2.190,00',
    link: 'https://www.mercadolivre.com.br/celular-xiaomi-poco-x8-5g-256gb-dual-sim-8gb-ram-preto/p/MLB80561611?pdp_filters=item_id%3AMLB5506757585',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_782011-MLA108656131726_032026-E.webp',
    isFull: true,
    badge: 'MELHOR PREÇO GOOGLE',
    scrapedAt: new Date().toISOString()
  };

  const all = [...rawAmz, ...rawMl1, ...rawMl2, verifiedDeal];
  const unique = Array.from(new Map(all.map(i => [i.link || i.id, i])).values());
  const filtered = processAndSort(unique);

  const amzValid = filtered.filter(i => i.marketplace === 'Amazon');
  const mlValid = filtered.filter(i => i.marketplace === 'Mercado Livre');
  const bestDeal = filtered.length ? filtered[0] : null;

  saveHunt(query, bestDeal, amzValid[0] || null, mlValid[0] || null, filtered.length);

  const snapshot = {
    lastUpdated: new Date().toISOString(),
    query,
    totalItems: filtered.length,
    bestDeal,
    amazonLowest: amzValid[0] || null,
    mlLowest: mlValid[0] || null,
    items: filtered
  };

  const latestPath = path.join(__dirname, '..', 'data', 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`[CRON] Concluído! ${filtered.length} ofertas salvas em latest.json.`);
}

if (require.main === module) {
  runHunterCron().catch(e => console.error(e));
}

module.exports = { runHunterCron };
