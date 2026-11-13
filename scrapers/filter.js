// scrapers/filter.js - Filtro Rigoroso & Preciso Poco X8 256GB 8GB RAM
const NOISE = ['capa', 'capinha', 'pelicula', 'película', 'case', 'carregador', 'cabo', 'fone', 'suporte'];

function isStrictPocoX8(title, price) {
  if (price && price < 800) return false;
  const t = title.toLowerCase();

  if (NOISE.some(n => new RegExp(`\\b${n}\\b`, 'i').test(t))) return false;

  // 1. Obrigatório: Poco E X8
  if (!t.includes('poco') || !/\bx8\b/i.test(t)) return false;
  // Bloqueia outros modelos
  if (/\b(x7|x6|x5|x4|m6|m7|m8|f6|f7|note)\b/i.test(t)) return false;

  // 2. Obrigatório: 256GB (bloqueia 64, 128, 512, 1TB)
  if (!/256\s*(gb)?/i.test(t)) return false;
  if (/\b(512\s*gb|128\s*gb|1\s*tb|64\s*gb)\b/i.test(t)) return false;

  // 3. Obrigatório: 8GB RAM (bloqueia 4, 6, 12, 16)
  const has8GB = /(8\s*gb|8\s*ram|8ram|\b8g\b)/i.test(t);
  if (!has8GB) return false;
  if (/\b(12\s*gb|6\s*gb|16\s*gb|4\s*gb)\b/i.test(t)) return false;

  // 4. Bloqueia cores concorrentes (azul, verde, branco, amarelo) a menos que seja preto
  const isBlack = /(preto|black|dark|noir)/i.test(t);
  const otherColors = /(azul|blue|branco|white|amarelo|yellow|verde|green|dourado|gold|prata)/i.test(t);
  if (otherColors && !isBlack) return false;

  return true;
}

function processAndSort(items) {
  const strictItems = items.filter(i => isStrictPocoX8(i.title, i.price));
  strictItems.forEach(i => {
    i.score = 100;
    i.isExactMatch = true;
  });
  // Ordena rigorosamente do menor para o maior preço
  return strictItems.sort((a, b) => a.price - b.price);
}

module.exports = { isStrictPocoX8, processAndSort };
