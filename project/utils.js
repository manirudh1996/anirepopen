/* ─── Formatting ───────────────────────────────────────────────────────── */

window.fmtINR = function(v) {
  if (isNaN(v)) return '—';
  const abs = Math.abs(v);
  let s;
  if (abs >= 1e7) s = '₹' + (v/1e7).toFixed(2) + ' Cr';
  else if (abs >= 1e5) s = '₹' + (v/1e5).toFixed(2) + ' L';
  else s = '₹' + v.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  return s;
};

window.fmtLarge = function(v) {
  if (isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e7) return '₹' + (v/1e7).toFixed(2) + ' Cr';
  if (abs >= 1e5) return '₹' + (v/1e5).toFixed(2) + ' L';
  if (abs >= 1e3) return '₹' + (v/1e3).toFixed(1) + 'K';
  return '₹' + v.toFixed(0);
};

window.fmtPrice = function(v) {
  if (isNaN(v)) return '—';
  return '₹' + v.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
};

window.fmtPct = function(v, decimals=2) {
  if (isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(decimals) + '%';
};

/* ─── Seeded PRNG ──────────────────────────────────────────────────────── */
function seededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ─── Box-Muller normal random ────────────────────────────────────────── */
window.randNorm = function() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* ─── Generate fake 30-day price history ──────────────────────────────── */
window.genHistory = function(sym, currentPrice, days = 60) {
  const seed = sym.split('').reduce((a,c) => a + c.charCodeAt(0) * 31, 0);
  const rng = seededRng(seed);
  const vol = 0.018; // daily volatility ~1.8%
  const prices = [];
  let p = currentPrice * (0.88 + rng() * 0.18); // start 10-20% away
  for (let i = 0; i < days - 1; i++) {
    const drift = Math.log(currentPrice / p) / (days - i) * 0.4;
    p = p * Math.exp(drift + (rng() - 0.5) * vol * 2);
    prices.push(p);
  }
  prices.push(currentPrice);
  return prices;
};

/* ─── Monte Carlo GBM simulation ─────────────────────────────────────── */
// portfolio: [{ sym, qty, avgPrice, sector }]
// livePrices: { sym: { ltp } }
// Returns { percentiles: {p10,p25,p50,p75,p90}, finalVals, initialValue }
window.runMonteCarlo = function(portfolio, livePrices, profile = 'moderate', sims = 1000) {
  const multipliers = {
    conservative: { mu: 0.70, sigma: 0.80 },
    moderate:     { mu: 1.00, sigma: 1.00 },
    aggressive:   { mu: 1.30, sigma: 1.20 },
  };
  const m = multipliers[profile] || multipliers.moderate;

  // Compute total value & weighted sector params
  let totalValue = 0;
  let wMu = 0, wSigma = 0;
  const sectorAlloc = {};

  portfolio.forEach(h => {
    const price = livePrices[h.sym] ? livePrices[h.sym].ltp : h.avgPrice;
    const val = price * h.qty;
    totalValue += val;
    const meta = window.SECTOR_META[h.sector] || { mu:0.14, sigma:0.22 };
    sectorAlloc[h.sector] = (sectorAlloc[h.sector] || 0) + val;
    wMu    += val * meta.mu;
    wSigma += val * meta.sigma;
  });

  if (totalValue <= 0) return null;
  wMu    = (wMu    / totalValue) * m.mu;
  wSigma = (wSigma / totalValue) * m.sigma;

  const steps = 60; // monthly, 5 years
  const dt    = 1 / 12;
  const paths = [];

  for (let s = 0; s < sims; s++) {
    let v = totalValue;
    const path = [v];
    for (let t = 0; t < steps; t++) {
      const z = window.randNorm();
      v *= Math.exp((wMu - 0.5 * wSigma * wSigma) * dt + wSigma * Math.sqrt(dt) * z);
      path.push(v);
    }
    paths.push(path);
  }

  // Compute percentiles at each timestep
  const p10=[],p25=[],p50=[],p75=[],p90=[];
  for (let t = 0; t <= steps; t++) {
    const vals = paths.map(p => p[t]).sort((a,b) => a-b);
    p10.push(vals[Math.floor(0.10 * sims)]);
    p25.push(vals[Math.floor(0.25 * sims)]);
    p50.push(vals[Math.floor(0.50 * sims)]);
    p75.push(vals[Math.floor(0.75 * sims)]);
    p90.push(vals[Math.floor(0.90 * sims)]);
  }

  const finalVals = paths.map(p => p[steps]).sort((a,b) => a-b);
  const probProfit = finalVals.filter(v => v > totalValue).length / sims * 100;

  return {
    percentiles: {p10,p25,p50,p75,p90},
    finalVals,
    initialValue: totalValue,
    probProfit,
    sectorAlloc,
    wMu, wSigma,
    stats: {
      median:   p50[steps],
      best:     p90[steps],
      worst:    p10[steps],
      var5:     finalVals[Math.floor(0.05 * sims)],
      cagr:     (Math.pow(p50[steps] / totalValue, 1/5) - 1) * 100,
    }
  };
};

/* ─── Draw Monte Carlo chart on Canvas ───────────────────────────────── */
window.drawMCChart = function(canvas, result) {
  if (!canvas || !result) return;
  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const PAD  = { t:20, r:24, b:48, l:76 };
  const PW   = W - PAD.l - PAD.r;
  const PH   = H - PAD.t - PAD.b;
  const {p10,p25,p50,p75,p90} = result.percentiles;
  const N = p50.length;

  const allV = [...p10,...p90];
  const minV = Math.min(...allV) * 0.96;
  const maxV = Math.max(...allV) * 1.04;
  const xOf = t => PAD.l + (t/(N-1)) * PW;
  const yOf = v => PAD.t + PH - Math.max(0, Math.min(PH, ((v-minV)/(maxV-minV)) * PH));

  // Clear & background
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0F1E38';
  ctx.fillRect(0,0,W,H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(26,47,74,.9)';
  ctx.lineWidth = 1;
  for (let i=1;i<=4;i++) {
    const y = PAD.t + (i/5)*PH;
    ctx.beginPath(); ctx.moveTo(PAD.l,y); ctx.lineTo(PAD.l+PW,y); ctx.stroke();
  }
  [12,24,36,48].forEach(t => {
    const x = xOf(t);
    ctx.beginPath(); ctx.moveTo(x,PAD.t); ctx.lineTo(x,PAD.t+PH); ctx.stroke();
  });

  // Fill bands
  function fillBand(a1,a2,color) {
    ctx.beginPath();
    a1.forEach((v,i) => i===0 ? ctx.moveTo(xOf(i),yOf(v)) : ctx.lineTo(xOf(i),yOf(v)));
    for(let i=a2.length-1;i>=0;i--) ctx.lineTo(xOf(i),yOf(a2[i]));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  fillBand(p10,p90,'rgba(64,112,255,.07)');
  fillBand(p25,p75,'rgba(64,112,255,.13)');
  fillBand(p50,p75,'rgba(0,212,140,.07)');

  // Lines
  function drawLine(arr,color,width,dash=[]) {
    ctx.beginPath(); ctx.setLineDash(dash);
    ctx.strokeStyle=color; ctx.lineWidth=width;
    arr.forEach((v,i) => i===0 ? ctx.moveTo(xOf(i),yOf(v)) : ctx.lineTo(xOf(i),yOf(v)));
    ctx.stroke(); ctx.setLineDash([]);
  }
  drawLine(p10,'rgba(255,63,94,.55)',  1.5,[8,4]);
  drawLine(p25,'rgba(255,140,80,.4)', 1);
  drawLine(p75,'rgba(0,212,140,.45)', 1);
  drawLine(p90,'rgba(0,212,140,.65)', 1.5,[8,4]);
  drawLine(p50,'#4070FF',             2.5);

  // Initial value reference
  const yRef = yOf(result.initialValue);
  if (yRef > PAD.t && yRef < PAD.t+PH) {
    ctx.setLineDash([5,3]);
    ctx.strokeStyle='rgba(221,232,248,.2)';
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD.l,yRef); ctx.lineTo(PAD.l+PW,yRef); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(221,232,248,.3)';
    ctx.font='10px Space Mono,monospace';
    ctx.textAlign='left';
    ctx.fillText('Current',PAD.l+4,yRef-4);
  }

  // X labels
  ctx.fillStyle='#364F6B'; ctx.font='11px DM Sans,sans-serif'; ctx.textAlign='center';
  ctx.fillText('Now',xOf(0),PAD.t+PH+18);
  [12,24,36,48,60].forEach((t,i) => {
    if (t < N) ctx.fillText('Y'+(i+1), xOf(t), PAD.t+PH+18);
  });

  // Y labels
  ctx.textAlign='right'; ctx.font='10px Space Mono,monospace'; ctx.fillStyle='#364F6B';
  for(let i=0;i<=4;i++) {
    const v = minV + i*((maxV-minV)/4);
    ctx.fillText(window.fmtLarge(v), PAD.l-8, yOf(v)+3);
  }

  // Axis
  ctx.strokeStyle='rgba(26,47,74,1)'; ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(PAD.l,PAD.t); ctx.lineTo(PAD.l,PAD.t+PH); ctx.lineTo(PAD.l+PW,PAD.t+PH);
  ctx.stroke();

  // Legend
  const lg = [{c:'#4070FF',label:'Median (P50)'},{c:'rgba(0,212,140,.7)',label:'P75–P90'},{c:'rgba(255,63,94,.7)',label:'P10–P25'}];
  ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='left';
  let lx = PAD.l;
  lg.forEach(({c,label}) => {
    ctx.fillStyle=c; ctx.fillRect(lx,PAD.t+PH+32,16,3);
    ctx.fillStyle='#7090B8'; ctx.fillText(label, lx+20, PAD.t+PH+36);
    lx += 110;
  });
};

/* ─── Price chart ─────────────────────────────────────────────────────── */
window.drawPriceChart = function(canvas, prices, isUp) {
  if (!canvas || !prices || prices.length < 2) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { t:12, r:12, b:28, l:58 };
  const PW = W-PAD.l-PAD.r, PH = H-PAD.t-PAD.b;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0F1E38'; ctx.fillRect(0,0,W,H);

  const min = Math.min(...prices)*0.998, max = Math.max(...prices)*1.002;
  const xOf = i => PAD.l + (i/(prices.length-1))*PW;
  const yOf = v => PAD.t + PH - ((v-min)/(max-min))*PH;
  const color = isUp ? '#00D48C' : '#FF3F5E';

  // Gradient fill
  const grd = ctx.createLinearGradient(0,PAD.t,0,PAD.t+PH);
  grd.addColorStop(0, isUp ? 'rgba(0,212,140,.25)' : 'rgba(255,63,94,.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  prices.forEach((p,i) => i===0 ? ctx.moveTo(xOf(i),yOf(p)) : ctx.lineTo(xOf(i),yOf(p)));
  ctx.lineTo(xOf(prices.length-1), PAD.t+PH);
  ctx.lineTo(xOf(0), PAD.t+PH);
  ctx.closePath();
  ctx.fillStyle=grd; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.8;
  prices.forEach((p,i) => i===0 ? ctx.moveTo(xOf(i),yOf(p)) : ctx.lineTo(xOf(i),yOf(p)));
  ctx.stroke();

  // Grid lines
  ctx.strokeStyle='rgba(26,47,74,.7)'; ctx.lineWidth=.7;
  for(let i=1;i<=3;i++) {
    const y=PAD.t+(i/4)*PH;
    ctx.beginPath(); ctx.moveTo(PAD.l,y); ctx.lineTo(PAD.l+PW,y); ctx.stroke();
  }

  // Y labels
  ctx.fillStyle='#364F6B'; ctx.font='9.5px Space Mono,monospace'; ctx.textAlign='right';
  for(let i=0;i<=3;i++) {
    const v = min + i*((max-min)/3);
    ctx.fillText(fmtPrice(v), PAD.l-5, yOf(v)+3);
  }

  // X labels
  ctx.textAlign='center'; ctx.font='9.5px DM Sans,sans-serif';
  const marks=[0, Math.floor(prices.length/4), Math.floor(prices.length/2), Math.floor(prices.length*3/4), prices.length-1];
  const labs =['30D','22D','15D','7D','Now'];
  marks.forEach((m,i) => ctx.fillText(labs[i], xOf(m), PAD.t+PH+16));

  // Axis
  ctx.strokeStyle='rgba(26,47,74,1)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(PAD.l,PAD.t); ctx.lineTo(PAD.l,PAD.t+PH); ctx.lineTo(PAD.l+PW,PAD.t+PH); ctx.stroke();
};
