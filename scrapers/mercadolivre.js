// scrapers/mercadolivre.js - Scraper Mercado Livre via Stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

function getBrowserPath() {
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  return fs.existsSync(chrome) ? chrome : (fs.existsSync(edge) ? edge : undefined);
}

async function scrapeMercadoLivre(searchQuery) {
  const slug = encodeURIComponent(searchQuery.trim().replace(/\s+/g, '-'));
  const url = `https://lista.mercadolivre.com.br/${slug}`;
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: getBrowserPath(),
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
    } catch (_) {}
    await page.waitForSelector('.poly-card, .ui-search-layout__item', { timeout: 10000 });

    const items = await page.evaluate(() => {
      const list = [];
      document.querySelectorAll('.poly-card, .ui-search-layout__item').forEach((card, idx) => {
        const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title');
        const priceEl = card.querySelector('.andes-money-amount__fraction');
        const centsEl = card.querySelector('.andes-money-amount__cents');
        const linkEl = card.querySelector('a');
        const imgEl = card.querySelector('img');
        const isFull = !!card.querySelector('.poly-component__shipped-from, .ui-search-item__fulfillment');

        if (titleEl && priceEl) {
          const raw = priceEl.innerText.trim().replace(/\./g, '') + (centsEl ? '.' + centsEl.innerText.trim() : '');
          const price = parseFloat(raw);
          if (!isNaN(price)) {
            list.push({
              id: `mlb-${idx}-${Date.now()}`,
              marketplace: 'Mercado Livre',
              title: titleEl.innerText.trim(),
              price,
              link: linkEl ? linkEl.href : null,
              image: imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null,
              isFull,
              badge: isFull ? 'FULL' : 'Frete Mercado Livre'
            });
          }
        }
      });
      return list;
    });

    return items.map(item => ({
      ...item,
      priceFormatted: `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      scrapedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.error('[ML Scraper Error]', err.message);
    return [];
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
module.exports = { scrapeMercadoLivre };
