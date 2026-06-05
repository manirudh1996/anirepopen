// components/Compass.jsx
const { useState, useEffect, useRef, useMemo } = React;

function CompassChart({ result }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && result) window.drawMCChart(ref.current, result);
  }, [result]);
  if (!result) return null;
  return (
    <canvas ref={ref} width={820} height={340}
      style={{width:'100%',height:340,borderRadius:'0 0 9px 9px'}} />
  );
}

function AllocationDonut({ sectorAlloc }) {
  const ref = useRef(null);
  const total = Object.values(sectorAlloc).reduce((a,b)=>a+b,0);
  const entries = Object.entries(sectorAlloc).sort((a,b)=>b[1]-a[1]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || total === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 16, inner = r*0.56;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0F1E38'; ctx.fillRect(0,0,W,H);
    let angle = -Math.PI/2;
    entries.forEach(([sec, val]) => {
      const slice = (val/total)*2*Math.PI;
      const color = window.SECTOR_META[sec]?.color || '#4070FF';
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle,angle+slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      angle += slice;
    });
    // Inner hole
    ctx.beginPath();
    ctx.arc(cx,cy,inner,0,2*Math.PI);
    ctx.fillStyle='#0F1E38';
    ctx.fill();
    // Center text
    ctx.fillStyle='#7090B8'; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Allocation', cx, cy-4);
    ctx.fillStyle='#DDE8F8'; ctx.font='bold 12px Space Grotesk,sans-serif';
    ctx.fillText(`${entries.length} sectors`, cx, cy+12);
  }, [sectorAlloc]);

  return (
    <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
      <canvas ref={ref} width={160} height={160} style={{flexShrink:0}} />
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:7,paddingTop:8}}>
        {entries.map(([sec, val]) => {
          const pct = total>0 ? val/total*100 : 0;
          const color = window.SECTOR_META[sec]?.color || '#4070FF';
          return (
            <div key={sec} style={{display:'flex',alignItems:'center',gap:7}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}></span>
              <span style={{fontSize:11.5,color:'var(--t2)',flex:1}}>{sec}</span>
              <span style={{fontFamily:'var(--f-mono)',fontSize:11,color:'var(--t1)'}}>{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Compass({ portfolio, livePrices }) {
  const [profile, setProfile] = useState('moderate');
  const [result, setResult]   = useState(null);
  const [running, setRunning] = useState(false);

  const profiles = [
    { id:'conservative', label:'Conservative', hint:'Low risk, ~12% annual return' },
    { id:'moderate',     label:'Moderate',     hint:'Balanced, ~15% annual return' },
    { id:'aggressive',   label:'Aggressive',   hint:'High risk, ~20% annual return' },
  ];

  function runSim() {
    if (portfolio.length === 0) return;
    setRunning(true);
    setTimeout(() => {
      const r = window.runMonteCarlo(portfolio, livePrices, profile, 1000);
      setResult(r);
      setRunning(false);
    }, 60);
  }

  const hasPortfolio = portfolio.length > 0;
  const initVal = result ? result.initialValue : (
    portfolio.reduce((s,h) => s + (livePrices[h.sym]?.ltp || h.avgPrice)*h.qty, 0)
  );

  return (
    <div className="page fade-up">
      <div className="ph">
        <div>
          <div className="ph-title">Portfolio Compass</div>
          <div className="ph-sub">Monte Carlo 5-year projection · 1,000 simulations · GBM model</div>
        </div>
        {hasPortfolio && (
          <button className="btn btn-primary btn-lg" onClick={runSim} disabled={running}>
            {running
              ? <><span className="pulse">⟳</span> Simulating…</>
              : <>▶ Run Simulation</>}
          </button>
        )}
      </div>

      {!hasPortfolio && (
        <div className="empty" style={{marginTop:60}}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
            <path d="M24 10v4M24 34v4M10 24h4M34 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M30 18L22 24l8 6-2-6 2-6z" fill="currentColor"/>
          </svg>
          <div className="empty-title">No portfolio to analyse</div>
          <div className="empty-sub">Add holdings via Trade to run your Compass projection</div>
        </div>
      )}

      {hasPortfolio && (
        <>
          {/* Risk profile */}
          <div className="card card-p">
            <div style={{fontSize:12,color:'var(--t2)',marginBottom:12,fontWeight:500,textTransform:'uppercase',letterSpacing:'.5px'}}>Risk Profile</div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {profiles.map(p => (
                <button key={p.id} className={`risk-btn${profile===p.id?' active':''}`} onClick={()=>setProfile(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{fontSize:12,color:'var(--t3)'}}>
              {profiles.find(p=>p.id===profile)?.hint} · Based on NSE sector historical data · Simulated via Geometric Brownian Motion
            </div>
          </div>

          {/* Chart */}
          <div className="card" style={{overflow:'hidden'}}>
            <div className="card-head">
              <span className="card-head-title">5-Year Projection — {profile.charAt(0).toUpperCase()+profile.slice(1)} Profile</span>
              {result && <span className="badge badge-b">1,000 runs complete</span>}
            </div>
            {!result && !running && (
              <div className="empty" style={{padding:'60px 24px'}}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M4 32L14 18l8 8 14-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="36" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div className="empty-sub">Click "Run Simulation" to generate your 5-year projection</div>
              </div>
            )}
            {running && (
              <div className="empty" style={{padding:'60px 24px'}}>
                <div style={{fontFamily:'var(--f-mono)',fontSize:13,color:'var(--accent)',animation:'pulse 1s infinite'}}>
                  Running 1,000 Monte Carlo paths…
                </div>
                <div style={{width:200,height:3,background:'var(--raised)',borderRadius:2,marginTop:12,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'var(--accent)',borderRadius:2,animation:'shimmer 1s infinite',backgroundSize:'200% 100%',backgroundImage:'linear-gradient(90deg,var(--accent) 40%,#7BA7FF 50%,var(--accent) 60%)'}}></div>
                </div>
              </div>
            )}
            {result && <CompassChart result={result} />}
          </div>

          {/* Stats + Allocation */}
          {result && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:18,alignItems:'start'}}>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div className="stats-grid">
                  {[
                    {
                      label:'Expected Value (P50)',
                      val: fmtLarge(result.stats.median),
                      sub: `+${fmtPct((result.stats.median/initVal-1)*100)} from today`,
                      color:'var(--accent)', up:true
                    },
                    {
                      label:'Best Case (P90)',
                      val: fmtLarge(result.stats.best),
                      sub: `+${fmtPct((result.stats.best/initVal-1)*100)} bull scenario`,
                      color:'var(--green)', up:true
                    },
                    {
                      label:'Worst Case (P10)',
                      val: fmtLarge(result.stats.worst),
                      sub: `${fmtPct((result.stats.worst/initVal-1)*100)} bear scenario`,
                      color: result.stats.worst < initVal ? 'var(--red)' : 'var(--green)',
                      up: result.stats.worst >= initVal
                    },
                    {
                      label:'Value at Risk (5%)',
                      val: fmtLarge(result.stats.var5),
                      sub: `${fmtPct((result.stats.var5/initVal-1)*100)} downside`,
                      color: result.stats.var5 < initVal ? 'var(--red)' : 'var(--t1)',
                      up: result.stats.var5 >= initVal
                    },
                    {
                      label:'Probability of Profit',
                      val: `${result.probProfit.toFixed(1)}%`,
                      sub: `${(100-result.probProfit).toFixed(1)}% chance of loss`,
                      color: result.probProfit >= 50 ? 'var(--green)' : 'var(--red)',
                      up: result.probProfit >= 50
                    },
                    {
                      label:'Expected CAGR',
                      val: `${result.stats.cagr.toFixed(1)}%`,
                      sub: `Compounded annual growth rate`,
                      color: result.stats.cagr >= 0 ? 'var(--green)' : 'var(--red)',
                      up: result.stats.cagr >= 0
                    },
                  ].map(s => (
                    <div key={s.label} className="stat-mini">
                      <div className="stat-mini-label">{s.label}</div>
                      <div className="stat-mini-val" style={{color:s.color}}>{s.val}</div>
                      <div className="stat-mini-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Assumptions */}
                <div style={{background:'var(--raised)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'14px 16px',fontSize:12,color:'var(--t3)',lineHeight:1.7}}>
                  <strong style={{color:'var(--t2)',display:'block',marginBottom:4}}>Model Assumptions</strong>
                  Geometric Brownian Motion (GBM) · {result.wMu.toFixed(1)*100|0}% expected annual return ·{' '}
                  {result.wSigma.toFixed(2)*100|0}% annual volatility · NSE sector-weighted parameters ·
                  Monthly time steps (60) · 1,000 independent paths · No dividends or rebalancing assumed
                </div>
              </div>

              {/* Donut */}
              <div className="card card-p">
                <div style={{fontSize:12,color:'var(--t2)',fontWeight:600,marginBottom:14}}>Portfolio Allocation</div>
                <AllocationDonut sectorAlloc={result.sectorAlloc} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

window.Compass = Compass;
