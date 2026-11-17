// scrapers/mercadolivre.js - Scraper de Elite Mercado Livre Multiplataforma
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

function getBrowserPath() {
  const win = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const linux1 = '/usr/bin/google-chrome';
  const linux2 = '/usr/bin/chromium-browser';

  if (fs.existsSync(win)) return win;
  if (fs.existsSync(edge)) return edge;
  if (fs.existsSync(linux1)) return linux1;
  if (fs.existsSync(linux2)) return linux2;
  return undefined;
}

async function scrapeTab(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForSelector('.poly-card, .ui-search-layout__item, .andes-money-amount', { timeout: 10000 });
    return await page.evaluate(() => {
      const list = [];
      document.querySelectorAll('.poly-card, .ui-search-layout__item').forEach((card, idx) => {
        const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title');
        const currentWrap = card.querySelector('.poly-price__current, .andes-money-amount-combo__main-container') || card;
        const priceEl = currentWrap.querySelector('.andes-money-amount__fraction') || card.querySelector('.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__fraction');
        const centsEl = currentWrap.querySelector('.andes-money-amount__cents') || card.querySelector('.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__cents');
        const linkEl = card.querySelector('a');
        const imgEl = card.querySelector('img');
        const isFull = !!card.querySelector('.poly-component__shipped-from, .ui-search-item__fulfillment');

        if (titleEl && priceEl) {
          const raw = priceEl.innerText.trim().replace(/\./g, '') + (centsEl ? '.' + centsEl.innerText.trim() : '');
          const price = parseFloat(raw);
          if (!isNaN(price) && price >= 800) {
            list.push({
              id: `mlb-${idx}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
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
  } catch (_) { return []; }
}

async function scrapeMercadoLivre(searchQuery) {
  const browserPath = getBrowserPath();
  if (!browserPath) return []; // Retorna vazio se não houver Chrome disponível
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    const slug = encodeURIComponent(searchQuery.trim().replace(/\s+/g, '-'));

    const [ascItems, stdItems] = await Promise.all([
      scrapeTab(page1, `https://lista.mercadolivre.com.br/${slug}_OrderId_PRICE_ASC_NoIndex_True`),
      scrapeTab(page2, `https://lista.mercadolivre.com.br/${slug}`)
    ]);

    const combined = [...ascItems, ...stdItems];
    return combined.map(item => ({
      ...item,
      priceFormatted: `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      scrapedAt: new Date().toISOString()
    }));
  } catch (err) {
    return [];
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
module.exports = { scrapeMercadoLivre };
