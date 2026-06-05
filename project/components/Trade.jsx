// components/Trade.jsx
const { useState, useEffect, useRef, useMemo } = React;

function StockChart({ stock, livePrices }) {
  const canvasRef = useRef(null);
  const prices = useMemo(() => {
    const lp = livePrices[stock.sym];
    return window.genHistory(stock.sym, lp ? lp.ltp : stock.ltp);
  }, [stock.sym]);
  const isUp = prices[prices.length-1] >= prices[0];

  useEffect(() => {
    if (canvasRef.current) {
      window.drawPriceChart(canvasRef.current, prices, isUp);
    }
  }, [prices]);

  return (
    <canvas
      ref={canvasRef}
      width={560} height={200}
      style={{width:'100%',height:200,borderRadius:'0 0 9px 9px'}}
    />
  );
}

function Trade({ livePrices, portfolio, credits, onOrderPlaced, navigate, initSym }) {
  const [sym, setSym] = useState(initSym || 'RELIANCE');
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [side, setSide] = useState('BUY');
  const [qty, setQty] = useState('1');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');

  const stock = window.STOCK_MAP[sym] || window.ALL_STOCKS[0];
  const lp    = livePrices[sym] || stock;
  const price = lp.ltp;
  const execPrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : price;
  const numQty    = parseInt(qty) || 0;
  const total     = execPrice * numQty;
  const margin    = total * 0.1;
  const holding   = portfolio.find(h => h.sym === sym);
  const isUp      = lp.pct >= 0;

  const canBuy  = side === 'BUY'  && credits >= total && numQty > 0;
  const canSell = side === 'SELL' && holding && holding.qty >= numQty && numQty > 0;

  const searchResults = useMemo(() => {
    if (!searchQ) return [];
    const q = searchQ.toLowerCase();
    return window.ALL_STOCKS.filter(s =>
      s.sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQ]);

  function placeOrder() {
    if (!onOrderPlaced) return;
    onOrderPlaced({ sym, name: stock.name, side, qty: numQty, price: execPrice, orderType, sector: stock.sector });
    setQty('1');
  }

  return (
    <div className="page fade-up">
      <div className="ph">
        <div>
          <div className="ph-title">Trade</div>
          <div className="ph-sub">Place paper orders · Credits-based simulation</div>
        </div>
      </div>

      <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
        {/* Left: stock info + chart */}
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,minWidth:0}}>

          {/* Stock selector */}
          <div style={{position:'relative'}}>
            <div
              className="card card-p"
              style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer',padding:'12px 16px'}}
              onClick={() => setShowSearch(!showSearch)}
            >
              <div style={{
                width:40,height:40,borderRadius:10,
                background:`${window.SECTOR_META[stock.sector]?.color||'var(--accent)'}22`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontFamily:'var(--f-head)',fontWeight:700,fontSize:13,
                color:window.SECTOR_META[stock.sector]?.color||'var(--accent)',flexShrink:0
              }}>{sym.slice(0,2)}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--f-head)',fontWeight:700,fontSize:16,color:'var(--t1)'}}>{sym}</div>
                <div style={{fontSize:12,color:'var(--t2)'}}>{stock.name}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--f-mono)',fontSize:22,fontWeight:700,color:'var(--t1)'}}>{fmtPrice(price)}</div>
                <div className={isUp?'up':'down'} style={{fontFamily:'var(--f-mono)',fontSize:12}}>
                  {isUp?'▲':'▼'} {Math.abs(lp.chg||0).toFixed(2)} ({Math.abs(lp.pct||0).toFixed(2)}%)
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{color:'var(--t3)'}}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {showSearch && (
              <div style={{
                position:'absolute',top:'100%',left:0,right:0,zIndex:100,
                background:'var(--raised)',border:'1px solid var(--border2)',borderRadius:'0 0 9px 9px',
                boxShadow:'0 12px 40px rgba(0,0,0,.6)'
              }}>
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
                  <input
                    className="input"
                    placeholder="Search symbol or company…"
                    value={searchQ}
                    onChange={e=>setSearchQ(e.target.value)}
                    autoFocus
                    style={{background:'var(--card)'}}
                  />
                </div>
                {searchResults.length > 0
                  ? searchResults.map(s => (
                    <div key={s.sym}
                      style={{
                        display:'flex',justifyContent:'space-between',alignItems:'center',
                        padding:'10px 16px',cursor:'pointer',transition:'background .1s',
                        borderBottom:'1px solid var(--border)'
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(64,112,255,.06)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      onClick={()=>{setSym(s.sym);setShowSearch(false);setSearchQ('');}}>
                      <div>
                        <span style={{fontFamily:'var(--f-head)',fontWeight:700,fontSize:13,color:'var(--t1)'}}>{s.sym}</span>
                        <span style={{fontSize:12,color:'var(--t2)',marginLeft:8}}>{s.name}</span>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontFamily:'var(--f-mono)',fontSize:12}}>{fmtPrice(s.ltp)}</span>
                        <span className={s.pct>=0?'up':'down'} style={{fontFamily:'var(--f-mono)',fontSize:11}}>{s.pct>=0?'+':''}{s.pct.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))
                  : searchQ && <div style={{padding:'16px',color:'var(--t3)',textAlign:'center',fontSize:12}}>No results for "{searchQ}"</div>
                }
              </div>
            )}
          </div>

          {/* Key stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
            {[
              {label:'Open',       val: fmtPrice(price*0.993)},
              {label:'High',       val: fmtPrice(price*1.012)},
              {label:'Low',        val: fmtPrice(price*0.988)},
              {label:'52W High',   val: fmtPrice(stock.h52)},
              {label:'52W Low',    val: fmtPrice(stock.l52)},
              {label:'Volume',     val: stock.vol},
              {label:'Mkt Cap',    val: stock.cap},
              {label:'P/E Ratio',  val: stock.pe ? stock.pe.toFixed(1) : '—'},
              {label:'Sector',     val: stock.sector},
              {label:'Holdings',   val: holding ? `${holding.qty} @ ${fmtPrice(holding.avgPrice)}` : '—'},
            ].map(({label,val}) => (
              <div key={label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r1)',padding:'9px 12px'}}>
                <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>{label}</div>
                <div style={{fontFamily:'var(--f-mono)',fontSize:12.5,fontWeight:600,color:'var(--t1)'}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card" style={{overflow:'hidden'}}>
            <div className="card-head">
              <span className="card-head-title">{sym} · 30-Day Price</span>
              <span className={`badge ${isUp?'badge-g':'badge-r'}`}>{isUp?'▲ Uptrend':'▼ Downtrend'}</span>
            </div>
            <StockChart stock={stock} livePrices={livePrices} />
          </div>
        </div>

        {/* Right: Order form */}
        <div className="order-panel">
          <div className="order-tabs">
            {['BUY','SELL'].map(s => (
              <button
                key={s}
                className={`order-tab ${s.toLowerCase()}${side===s?' active':''}`}
                onClick={()=>setSide(s)}
              >{s}</button>
            ))}
          </div>

          <div className="order-body">
            {/* Qty */}
            <div className="form-group">
              <label className="form-label">Quantity (shares)</label>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-ghost btn-sm"
                  onClick={()=>setQty(q=>Math.max(1,parseInt(q)||1)-1 + '')}>−</button>
                <input className="input" type="number" min="1" value={qty}
                  onChange={e=>setQty(e.target.value)} style={{textAlign:'center'}} />
                <button className="btn btn-ghost btn-sm"
                  onClick={()=>setQty(q=>(parseInt(q)||0)+1 + '')}>+</button>
              </div>
            </div>

            {/* Order type */}
            <div className="form-group">
              <label className="form-label">Order Type</label>
              <select className="input" value={orderType} onChange={e=>setOrderType(e.target.value)}>
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
                <option value="SL">Stop Loss</option>
              </select>
            </div>

            {/* Limit price */}
            {orderType !== 'MARKET' && (
              <div className="form-group">
                <label className="form-label">{orderType === 'LIMIT' ? 'Limit Price (₹)' : 'Trigger Price (₹)'}</label>
                <input className="input" type="number" placeholder={price.toFixed(2)}
                  value={limitPrice} onChange={e=>setLimitPrice(e.target.value)} />
              </div>
            )}

            {/* Summary */}
            <div style={{background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'var(--r1)',padding:'10px 14px'}}>
              <div className="summary-row">
                <span className="summary-key">Market Price</span>
                <span className="summary-val">{fmtPrice(price)}</span>
              </div>
              {orderType !== 'MARKET' && (
                <div className="summary-row">
                  <span className="summary-key">{orderType === 'LIMIT' ? 'Limit' : 'Trigger'}</span>
                  <span className="summary-val">{limitPrice ? fmtPrice(parseFloat(limitPrice)) : '—'}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-key">Qty × Price</span>
                <span className="summary-val">{numQty} × {fmtPrice(execPrice)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-key">Order Value</span>
                <span className="summary-val" style={{color:'var(--t1)',fontSize:14}}>{fmtINR(total)}</span>
              </div>
              <div className="summary-row" style={{borderBottom:'none'}}>
                <span className="summary-key">Margin (10%)</span>
                <span className="summary-val">{fmtINR(margin)}</span>
              </div>
            </div>

            {/* Credits */}
            <div style={{
              padding:'10px 14px',borderRadius:'var(--r1)',
              background: (side==='BUY'&&!canBuy&&numQty>0) ? 'var(--red-d)' : 'var(--green-d)',
              border:`1px solid ${(side==='BUY'&&!canBuy&&numQty>0)?'rgba(255,63,94,.2)':'rgba(0,212,140,.2)'}`
            }}>
              <div style={{fontSize:10.5,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>Available Credits</div>
              <div style={{fontFamily:'var(--f-mono)',fontSize:16,fontWeight:700,color: (side==='BUY'&&!canBuy&&numQty>0)?'var(--red)':'var(--green)'}}>
                {fmtINR(credits)}
              </div>
              {side==='BUY' && !canBuy && numQty>0 && (
                <div style={{fontSize:11,color:'var(--red)',marginTop:3}}>Insufficient credits</div>
              )}
              {side==='SELL' && holding && (
                <div style={{fontSize:11,color:'var(--t2)',marginTop:2}}>{holding.qty} shares held · Avg {fmtPrice(holding.avgPrice)}</div>
              )}
              {side==='SELL' && !holding && (
                <div style={{fontSize:11,color:'var(--red)',marginTop:3}}>No position in {sym}</div>
              )}
            </div>

            {/* Place order */}
            <button
              className={`btn btn-lg btn-full ${side==='BUY'?'btn-buy':'btn-sell'}`}
              disabled={side==='BUY' ? !canBuy : !canSell}
              onClick={placeOrder}
            >
              {side === 'BUY' ? `Buy ${numQty || '—'} ${sym}` : `Sell ${numQty || '—'} ${sym}`}
            </button>

            <div style={{fontSize:10.5,color:'var(--t3)',textAlign:'center',lineHeight:1.5}}>
              Paper trading only · No real money involved · Credits reset anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Trade = Trade;
