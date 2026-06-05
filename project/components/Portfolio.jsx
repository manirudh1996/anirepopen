// components/Portfolio.jsx
const { useState, useMemo } = React;

function SectorBar({ portfolio, livePrices }) {
  const bySecVal = {};
  portfolio.forEach(h => {
    const lp = livePrices[h.sym];
    const val = (lp ? lp.ltp : h.avgPrice) * h.qty;
    bySecVal[h.sector] = (bySecVal[h.sector] || 0) + val;
  });
  const total = Object.values(bySecVal).reduce((a,b)=>a+b,0);
  const entries = Object.entries(bySecVal).sort((a,b)=>b[1]-a[1]);

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-head-title">Sector Allocation</span>
      </div>
      <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
        {entries.map(([sec, val]) => {
          const pct = total>0 ? val/total*100 : 0;
          const color = window.SECTOR_META[sec]?.color || 'var(--accent)';
          return (
            <div key={sec}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:color,display:'inline-block'}}></span>
                  {sec}
                </span>
                <span style={{fontFamily:'var(--f-mono)',fontSize:12,color:'var(--t1)'}}>
                  {fmtLarge(val)} <span style={{color:'var(--t3)'}}>{pct.toFixed(1)}%</span>
                </span>
              </div>
              <div style={{height:4,background:'var(--raised)',borderRadius:2,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:2,transition:'width .4s ease'}}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Portfolio({ portfolio, livePrices, onSell, navigate }) {
  const [sortKey, setSortKey] = useState('pl');
  const [sortDir, setSortDir] = useState(-1);
  const [confirmSell, setConfirmSell] = useState(null);
  const [sellQty, setSellQty] = useState('');

  const rows = useMemo(() => portfolio.map(h => {
    const lp = livePrices[h.sym];
    const ltp     = lp ? lp.ltp : h.avgPrice;
    const curVal  = ltp * h.qty;
    const invVal  = h.avgPrice * h.qty;
    const pl      = curVal - invVal;
    const plPct   = invVal > 0 ? pl/invVal*100 : 0;
    const dayPL   = lp ? lp.chg * h.qty : 0;
    return {...h, ltp, curVal, invVal, pl, plPct, dayPL};
  }).sort((a,b) => (a[sortKey]-b[sortKey])*sortDir), [portfolio, livePrices, sortKey, sortDir]);

  const totalInv  = rows.reduce((s,h)=>s+h.invVal,0);
  const totalCur  = rows.reduce((s,h)=>s+h.curVal,0);
  const totalPL   = totalCur - totalInv;
  const totalPLPct = totalInv>0 ? totalPL/totalInv*100 : 0;
  const dayTotal  = rows.reduce((s,h)=>s+h.dayPL,0);

  function handleSort(k) {
    if (sortKey===k) setSortDir(d=>-d);
    else { setSortKey(k); setSortDir(-1); }
  }
  function SortArrow({k}) {
    return sortKey===k
      ? <span style={{marginLeft:3,opacity:.8}}>{sortDir>0?'↑':'↓'}</span>
      : <span style={{marginLeft:3,opacity:.2}}>↕</span>;
  }

  function doSell(holding) {
    const qty = parseInt(sellQty);
    if (!qty || qty < 1 || qty > holding.qty) return;
    onSell(holding.sym, qty, holding.ltp);
    setConfirmSell(null);
    setSellQty('');
  }

  if (!portfolio.length) return (
    <div className="page fade-up">
      <div className="ph"><div className="ph-title">Portfolio</div></div>
      <div className="empty" style={{marginTop:60}}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="14" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 14v-4a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 26v4M22 28h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="empty-title">No holdings yet</div>
        <div className="empty-sub">Start trading to build your paper portfolio</div>
        <button className="btn btn-primary" onClick={()=>navigate('trade')}>Go to Trade</button>
      </div>
    </div>
  );

  return (
    <div className="page fade-up">
      <div className="ph">
        <div>
          <div className="ph-title">Portfolio</div>
          <div className="ph-sub">{portfolio.length} holdings · Paper account</div>
        </div>
        <button className="btn btn-primary" onClick={()=>navigate('compass')}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 6L7 8l3 2-1-2 1-2z" fill="currentColor"/>
          </svg>
          Portfolio Compass
        </button>
      </div>

      {/* Header summary */}
      <div className="port-header">
        <div className="port-col">
          <div className="port-col-label">Current Value</div>
          <div className="port-col-val">{fmtLarge(totalCur)}</div>
          <div className="port-col-sub muted">{portfolio.length} stocks</div>
        </div>
        <div className="port-col">
          <div className="port-col-label">Total Invested</div>
          <div className="port-col-val">{fmtLarge(totalInv)}</div>
          <div className="port-col-sub muted">Cost basis</div>
        </div>
        <div className="port-col">
          <div className="port-col-label">Total P&amp;L</div>
          <div className={`port-col-val ${totalPL>=0?'up':'down'}`}>{fmtINR(totalPL)}</div>
          <div className={`port-col-sub ${totalPL>=0?'up':'down'}`}>{fmtPct(totalPLPct)}</div>
        </div>
        <div className="port-col">
          <div className="port-col-label">Today's P&amp;L</div>
          <div className={`port-col-val ${dayTotal>=0?'up':'down'}`}>{fmtINR(dayTotal)}</div>
          <div className="port-col-sub muted">Day change</div>
        </div>
      </div>

      <div className="grid-2" style={{alignItems:'start'}}>
        {/* Holdings table */}
        <div className="card" style={{overflow:'hidden',gridColumn:'1/3'}}>
          <div className="card-head">
            <span className="card-head-title">Holdings</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th onClick={()=>handleSort('qty')} style={{cursor:'pointer'}}>Qty <SortArrow k="qty"/></th>
                  <th onClick={()=>handleSort('avgPrice')} style={{cursor:'pointer'}}>Avg Price <SortArrow k="avgPrice"/></th>
                  <th>LTP</th>
                  <th onClick={()=>handleSort('curVal')} style={{cursor:'pointer'}}>Curr Value <SortArrow k="curVal"/></th>
                  <th onClick={()=>handleSort('pl')} style={{cursor:'pointer'}}>P&amp;L <SortArrow k="pl"/></th>
                  <th onClick={()=>handleSort('plPct')} style={{cursor:'pointer'}}>P&amp;L % <SortArrow k="plPct"/></th>
                  <th>Day P&amp;L</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(h => (
                  <tr key={h.sym} onClick={()=>navigate('trade',h.sym)}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{
                          width:32,height:32,borderRadius:8,
                          background:`${window.SECTOR_META[h.sector]?.color||'var(--accent)'}1A`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontFamily:'var(--f-head)',fontWeight:700,fontSize:11,
                          color:window.SECTOR_META[h.sector]?.color||'var(--accent)',flexShrink:0
                        }}>{h.sym.slice(0,2)}</div>
                        <div>
                          <div className="sym">{h.sym}</div>
                          <div className="name-cell">{h.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">{h.qty}</td>
                    <td className="num">{fmtPrice(h.avgPrice)}</td>
                    <td className={`num ${h.ltp>h.avgPrice?'up':'down'}`}>{fmtPrice(h.ltp)}</td>
                    <td className="num">{fmtINR(h.curVal)}</td>
                    <td className={`num ${h.pl>=0?'up':'down'}`}>{h.pl>=0?'+':''}{fmtINR(h.pl)}</td>
                    <td>
                      <span className={`badge ${h.plPct>=0?'badge-g':'badge-r'}`}>
                        {h.plPct>=0?'+':''}{h.plPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className={`num ${h.dayPL>=0?'up':'down'}`}>{h.dayPL>=0?'+':''}{fmtINR(h.dayPL)}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-sm btn-sell" onClick={()=>{setConfirmSell(h);setSellQty(String(h.qty));}}>
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectorBar portfolio={portfolio} livePrices={livePrices} />
      </div>

      {/* Sell modal */}
      {confirmSell && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'var(--raised)',border:'1px solid var(--border2)',borderRadius:'var(--r3)',padding:28,width:340}}>
            <div style={{fontFamily:'var(--f-head)',fontSize:17,fontWeight:700,marginBottom:4}}>Sell {confirmSell.sym}</div>
            <div style={{fontSize:12.5,color:'var(--t2)',marginBottom:20}}>You hold {confirmSell.qty} shares · Avg {fmtPrice(confirmSell.avgPrice)}</div>
            <div className="form-group" style={{marginBottom:16}}>
              <label className="form-label">Quantity to Sell</label>
              <input className="input" type="number" min="1" max={confirmSell.qty} value={sellQty} onChange={e=>setSellQty(e.target.value)} />
            </div>
            <div style={{background:'var(--card)',borderRadius:'var(--r1)',padding:'12px 14px',marginBottom:18}}>
              <div className="summary-row">
                <span className="summary-key">Sell Qty</span>
                <span className="summary-val">{sellQty || '—'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-key">At Price</span>
                <span className="summary-val">{fmtPrice(confirmSell.ltp)}</span>
              </div>
              <div className="summary-row" style={{borderBottom:'none'}}>
                <span className="summary-key">Proceeds</span>
                <span className="summary-val up">{fmtINR(confirmSell.ltp * (parseInt(sellQty)||0))}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost btn-full" onClick={()=>setConfirmSell(null)}>Cancel</button>
              <button className="btn btn-sell btn-full" onClick={()=>doSell(confirmSell)}>Confirm Sell</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.Portfolio = Portfolio;
