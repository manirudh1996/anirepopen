// components/Watchlist.jsx
const { useState } = React;

function Watchlist({ watchlist, setWatchlist, livePrices, navigate }) {
  const stocks = watchlist.map(sym => {
    const s = window.STOCK_MAP[sym];
    if (!s) return null;
    const lp = livePrices[sym];
    return { ...s, ltp: lp ? lp.ltp : s.ltp, chg: lp ? lp.chg : s.chg, pct: lp ? lp.pct : s.pct };
  }).filter(Boolean);

  if (!watchlist.length) return (
    <div className="page fade-up">
      <div className="ph"><div className="ph-title">Watchlist</div></div>
      <div className="empty" style={{marginTop:60}}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 6l4.9 10.2L40 17.8l-8 7.9 1.9 11.1L24 31.3l-9.9 5.5 1.9-11.1-8-7.9 11.1-1.6L24 6z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
        <div className="empty-title">Your watchlist is empty</div>
        <div className="empty-sub">Star stocks in the Markets screen to add them here</div>
        <button className="btn btn-primary" onClick={()=>navigate('markets')}>Browse Markets</button>
      </div>
    </div>
  );

  return (
    <div className="page fade-up">
      <div className="ph">
        <div>
          <div className="ph-title">Watchlist</div>
          <div className="ph-sub">{watchlist.length} stocks tracked</div>
        </div>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <table className="dt">
          <thead>
            <tr>
              <th>Stock</th>
              <th>LTP</th>
              <th>Change</th>
              <th>Chg%</th>
              <th>Volume</th>
              <th>Mkt Cap</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(s => (
              <tr key={s.sym} onClick={()=>navigate('trade',s.sym)}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{
                      width:32,height:32,borderRadius:8,flexShrink:0,
                      background:`${window.SECTOR_META[s.sector]?.color||'var(--accent)'}1A`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'var(--f-head)',fontWeight:700,fontSize:11,
                      color:window.SECTOR_META[s.sector]?.color||'var(--accent)'
                    }}>{s.sym.slice(0,2)}</div>
                    <div>
                      <div className="sym">{s.sym}</div>
                      <div className="name-cell">{s.name}</div>
                    </div>
                  </div>
                </td>
                <td className="num" style={{fontWeight:600}}>{fmtPrice(s.ltp)}</td>
                <td className={`num ${s.chg>=0?'up':'down'}`}>{s.chg>=0?'+':''}{s.chg.toFixed(2)}</td>
                <td><span className={`badge ${s.pct>=0?'badge-g':'badge-r'}`}>{s.pct>=0?'▲':'▼'} {Math.abs(s.pct).toFixed(2)}%</span></td>
                <td className="num muted">{s.vol}</td>
                <td className="num muted">{s.cap}</td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:6}}>
                    <button className="btn btn-sm btn-buy" onClick={()=>navigate('trade',s.sym)}>Buy</button>
                    <button
                      style={{background:'none',border:'none',cursor:'pointer',color:'var(--yellow)',fontSize:16,lineHeight:1,padding:'4px'}}
                      onClick={()=>setWatchlist(w=>w.filter(x=>x!==s.sym))}
                      title="Remove from watchlist"
                    >★</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Watchlist = Watchlist;
