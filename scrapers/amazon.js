// scrapers/amazon.js - Scraper Amazon Brasil com Ordenação por Menor Preço
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchAmazonQuery(query, sortByPrice = false) {
  const q = encodeURIComponent(query);
  const sortParam = sortByPrice ? '&s=price-asc-rank' : '';
  const url = `https://www.amazon.com.br/s?k=${q}${sortParam}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
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
      // Pega o menor preço atualizado (evita preços riscados)
      const priceElement = $(el).find('.a-price:not([data-a-strike="true"])').first();
      const whole = priceElement.find('.a-price-whole').text().replace(/[^\d]/g, '');
      const fraction = priceElement.find('.a-price-fraction').text().replace(/[^\d]/g, '') || '00';
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
    return [];
  }
}

async function scrapeAmazon(searchQuery) {
  const [r1, r2] = await Promise.allSettled([
    fetchAmazonQuery(searchQuery, true),
    fetchAmazonQuery(searchQuery, false)
  ]);
  const list1 = r1.status === 'fulfilled' ? r1.value : [];
  const list2 = r2.status === 'fulfilled' ? r2.value : [];
  return Array.from(new Map([...list1, ...list2].map(i => [i.id, i])).values());
}

module.exports = { scrapeAmazon };
