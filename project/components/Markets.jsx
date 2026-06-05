// components/Markets.jsx
const { useState, useMemo } = React;

function Sparkline({ data, up }) {
  if (!data || data.length < 2) return null;
  const W = 72, H = 26;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 2 - ((v - min) / range) * (H - 4)
  ]);
  const d = pts.map((p, i) => `${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} style={{display:'block'}}>
      <path d={d} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SECTORS = ['ALL','IT','BANKING','PHARMA','AUTO','FMCG','ENERGY','METALS','TELECOM','REALTY','INFRA'];

function Markets({ livePrices, watchlist, setWatchlist, navigate, initialSector }) {
  const [sector, setSector] = useState(initialSector || 'ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('pct');
  const [sortDir, setSortDir] = useState(-1);

  const filtered = useMemo(() => {
    let list = window.ALL_STOCKS.map(s => {
      const lp = livePrices[s.sym];
      return { ...s, ltp: lp ? lp.ltp : s.ltp, chg: lp ? lp.chg : s.chg, pct: lp ? lp.pct : s.pct };
    });
    if (sector !== 'ALL') list = list.filter(s => s.sector === sector);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1; if (bv == null) return -1;
      return (av - bv) * sortDir;
    });
  }, [sector, search, sortKey, sortDir, livePrices]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  function toggleWatch(sym) {
    setWatchlist(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  }

  const SortArrow = ({ k }) => sortKey===k
    ? <span style={{marginLeft:3,opacity:.8}}>{sortDir>0?'↑':'↓'}</span>
    : <span style={{marginLeft:3,opacity:.2}}>↕</span>;

  return (
    <div className="page fade-up">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="ph-title">Markets</div>
          <div className="ph-sub">{filtered.length} instruments · NSE · Live prices</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div className="topbar-search" style={{width:220}}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="var(--t3)" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input placeholder="Search symbol or name…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sector tabs */}
      <div className="tabs" style={{overflowX:'auto',gap:4,flexWrap:'wrap'}}>
        {SECTORS.map(s => (
          <button key={s} className={`tab${sector===s?' active':''}`} onClick={()=>setSector(s)}>
            {s === 'ALL' ? 'All Sectors' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="dt">
            <thead>
              <tr>
                <th style={{cursor:'default'}}>Symbol</th>
                <th onClick={()=>handleSort('ltp')} style={{cursor:'pointer'}}>LTP <SortArrow k="ltp"/></th>
                <th onClick={()=>handleSort('chg')} style={{cursor:'pointer'}}>Chg <SortArrow k="chg"/></th>
                <th onClick={()=>handleSort('pct')} style={{cursor:'pointer'}}>Chg% <SortArrow k="pct"/></th>
                <th>Volume</th>
                <th onClick={()=>handleSort('pe')} style={{cursor:'pointer'}}>P/E <SortArrow k="pe"/></th>
                <th>Mkt Cap</th>
                <th>52W Range</th>
                <th>30D</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const up = s.pct >= 0;
                const hist = window.genHistory(s.sym, s.ltp);
                const inWatch = watchlist.includes(s.sym);
                return (
                  <tr key={s.sym} onClick={() => navigate('trade', s.sym)}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background: window.SECTOR_META[s.sector]?.color||'var(--accent)',flexShrink:0}}></div>
                        <div>
                          <div className="sym">{s.sym}</div>
                          <div className="name-cell" style={{maxWidth:140}}>{s.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num" style={{fontWeight:600}}>{fmtPrice(s.ltp)}</td>
                    <td className={`num ${up?'up':'down'}`}>{up?'+':''}{s.chg.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${up?'badge-g':'badge-r'}`}>
                        {up?'▲':'▼'} {Math.abs(s.pct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="num muted">{s.vol}</td>
                    <td className="num">{s.pe != null ? s.pe.toFixed(1) : '—'}</td>
                    <td className="num muted">{s.cap}</td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column',gap:2}}>
                        <div style={{fontSize:10.5,color:'var(--t3)'}}>
                          <span className="up">{fmtPrice(s.h52)}</span>
                          <span style={{color:'var(--t3)',margin:'0 4px'}}>/</span>
                          <span className="down">{fmtPrice(s.l52)}</span>
                        </div>
                        {/* 52w progress bar */}
                        <div style={{width:70,height:3,background:'var(--raised)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{
                            height:'100%', borderRadius:2,
                            width: `${Math.max(0,Math.min(100,(s.ltp - s.l52)/(s.h52 - s.l52)*100))}%`,
                            background:'linear-gradient(90deg,var(--red),var(--yellow),var(--green))'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td><Sparkline data={hist.slice(-20)} up={up} /></td>
                    <td>
                      <div style={{display:'flex',gap:6,alignItems:'center'}} onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-sm btn-buy"
                          onClick={()=>navigate('trade',s.sym)}>Buy</button>
                        <button
                          style={{background:'none',border:'none',cursor:'pointer',
                            color: inWatch?'var(--yellow)':'var(--t3)',fontSize:16,lineHeight:1}}
                          onClick={()=>toggleWatch(s.sym)}
                          title={inWatch?'Remove from watchlist':'Add to watchlist'}
                        >
                          {inWatch ? '★' : '☆'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty" style={{padding:'40px'}}>
            <div className="empty-title">No stocks found</div>
            <div className="empty-sub">Try adjusting your search or sector filter</div>
          </div>
        )}
      </div>
    </div>
  );
}

window.Markets = Markets;
