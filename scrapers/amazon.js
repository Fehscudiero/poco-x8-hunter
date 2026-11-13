// scrapers/amazon.js - Scraper Otimizado Amazon Brasil
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAmazon(searchQuery) {
  const q = encodeURIComponent(searchQuery);
  const url = `https://www.amazon.com.br/s?k=${q}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Fetch-Site': 'none'
  };

  try {
    const res = await axios.get(url, { headers, timeout: 12000 });
    const $ = cheerio.load(res.data);
    const results = [];

    $('[data-asin]').each((_, el) => {
      const asin = $(el).attr('data-asin')?.trim();
      if (!asin) return;

      const title = $(el).find('h2').text().trim();
      const whole = $(el).find('.a-price-whole').first().text().replace(/[^\d]/g, '');
      const fraction = $(el).find('.a-price-fraction').first().text().replace(/[^\d]/g, '') || '00';
      const linkPath = $(el).find('a.a-link-normal[href*="/dp/"]').first().attr('href') || `/dp/${asin}`;
      const image = $(el).find('img.s-image').attr('src');
      const isPrime = $(el).find('.a-icon-prime').length > 0;
      const rating = $(el).find('.a-icon-alt').first().text().trim() || null;

      if (title && whole) {
        const price = parseFloat(`${whole}.${fraction}`);
        results.push({
          id: `amz-${asin}`,
          marketplace: 'Amazon',
          title,
          price,
          priceFormatted: `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          link: linkPath.startsWith('http') ? linkPath : `https://www.amazon.com.br${linkPath}`,
          image: image || 'https://via.placeholder.com/300?text=Sem+Foto',
          isPrime,
          badge: isPrime ? 'Prime' : 'Envio Amazon',
          rating,
          scrapedAt: new Date().toISOString()
        });
      }
    });
    return results;
  } catch (err) {
    console.error('[Amazon Scraper Error]', err.message);
    return [];
  }
}

module.exports = { scrapeAmazon };
