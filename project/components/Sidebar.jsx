// components/Sidebar.jsx
const { useState } = React;

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/></svg> },
  { id:'markets',   label:'Markets',          icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor"/><rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/><rect x="11" y="2" width="3" height="13" rx="1" fill="currentColor"/><polyline points="1,8 6,4 11,1 15,3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg> },
  { id:'trade',     label:'Trade',            icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 11l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id:'portfolio', label:'Portfolio',        icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M1 9h14" stroke="currentColor" strokeWidth="1.2" opacity=".5"/></svg> },
  { id:'compass',   label:'Compass',          icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 3v1M8 12v1M3 8h1M12 8h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M10 6L7 8l3 2-1-2 1-2z" fill="currentColor"/><path d="M6 10l3-2-3-2 1 2-1 2z" fill="currentColor" opacity=".5"/></svg> },
  { id:'orders',    label:'Orders',           icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id:'watchlist', label:'Watchlist',        icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.7 3.5 3.8.55-2.75 2.68.65 3.77L8 10.6l-3.4 1.9.65-3.77L2.5 6.05l3.8-.55L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
];

function Sidebar({ page, setPage, credits, portfolio, livePrices, openOrders }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L6 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          BAZAAR
        </div>
        <div className="logo-sub">Indian Equity Platform</div>
        <div className="market-status">
          <span className="market-dot pulse"></span>
          NSE OPEN
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item${page === item.id ? ' active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon}
            {item.label}
            {item.id === 'orders' && openOrders > 0 &&
              <span className="nav-badge">{openOrders}</span>
            }
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="credits-box">
          <div className="credits-label">Paper Credits</div>
          <div className="credits-amount">{fmtLarge(credits)}</div>
          <div className="credits-note">Dummy trading account</div>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
