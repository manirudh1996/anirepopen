// components/Dashboard.jsx
const { useState, useEffect, useMemo } = React;

function IndexTicker({ indices }) {
  const doubled = [...indices, ...indices];
  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {doubled.map((idx, i) => (
          <div key={i} className="ticker-item">
            <span className="t-name">{idx.name}</span>
            <span className="t-val">{idx.value.toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            <span className={`t-chg ${idx.pct >= 0 ? 'up' : 'down'}`}>
              {idx.pct >= 0 ? '▲' : '▼'} {Math.abs(idx.pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorHeatmap({ livePrices, navigate }) {
  const sectors = Object.keys(window.SECTOR_META);
  const sectorData = sectors.map(sec => {
    const stocks = window.ALL_STOCKS.filter(s => s.sector === sec);
    const avgPct = stocks.reduce((a, s) => {
      const lp = livePrices[s.sym];
      return a + (lp ? lp.pct : s.pct);
    }, 0) / stocks.length;
    return { sec, label: sec, avgPct, color: window.SECTOR_META[sec].color };
  });

  function getBg(pct) {
    if (pct >= 1.5) return 'rgba(0,212,140,.22)';
    if (pct >= 0.5) return 'rgba(0,212,140,.12)';
    if (pct > -0.5) return 'rgba(112,144,184,.08)';
    if (pct > -1.5) return 'rgba(255,63,94,.12)';
    return 'rgba(255,63,94,.22)';
  }

  return (
    <div>
      <div className="card-head" style={{borderRadius:'9px 9px 0 0'}}>
        <span className="card-head-title">Sector Performance</span>
        <span style={{fontSize:11,color:'var(--t3)'}}>Today</span>
      </div>
      <div style={{padding:'14px',background:'var(--card)',borderRadius:'0 0 9px 9px',border:'1px solid var(--border)',borderTop:'none'}}>
        <div className="heatmap">
          {sectorData.map(({sec,label,avgPct,color}) => (
            <div
              key={sec}
              className="heat-cell"
              style={{background:getBg(avgPct),border:`1px solid ${avgPct>=0?'rgba(0,212,140,.15)':'rgba(255,63,94,.15)'}`}}
              onClick={() => navigate('markets', sec)}
            >
              <div className="heat-name" style={{color}}>{label}</div>
              <div className="heat-val" style={{color: avgPct>=0?'var(--green)':'var(--red)'}}>
                {avgPct >= 0 ? '+' : ''}{avgPct.toFixed(2)}%
              </div>
              <div className="heat-pct" style={{color:'var(--t3)'}}>
                {window.ALL_STOCKS.filter(s=>s.sector===sec).length} stocks
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoverTable({ stocks, livePrices, type, navigate }) {
  const sorted = [...stocks]
    .map(s => ({...s, curPct: livePrices[s.sym] ? livePrices[s.sym].pct : s.pct}))
    .sort((a,b) => type==='gain' ? b.curPct-a.curPct : a.curPct-b.curPct)
    .slice(0, 6);

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-head-title">{type==='gain' ? '📈 Top Gainers' : '📉 Top Losers'}</span>
        <span className={`badge ${type==='gain'?'badge-g':'badge-r'}`}>Today</span>
      </div>
      <table className="dt" style={{width:'100%'}}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>LTP</th>
            <th>Chg%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => {
            const lp = livePrices[s.sym] || s;
            return (
              <tr key={s.sym} onClick={() => navigate('trade', s.sym)}>
                <td>
                  <div className="sym">{s.sym}</div>
                  <div className="name-cell">{s.name}</div>
                </td>
                <td className="num">{fmtPrice(lp.ltp || s.ltp)}</td>
                <td className={`num ${lp.pct >= 0 ? 'up' : 'down'}`}>
                  {lp.pct >= 0 ? '+' : ''}{(lp.pct||0).toFixed(2)}%
                </td>
                <td>
                  <button className={`btn btn-sm ${type==='gain'?'btn-buy':'btn-sell'}`}
                    onClick={e=>{e.stopPropagation();navigate('trade',s.sym)}}>
                    {type==='gain'?'Buy':'Sell'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({ livePrices, portfolio, credits, navigate }) {
  const portfolioValue = portfolio.reduce((sum, h) => {
    const lp = livePrices[h.sym];
    return sum + (lp ? lp.ltp : h.avgPrice) * h.qty;
  }, 0);

  const invested = portfolio.reduce((sum, h) => sum + h.avgPrice * h.qty, 0);
  const todayPL  = portfolio.reduce((sum, h) => {
    const lp = livePrices[h.sym];
    if (!lp) return sum;
    return sum + lp.chg * h.qty;
  }, 0);
  const totalPL  = portfolioValue - invested;
  const totalPLPct = invested > 0 ? (totalPL / invested * 100) : 0;

  const indices = useMemo(() => {
    return window.INDICES.map(idx => ({
      ...idx,
      value: idx.value * (1 + (Math.random()-0.5)*0.0001),
    }));
  }, []);

  return (
    <div className="page fade-up">
      <IndexTicker indices={indices} />

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-val">{fmtLarge(portfolioValue)}</div>
          <div className={`stat-delta ${totalPL>=0?'up':'down'}`}>
            {fmtINR(totalPL)} ({fmtPct(totalPLPct)}) all time
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's P&L</div>
          <div className={`stat-val ${todayPL>=0?'up':'down'}`}>{fmtINR(todayPL)}</div>
          <div className="stat-hint">
            {portfolio.length} positions active
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-val">{fmtLarge(invested)}</div>
          <div className="stat-hint">{portfolio.length} holdings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Credits</div>
          <div className="stat-val up">{fmtLarge(credits)}</div>
          <div className="stat-hint">Paper trading account</div>
        </div>
      </div>

      {/* Movers */}
      <div className="grid-2">
        <MoverTable stocks={window.ALL_STOCKS} livePrices={livePrices} type="gain" navigate={navigate} />
        <MoverTable stocks={window.ALL_STOCKS} livePrices={livePrices} type="loss" navigate={navigate} />
      </div>

      {/* Sector Heatmap */}
      <SectorHeatmap livePrices={livePrices} navigate={navigate} />
    </div>
  );
}

window.Dashboard = Dashboard;
