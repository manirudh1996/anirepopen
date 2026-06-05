// App.jsx — Main application root
const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent":   "#4070FF",
  "credits":  "1000000",
  "speed":    3000
}/*EDITMODE-END*/;

const DEMO_PORTFOLIO = [
  { sym:'TCS',        name:'Tata Consultancy Svcs',  qty:10, avgPrice:3750.00, sector:'IT'      },
  { sym:'RELIANCE',   name:'Reliance Industries',     qty:15, avgPrice:2850.00, sector:'ENERGY'  },
  { sym:'HDFCBANK',   name:'HDFC Bank Ltd',           qty:20, avgPrice:1680.00, sector:'BANKING' },
  { sym:'INFY',       name:'Infosys Ltd',             qty:25, avgPrice:1820.00, sector:'IT'      },
  { sym:'SUNPHARMA',  name:'Sun Pharmaceutical',      qty:8,  avgPrice:1580.00, sector:'PHARMA'  },
];

function buildLivePrices() {
  const prices = {};
  window.ALL_STOCKS.forEach(s => {
    prices[s.sym] = { ltp: s.ltp, chg: s.chg, pct: s.pct, basePrice: s.ltp };
  });
  return prices;
}

function Topbar({ livePrices, page, navigate, setSearch }) {
  const [time, setTime] = useState('');
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const d = now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
      const t = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      setTime(`${d}  ${t}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function handleSearch(val) {
    setQ(val);
    if (!val.trim()) { setResults([]); return; }
    const lower = val.toLowerCase();
    setResults(
      window.ALL_STOCKS
        .filter(s => s.sym.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower))
        .slice(0,6)
    );
  }

  const niftyVal = livePrices['HDFCBANK']
    ? (24835.40 * (1 + (livePrices['HDFCBANK'].pct * 0.4 / 100))).toFixed(2)
    : '24835.40';
  const niftyUp = parseFloat(niftyVal) >= 24835.40;

  return (
    <div className="topbar">
      {/* Search */}
      <div className="topbar-search" style={{position:'relative'}}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="var(--t3)" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          placeholder="Search any NSE stock…"
          value={q}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(()=>setResults([]),150)}
        />
        {results.length > 0 && (
          <div style={{
            position:'absolute',top:'calc(100% + 6px)',left:0,right:0,
            background:'var(--raised)',border:'1px solid var(--border2)',
            borderRadius:'var(--r2)',zIndex:200,
            boxShadow:'0 12px 40px rgba(0,0,0,.6)',overflow:'hidden'
          }}>
            {results.map(s => {
              const lp = livePrices[s.sym] || s;
              return (
                <div key={s.sym}
                  style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)'}}
                  onMouseDown={()=>{ navigate('trade',s.sym); setQ(''); setResults([]); }}>
                  <div>
                    <span style={{fontFamily:'var(--f-head)',fontWeight:700,fontSize:13,color:'var(--t1)'}}>{s.sym}</span>
                    <span style={{fontSize:12,color:'var(--t2)',marginLeft:8}}>{s.name}</span>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <span style={{fontFamily:'var(--f-mono)',fontSize:12}}>{fmtPrice(lp.ltp)}</span>
                    <span className={lp.pct>=0?'up':'down'} style={{fontFamily:'var(--f-mono)',fontSize:11}}>{lp.pct>=0?'+':''}{lp.pct.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NIFTY pill */}
      <div style={{
        display:'flex',alignItems:'center',gap:7,padding:'5px 12px',
        borderRadius:'var(--r1)',background:'var(--raised)',border:'1px solid var(--border2)',
      }}>
        <span style={{fontSize:10.5,color:'var(--t3)',fontWeight:600,letterSpacing:'.4px'}}>NIFTY 50</span>
        <span style={{fontFamily:'var(--f-mono)',fontSize:12.5,fontWeight:700,color:'var(--t1)'}}>{parseFloat(niftyVal).toLocaleString('en-IN',{minimumFractionDigits:2})}</span>
        <span className={niftyUp?'up':'down'} style={{fontFamily:'var(--f-mono)',fontSize:11}}>
          {niftyUp?'▲':'▼'} {Math.abs((parseFloat(niftyVal)-24835.40)).toFixed(2)}
        </span>
      </div>

      <div className="topbar-right">
        <span className="topbar-time">{time}</span>
        <div className="topbar-btn" title="Notifications">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2a5 5 0 015 5v3l1 2H2l1-2V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
        </div>
        <div className="avatar" title="Demo User">U</div>
      </div>
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type==='g'?'✓':t.type==='r'?'✕':'ℹ'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [t, setTweak]   = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useState('dashboard');
  const [tradeSym, setTradeSym]   = useState('RELIANCE');
  const [marketSector, setMarketSector] = useState('ALL');

  const [credits,   setCredits]   = useState(() => {
    const s = localStorage.getItem('bzr_credits');
    return s ? parseFloat(s) : parseFloat(TWEAK_DEFAULTS.credits);
  });
  const [portfolio, setPortfolio] = useState(() => {
    const s = localStorage.getItem('bzr_portfolio');
    return s ? JSON.parse(s) : DEMO_PORTFOLIO;
  });
  const [orders,    setOrders]    = useState(() => {
    const s = localStorage.getItem('bzr_orders');
    return s ? JSON.parse(s) : [];
  });
  const [watchlist, setWatchlist] = useState(() => {
    const s = localStorage.getItem('bzr_watchlist');
    return s ? JSON.parse(s) : ['TCS','RELIANCE','HDFCBANK','INFY','BHARTIARTL'];
  });
  const [livePrices, setLivePrices] = useState(buildLivePrices);
  const [toasts, setToasts] = useState([]);

  // Persist state
  useEffect(() => { localStorage.setItem('bzr_credits', credits); }, [credits]);
  useEffect(() => { localStorage.setItem('bzr_portfolio', JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem('bzr_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('bzr_watchlist', JSON.stringify(watchlist)); }, [watchlist]);

  // Apply accent color tweak
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.accent]);

  // Live price simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = {};
        Object.keys(prev).forEach(sym => {
          const d = prev[sym];
          const drift = (Math.random() - 0.49) * d.ltp * 0.0018;
          const newLtp = Math.max(d.ltp * 0.5, d.ltp + drift);
          const newChg = newLtp - d.basePrice;
          const newPct = newChg / d.basePrice * 100;
          next[sym] = { ...d, ltp: newLtp, chg: newChg, pct: newPct };
        });
        return next;
      });
    }, t.speed || 3000);
    return () => clearInterval(interval);
  }, [t.speed]);

  function addToast(msg, type='g') {
    const id = Date.now();
    setToasts(prev => [...prev, {id,msg,type}]);
    setTimeout(() => setToasts(prev => prev.filter(t=>t.id!==id)), 3200);
  }

  function navigate(dest, param) {
    if (dest === 'trade')   { setTradeSym(param || 'RELIANCE'); setPage('trade'); }
    else if (dest === 'markets') { setMarketSector(param || 'ALL'); setPage('markets'); }
    else if (dest === 'compass') { setPage('compass'); }
    else setPage(dest);
  }

  function onOrderPlaced({ sym, name, side, qty, price, orderType, sector }) {
    const value = price * qty;
    const now   = new Date();
    const time  = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
                + ' ' + now.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});

    const order = { id: Date.now(), time, sym, name, side, qty, price, orderType, sector, status:'EXECUTED' };
    setOrders(prev => [order, ...prev]);

    if (side === 'BUY') {
      setCredits(c => c - value);
      setPortfolio(prev => {
        const existing = prev.find(h => h.sym === sym);
        if (existing) {
          return prev.map(h => h.sym === sym ? {
            ...h,
            qty: h.qty + qty,
            avgPrice: (h.avgPrice * h.qty + price * qty) / (h.qty + qty)
          } : h);
        }
        return [...prev, { sym, name, qty, avgPrice: price, sector }];
      });
      addToast(`Bought ${qty} ${sym} @ ${fmtPrice(price)}`, 'g');
    } else {
      const proceeds = value;
      setCredits(c => c + proceeds);
      setPortfolio(prev => {
        return prev.map(h => {
          if (h.sym !== sym) return h;
          const newQty = h.qty - qty;
          return newQty <= 0 ? null : { ...h, qty: newQty };
        }).filter(Boolean);
      });
      addToast(`Sold ${qty} ${sym} @ ${fmtPrice(price)}`, 'r');
    }
    navigate('orders');
  }

  function onSell(sym, qty, price) {
    onOrderPlaced({
      sym, name: (window.STOCK_MAP[sym]||{}).name||sym,
      side:'SELL', qty, price, orderType:'MARKET',
      sector: (window.STOCK_MAP[sym]||{}).sector||'IT'
    });
  }

  const openOrderCount = orders.filter(o=>o.status==='OPEN').length;

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard livePrices={livePrices} portfolio={portfolio} credits={credits} navigate={navigate} />;
      case 'markets':
        return <Markets livePrices={livePrices} watchlist={watchlist} setWatchlist={setWatchlist} navigate={navigate} initialSector={marketSector} />;
      case 'trade':
        return <Trade livePrices={livePrices} portfolio={portfolio} credits={credits} onOrderPlaced={onOrderPlaced} navigate={navigate} initSym={tradeSym} />;
      case 'portfolio':
        return <Portfolio portfolio={portfolio} livePrices={livePrices} onSell={onSell} navigate={navigate} />;
      case 'compass':
        return <Compass portfolio={portfolio} livePrices={livePrices} />;
      case 'orders':
        return <Orders orders={orders} navigate={navigate} />;
      case 'watchlist':
        return <Watchlist watchlist={watchlist} setWatchlist={setWatchlist} livePrices={livePrices} navigate={navigate} />;
      default:
        return <Dashboard livePrices={livePrices} portfolio={portfolio} credits={credits} navigate={navigate} />;
    }
  }

  return (
    <div id="app">
      <Sidebar
        page={page} setPage={setPage} credits={credits}
        portfolio={portfolio} livePrices={livePrices}
        openOrders={openOrderCount}
      />
      <div className="main">
        <Topbar livePrices={livePrices} page={page} navigate={navigate} />
        {renderPage()}
      </div>
      <Toast toasts={toasts} />
      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakColor label="Accent colour" value={t.accent}
          options={['#4070FF','#00C896','#A855F7','#F97316']}
          onChange={v=>setTweak('accent',v)} />
        <TweakSection label="Account" />
        <TweakSelect label="Starting Credits" value={t.credits}
          options={[
            {label:'₹5 Lakh',  value:'500000'},
            {label:'₹10 Lakh', value:'1000000'},
            {label:'₹25 Lakh', value:'2500000'},
            {label:'₹50 Lakh', value:'5000000'},
          ]}
          onChange={v=>{ setTweak('credits',v); setCredits(parseFloat(v)); }} />
        <TweakButton label="Reset Portfolio" onClick={()=>{ setPortfolio(DEMO_PORTFOLIO); addToast('Portfolio reset to demo','b'); }} />
        <TweakButton label="Clear All Orders"  onClick={()=>{ setOrders([]);     addToast('Orders cleared','b'); }} />
        <TweakSection label="Market Feed" />
        <TweakSelect label="Price update speed" value={String(t.speed)}
          options={[
            {label:'Slow (5s)',   value:'5000'},
            {label:'Normal (3s)', value:'3000'},
            {label:'Fast (1s)',   value:'1000'},
          ]}
          onChange={v=>setTweak('speed',parseInt(v))} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
