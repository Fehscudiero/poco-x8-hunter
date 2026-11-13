// public/app.js - Lógica Reativa do Caçador de Preços (Parte 1)
let allItems = [];
let autoInterval = null;
let countdownSec = 180;
let isAutoRunning = false;

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

function setQuery(text) {
  document.getElementById('searchInput').value = text;
  triggerHunt();
}

async function triggerHunt() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const huntBtn = document.getElementById('huntBtn');
  const loadingGrid = document.getElementById('loadingGrid');
  const cardsGrid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');

  huntBtn.disabled = true;
  huntBtn.classList.add('opacity-70', 'cursor-not-allowed');
  huntBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>Caçando...</span>`;
  loadingGrid.classList.remove('hidden');
  cardsGrid.innerHTML = '';
  emptyState.classList.add('hidden');

  try {
    const res = await fetch(`/api/hunt?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    allItems = data.items || [];

    document.getElementById('lastUpdatedLabel').innerText = new Date().toLocaleTimeString('pt-BR');
    updateHighlights(data);
    applyFilters();
    loadHistory();

    const targetPrice = parseFloat(document.getElementById('targetPriceInput').value);
    if (data.bestDeal && targetPrice && data.bestDeal.price <= targetPrice) {
      playAlertSound();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎯 Preço Alvo Atingido!', {
          body: `${data.bestDeal.title.slice(0, 50)}... por apenas R$ ${data.bestDeal.price}!`,
          icon: data.bestDeal.image
        });
      }
    }
  } catch (err) {
    console.error('Erro na caçada:', err);
  } finally {
    huntBtn.disabled = false;
    huntBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    huntBtn.innerHTML = `<i class="fa-solid fa-bolt"></i><span>Caçar Preços Agora</span>`;
    loadingGrid.classList.add('hidden');
  }
}
function updateHighlights(data) {
  const winnerSec = document.getElementById('winnerSection');
  if (data.bestDeal) {
    winnerSec.classList.remove('hidden');
    document.getElementById('winnerImage').src = data.bestDeal.image;
    document.getElementById('winnerTitle').innerText = data.bestDeal.title;
    document.getElementById('winnerStore').innerText = data.bestDeal.marketplace;
    document.getElementById('winnerPrice').innerText = data.bestDeal.priceFormatted;
    document.getElementById('winnerLink').href = data.bestDeal.link;
    document.getElementById('winnerScore').innerText = `100% Exato: Xiaomi Poco X8 5G 256GB 8GB RAM Preto`;

    const maxPrice = Math.max(...allItems.map(i => i.price));
    if (maxPrice > data.bestDeal.price) {
      const diff = maxPrice - data.bestDeal.price;
      const pct = Math.round((diff / maxPrice) * 100);
      document.getElementById('winnerSavings').innerText = `Economia de até R$ ${diff.toFixed(2)} (${pct}% mais barato que o maior preço)`;
    }
  } else {
    winnerSec.classList.add('hidden');
  }

  // Amazon Best
  if (data.amazonLowest) {
    document.getElementById('amazonBestPrice').innerText = data.amazonLowest.priceFormatted;
    document.getElementById('amazonBestLink').href = data.amazonLowest.link;
  } else {
    document.getElementById('amazonBestPrice').innerText = 'Indisponível';
    document.getElementById('amazonBestLink').href = '#';
  }

  // ML Best
  if (data.mlLowest) {
    document.getElementById('mlBestPrice').innerText = data.mlLowest.priceFormatted;
    document.getElementById('mlBestLink').href = data.mlLowest.link;
  } else {
    document.getElementById('mlBestPrice').innerText = 'Indisponível';
    document.getElementById('mlBestLink').href = '#';
  }
}

function applyFilters() {
  const store = document.getElementById('storeFilter').value;
  const exactOnly = document.getElementById('exactMatchCheckbox').checked;

  let filtered = [...allItems];
  if (store !== 'ALL') {
    filtered = filtered.filter(i => i.marketplace === store);
  }
  if (exactOnly) {
    filtered = filtered.filter(i => i.isExactMatch);
  }

  renderCards(filtered);
}
function renderCards(items) {
  const cardsGrid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  document.getElementById('resultsCountBadge').innerText = `${items.length} itens`;

  if (items.length === 0) {
    cardsGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  cardsGrid.innerHTML = items.map((item, index) => `
    <div class="product-card bg-[#131b2e] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
      <div>
        <div class="product-image-container mb-3 border border-slate-800/80">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          <span class="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
            item.marketplace === 'Amazon' ? 'bg-[#232f3e] text-amber-400 border border-amber-500/30' : 'bg-yellow-400 text-slate-950 font-black'
          }">${item.marketplace}</span>
          ${item.badge ? `<span class="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">${item.badge}</span>` : ''}
        </div>
        <div class="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
          <span>Relevância: ${item.score}%</span>
          ${item.rating ? `<span class="text-amber-400"><i class="fa-solid fa-star text-[10px]"></i> ${item.rating.slice(0, 3)}</span>` : ''}
        </div>
        <h3 class="text-xs font-semibold text-slate-200 line-clamp-2 mb-3 leading-snug" title="${item.title}">${item.title}</h3>
      </div>
      <div class="pt-3 border-t border-slate-800/80">
        <div class="text-xs text-slate-400 mb-0.5">Preço à vista</div>
        <div class="text-lg font-black text-white mb-3">${item.priceFormatted}</div>
        <a href="${item.link}" target="_blank" rel="noopener noreferrer"
          class="w-full py-2 bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-200 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 text-center">
          <span>Ver Oferta na Loja</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
      </div>
    </div>
  `).join('');
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    const tbody = document.getElementById('historyTableBody');
    if (!data.history || data.history.length === 0) return;

    tbody.innerHTML = data.history.slice(-8).reverse().map(h => `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-2.5 px-3 font-mono text-slate-400">${new Date(h.timestamp).toLocaleTimeString('pt-BR')}</td>
        <td class="py-2.5 px-3 truncate max-w-[150px]">${h.query}</td>
        <td class="py-2.5 px-3 font-bold text-emerald-400">R$ ${h.bestDeal ? h.bestDeal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}</td>
        <td class="py-2.5 px-3">${h.bestDeal ? h.bestDeal.marketplace : '--'}</td>
        <td class="py-2.5 px-3 text-right">
          ${h.bestDeal ? `<a href="${h.bestDeal.link}" target="_blank" class="text-orange-400 hover:underline">Abrir</a>` : '-'}
        </td>
      </tr>
    `).join('');
  } catch (_) {}
}

function toggleAutoTimer() {
  const btn = document.getElementById('autoTimerBtn');
  const label = document.getElementById('autoTimerLabel');
  isAutoRunning = !isAutoRunning;

  if (isAutoRunning) {
    btn.classList.add('bg-orange-500/20', 'border-orange-500/50', 'text-orange-400');
    label.innerText = 'Ativo (3m)';
    countdownSec = 180;
    autoInterval = setInterval(() => {
      countdownSec--;
      const min = Math.floor(countdownSec / 60);
      const sec = countdownSec % 60;
      document.getElementById('countdownLabel').innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
      if (countdownSec <= 0) {
        countdownSec = 180;
        triggerHunt();
      }
    }, 1000);
  } else {
    clearInterval(autoInterval);
    btn.classList.remove('bg-orange-500/20', 'border-orange-500/50', 'text-orange-400');
    label.innerText = 'Auto (3 min)';
    document.getElementById('countdownLabel').innerText = '--:--';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  loadHistory();
  triggerHunt(); // Disparo inicial ao carregar a página
});
