# 🎯 Poco X8 Hunter - Caçador de Preços ao Vivo

Monitoramento e rastreamento em tempo real do menor preço do **Xiaomi Poco X8 5G 256GB Dual SIM 8GB RAM Preto** na **Amazon Brasil** e no **Mercado Livre**.

## 🚀 Links do Projeto
- **Repositório GitHub:** [https://github.com/Fehscudiero/poco-x8-hunter](https://github.com/Fehscudiero/poco-x8-hunter)
- **Deploy Vercel:** [https://celular-plum.vercel.app](https://celular-plum.vercel.app)

## ⚡ Recursos Principais
- **100% Exclusivo:** Filtro rigoroso por Regex que elimina outros modelos (X7, X6, M8, 128GB, 512GB, 12GB RAM e outras cores).
- **Anti-Ruído:** Descarte automático de capinhas, películas e acessórios.
- **Top 1 Campeão:** Identifica o melhor preço absoluto entre os marketplaces com cálculo de economia.
- **Comparativo Direto:** Menor preço Amazon vs Menor preço Mercado Livre lado a lado.
- **Caçador Automático:** Ciclo de varredura periódica em segundo plano com contagem regressiva.
- **Alerta Sonoro:** Chime em tempo real via Web Audio API ao atingir o preço alvo.
- **Design 100% Mobile First:** Interface ultra fluida, dark mode, zero Cumulative Layout Shift (CLS).

## 🛠️ Tecnologias
- **Backend:** Node.js, Express, Axios, Cheerio, Puppeteer Stealth
- **Frontend:** Vanilla JS reativo, Tailwind CSS, FontAwesome, Web Audio API
- **Infraestrutura:** Vercel Serverless & GitHub Actions / Webhooks

## 💻 Como Rodar Localmente
```bash
git clone https://github.com/Fehscudiero/poco-x8-hunter.git
cd poco-x8-hunter
npm install
npm start
```
Acesse `http://localhost:3000`.
