// components/Orders.jsx
const { useState, useMemo } = React;

function Orders({ orders, navigate }) {
  const [tab, setTab] = useState('ALL');
  const tabs = ['ALL','OPEN','EXECUTED','CANCELLED'];

  const filtered = useMemo(() => {
    if (tab === 'ALL') return orders;
    return orders.filter(o => o.status === tab);
  }, [orders, tab]);

  if (!orders.length) return (
    <div className="page fade-up">
      <div className="ph">
        <div className="ph-title">Orders</div>
      </div>
      <div className="empty" style={{marginTop:60}}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 14h16M16 22h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="empty-title">No orders yet</div>
        <div className="empty-sub">Place your first order in the Trade screen</div>
        <button className="btn btn-primary" onClick={()=>navigate('trade')}>Start Trading</button>
      </div>
    </div>
  );

  const countByTab = { ALL: orders.length };
  orders.forEach(o => { countByTab[o.status] = (countByTab[o.status]||0)+1; });

  return (
    <div className="page fade-up">
      <div className="ph">
        <div>
          <div className="ph-title">Orders</div>
          <div className="ph-sub">{orders.length} total · Paper account</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
            {t}
            {countByTab[t] > 0 &&
              <span style={{
                marginLeft:5,padding:'1px 5px',borderRadius:10,
                background:tab===t?'rgba(64,112,255,.3)':'rgba(112,144,184,.12)',
                color:tab===t?'var(--accent)':'var(--t3)',
                fontSize:10,fontWeight:700
              }}>{countByTab[t]}</span>
            }
          </button>
        ))}
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table className="dt">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Order</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} onClick={()=>navigate('trade',o.sym)}>
                  <td className="muted" style={{fontSize:12}}>{o.time}</td>
                  <td>
                    <div className="sym">{o.sym}</div>
                    <div className="name-cell">{o.name}</div>
                  </td>
                  <td>
                    <span className={`badge ${o.side==='BUY'?'badge-g':'badge-r'}`}>
                      {o.side}
                    </span>
                  </td>
                  <td className="muted" style={{fontSize:12}}>{o.orderType}</td>
                  <td className="num">{o.qty}</td>
                  <td className="num">{fmtPrice(o.price)}</td>
                  <td className="num" style={{fontWeight:600}}>{fmtINR(o.price * o.qty)}</td>
                  <td>
                    {o.status === 'EXECUTED'   && <span className="badge badge-g">EXECUTED</span>}
                    {o.status === 'OPEN'        && <span className="badge badge-y">OPEN</span>}
                    {o.status === 'CANCELLED'   && <span className="badge badge-n">CANCELLED</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="empty" style={{padding:'36px'}}>
            <div className="empty-title">No {tab.toLowerCase()} orders</div>
          </div>
        )}
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div style={{display:'flex',gap:16}}>
          {[
            {label:'Total Orders', val: filtered.length},
            {label:'Buy Orders',   val: filtered.filter(o=>o.side==='BUY').length,  color:'var(--green)'},
            {label:'Sell Orders',  val: filtered.filter(o=>o.side==='SELL').length, color:'var(--red)'},
            {label:'Total Volume', val: fmtINR(filtered.reduce((s,o)=>s+o.price*o.qty,0))},
          ].map(({label,val,color}) => (
            <div key={label} className="stat-card" style={{flex:1}}>
              <div className="stat-label">{label}</div>
              <div className="stat-val" style={color?{color}:{}}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.Orders = Orders;
