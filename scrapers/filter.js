// scrapers/filter.js - Filtro 100% Exclusivo: Xiaomi Poco X8 5G 256GB Preto
const NOISE = ['capa', 'capinha', 'pelicula', 'película', 'case', 'carregador', 'cabo', 'fone', 'suporte', 'adaptador'];

function isStrictPocoX8(title, price) {
  if (price && price < 800) return false;
  const t = title.toLowerCase();

  // Elimina acessórios
  if (NOISE.some(n => new RegExp(`\\b${n}\\b`, 'i').test(t))) return false;

  // 1. Obrigatório: Poco E X8
  if (!t.includes('poco') || !/\bx8\b/i.test(t)) return false;

  // 2. EXCLUSÃO TOTAL de outras gerações e marcas (X7, X6, X5, M8, Redmi, Note)
  if (/\b(x7|x6|x5|x4|m6|m7|m8|f6|f7|note|redmi)\b/i.test(t)) return false;

  // 3. Obrigatório: 256GB (elimina 128, 512, 1TB)
  if (!/256\s*(gb)?/i.test(t)) return false;
  if (/\b(512\s*gb|128\s*gb|1\s*tb|64\s*gb)\b/i.test(t)) return false;

  // 4. Bloqueia cores concorrentes quando não for preto
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
  return strictItems.sort((a, b) => a.price - b.price);
}

module.exports = { isStrictPocoX8, processAndSort };
