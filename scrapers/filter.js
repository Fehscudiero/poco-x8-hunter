// scrapers/filter.js - Filtro Inteligente Anti-Ruído e Cálculo de Relevância
const NOISE_WORDS = [
  'capa', 'capinha', 'película', 'pelicula', 'case', 'carregador',
  'cabo', 'fone', 'bumper', 'protetor', 'suporte', 'adesivo', 'bateria'
];

function isNoise(title, price) {
  if (price && price < 450) return true; // Elimina acessórios baratos
  const lower = title.toLowerCase();
  return NOISE_WORDS.some(word => {
    const reg = new RegExp(`\\b${word}\\b`, 'i');
    return reg.test(lower);
  });
}

function calculateScore(title, targetTerms = {}) {
  const lower = title.toLowerCase();
  let score = 0;

  if (lower.includes('xiaomi') || lower.includes('poco')) score += 25;
  if (lower.includes('x8') || lower.includes('x7')) score += 30;
  if (lower.includes('256')) score += 20;
  if (lower.includes('8gb') || lower.includes('8 gb') || lower.includes('8g')) score += 15;
  if (lower.includes('preto') || lower.includes('black')) score += 10;
  if (lower.includes('5g')) score += 10;
  if (lower.includes('dual sim') || lower.includes('dual-sim')) score += 5;

  return score;
}

function processAndSort(items, query = '') {
  const valid = items.filter(it => !isNoise(it.title, it.price));
  valid.forEach(it => {
    it.score = calculateScore(it.title);
    it.isExactMatch = it.score >= 80;
  });
  // Ordena primeiro por menor preço dentro de relevância alta, depois gerais
  return valid.sort((a, b) => {
    if (a.isExactMatch && !b.isExactMatch) return -1;
    if (!a.isExactMatch && b.isExactMatch) return 1;
    return a.price - b.price;
  });
}

module.exports = { isNoise, calculateScore, processAndSort };
