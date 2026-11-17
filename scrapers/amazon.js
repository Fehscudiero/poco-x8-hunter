// scrapers/amazon.js - Scraper Amazon Brasil via Curl Resiliente (Zero 503)
const { execSync } = require('child_process');
const cheerio = require('cheerio');

function fetchAmazon(query, sortByPrice = false) {
  const q = encodeURIComponent(query);
  const sortParam = sortByPrice ? '&s=price-asc-rank' : '';
  const url = `https://www.amazon.com.br/s?k=${q}${sortParam}`;
  const curlCmd = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const cmd = `${curlCmd} -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" -H "Accept-Language: pt-BR,pt;q=0.9"`;

  try {
    const html = execSync(cmd, { maxBuffer: 15 * 1024 * 1024, timeout: 15000 }).toString();
    const $ = cheerio.load(html);
    const results = [];

    $('[data-asin]').each((_, el) => {
      const asin = $(el).attr('data-asin')?.trim();
      if (!asin || asin.length !== 10) return;

      const title = $(el).find('h2').text().trim();
      const whole = $(el).find('.a-price-whole').first().text().replace(/[^\d]/g, '');
      const fraction = $(el).find('.a-price-fraction').first().text().replace(/[^\d]/g, '') || '00';
      const link = $(el).find('a.a-link-normal[href*="/dp/"]').first().attr('href') || `/dp/${asin}`;
      const img = $(el).find('img.s-image').attr('src');
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
          link: link.startsWith('http') ? link : `https://www.amazon.com.br${link}`,
          image: img || 'https://via.placeholder.com/300?text=Sem+Foto',
          isPrime,
          badge: isPrime ? 'Prime' : 'Envio Amazon',
          rating,
          scrapedAt: new Date().toISOString()
        });
      }
    });
    return results;
  } catch (err) {
    console.error('[Amazon Error]', err.message);
    return [];
  }
}

async function scrapeAmazon(searchQuery) {
  const [res1, res2] = await Promise.allSettled([
    Promise.resolve(fetchAmazon('Xiaomi Poco X8 5G 256GB preto', true)),
    Promise.resolve(fetchAmazon('Smartphone Poco X8 256GB', false))
  ]);
  const list1 = res1.status === 'fulfilled' ? res1.value : [];
  const list2 = res2.status === 'fulfilled' ? res2.value : [];
  return Array.from(new Map([...list1, ...list2].map(i => [i.id, i])).values());
}

module.exports = { scrapeAmazon };
