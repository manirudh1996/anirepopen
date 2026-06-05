/* ─── NSE Stock Data ─────────────────────────────────────────────────────── */

window.INDICES = [
  { name:'NIFTY 50',     value:24835.40, change:142.30,  pct:0.58  },
  { name:'SENSEX',       value:81921.30, change:487.20,  pct:0.60  },
  { name:'NIFTY BANK',   value:53241.50, change:-128.40, pct:-0.24 },
  { name:'NIFTY IT',     value:37845.60, change:524.80,  pct:1.41  },
  { name:'NIFTY MIDCAP', value:52126.80, change:234.60,  pct:0.45  },
  { name:'NIFTY PHARMA', value:19432.10, change:186.40,  pct:0.97  },
  { name:'NIFTY AUTO',   value:22834.50, change:312.80,  pct:1.39  },
  { name:'NIFTY METAL',  value:9234.60,  change:78.40,   pct:0.86  },
  { name:'INDIA VIX',    value:13.84,    change:-0.62,   pct:-4.29 },
];

window.SECTOR_META = {
  IT:      { mu:0.18, sigma:0.22, color:'#4070FF', label:'Information Technology' },
  BANKING: { mu:0.15, sigma:0.24, color:'#00C2FF', label:'Banking & Finance' },
  PHARMA:  { mu:0.15, sigma:0.20, color:'#A855F7', label:'Pharmaceuticals' },
  AUTO:    { mu:0.14, sigma:0.25, color:'#F97316', label:'Automobiles' },
  FMCG:    { mu:0.12, sigma:0.18, color:'#00D48C', label:'FMCG' },
  ENERGY:  { mu:0.13, sigma:0.23, color:'#FFB700', label:'Energy & Power' },
  METALS:  { mu:0.12, sigma:0.28, color:'#EC4899', label:'Metals & Mining' },
  TELECOM: { mu:0.10, sigma:0.26, color:'#06B6D4', label:'Telecom' },
  REALTY:  { mu:0.16, sigma:0.30, color:'#E040FB', label:'Real Estate' },
  INFRA:   { mu:0.14, sigma:0.22, color:'#64748B', label:'Infrastructure' },
};

window.ALL_STOCKS = [
  // IT
  { sym:'TCS',        name:'Tata Consultancy Svcs',   ltp:3892.50,  chg:45.30,   pct:1.18,  vol:'18.2L',  cap:'14.1T', pe:31.2, h52:4592.25, l52:3311.10, sector:'IT' },
  { sym:'INFY',       name:'Infosys Ltd',              ltp:1876.40,  chg:-12.85,  pct:-0.68, vol:'42.6L',  cap:'7.8T',  pe:28.4, h52:2018.95, l52:1351.55, sector:'IT' },
  { sym:'WIPRO',      name:'Wipro Ltd',                ltp:468.75,   chg:5.20,    pct:1.12,  vol:'31.4L',  cap:'2.4T',  pe:22.1, h52:584.45,  l52:384.55,  sector:'IT' },
  { sym:'HCLTECH',    name:'HCL Technologies',         ltp:1742.30,  chg:22.10,   pct:1.28,  vol:'15.7L',  cap:'4.7T',  pe:26.8, h52:1974.80, l52:1235.65, sector:'IT' },
  { sym:'TECHM',      name:'Tech Mahindra Ltd',        ltp:1634.90,  chg:-8.45,   pct:-0.51, vol:'11.2L',  cap:'1.6T',  pe:38.6, h52:1808.50, l52:1095.45, sector:'IT' },
  { sym:'LTIM',       name:'LTIMindtree Ltd',          ltp:5436.20,  chg:78.90,   pct:1.47,  vol:'3.8L',   cap:'1.6T',  pe:39.4, h52:6279.00, l52:4115.30, sector:'IT' },
  { sym:'MPHASIS',    name:'Mphasis Ltd',              ltp:2876.50,  chg:34.20,   pct:1.20,  vol:'2.1L',   cap:'55.1K', pe:35.2, h52:3218.00, l52:2042.65, sector:'IT' },
  { sym:'PERSISTENT', name:'Persistent Systems',       ltp:5124.80,  chg:56.40,   pct:1.11,  vol:'1.9L',   cap:'79.2K', pe:72.1, h52:5842.50, l52:3018.35, sector:'IT' },
  // BANKING
  { sym:'HDFCBANK',   name:'HDFC Bank Ltd',            ltp:1734.60,  chg:18.45,   pct:1.07,  vol:'48.3L',  cap:'13.2T', pe:20.1, h52:1880.00, l52:1363.45, sector:'BANKING' },
  { sym:'ICICIBANK',  name:'ICICI Bank Ltd',           ltp:1298.75,  chg:22.30,   pct:1.75,  vol:'52.6L',  cap:'9.2T',  pe:19.8, h52:1362.35, l52:912.05,  sector:'BANKING' },
  { sym:'SBIN',       name:'State Bank of India',      ltp:834.20,   chg:-4.65,   pct:-0.55, vol:'82.4L',  cap:'7.4T',  pe:11.2, h52:912.10,  l52:543.20,  sector:'BANKING' },
  { sym:'KOTAKBANK',  name:'Kotak Mahindra Bank',      ltp:1956.40,  chg:14.20,   pct:0.73,  vol:'18.7L',  cap:'3.9T',  pe:23.6, h52:2253.00, l52:1543.85, sector:'BANKING' },
  { sym:'AXISBANK',   name:'Axis Bank Ltd',            ltp:1184.50,  chg:-8.90,   pct:-0.75, vol:'32.1L',  cap:'3.7T',  pe:16.4, h52:1339.65, l52:938.50,  sector:'BANKING' },
  { sym:'INDUSINDBK', name:'IndusInd Bank',            ltp:1398.25,  chg:24.80,   pct:1.80,  vol:'14.2L',  cap:'1.1T',  pe:15.8, h52:1694.50, l52:885.65,  sector:'BANKING' },
  { sym:'BANKBARODA', name:'Bank of Baroda',           ltp:248.75,   chg:3.45,    pct:1.41,  vol:'48.6L',  cap:'1.3T',  pe:8.2,  h52:299.70,  l52:168.30,  sector:'BANKING' },
  { sym:'PNB',        name:'Punjab National Bank',     ltp:124.50,   chg:-1.20,   pct:-0.96, vol:'96.2L',  cap:'1.4T',  pe:9.8,  h52:142.90,  l52:68.25,   sector:'BANKING' },
  // PHARMA
  { sym:'SUNPHARMA',  name:'Sun Pharmaceutical',       ltp:1632.45,  chg:28.70,   pct:1.79,  vol:'14.8L',  cap:'3.9T',  pe:35.6, h52:1762.80, l52:1048.85, sector:'PHARMA' },
  { sym:'DRREDDY',    name:"Dr. Reddy's Labs",         ltp:6892.30,  chg:-34.50,  pct:-0.50, vol:'4.2L',   cap:'1.2T',  pe:22.4, h52:7506.20, l52:4960.05, sector:'PHARMA' },
  { sym:'CIPLA',      name:'Cipla Ltd',                ltp:1534.80,  chg:18.90,   pct:1.25,  vol:'8.6L',   cap:'1.2T',  pe:28.7, h52:1702.35, l52:1016.95, sector:'PHARMA' },
  { sym:'DIVISLAB',   name:"Divi's Laboratories",      ltp:5234.60,  chg:56.20,   pct:1.08,  vol:'2.8L',   cap:'1.4T',  pe:64.2, h52:5578.00, l52:3350.55, sector:'PHARMA' },
  { sym:'APOLLOHOSP', name:'Apollo Hospitals',         ltp:7124.50,  chg:82.30,   pct:1.17,  vol:'1.9L',   cap:'1.0T',  pe:89.4, h52:7321.50, l52:4215.60, sector:'PHARMA' },
  { sym:'LUPIN',      name:'Lupin Ltd',                ltp:2134.70,  chg:-14.60,  pct:-0.68, vol:'6.4L',   cap:'96.8K', pe:34.8, h52:2370.05, l52:1179.80, sector:'PHARMA' },
  // AUTO
  { sym:'MARUTI',     name:'Maruti Suzuki India',      ltp:12834.50, chg:124.80,  pct:0.98,  vol:'2.8L',   cap:'3.9T',  pe:30.2, h52:13680.00,l52:9270.95, sector:'AUTO' },
  { sym:'TATAMOTORS', name:'Tata Motors Ltd',          ltp:976.40,   chg:18.65,   pct:1.95,  vol:'38.4L',  cap:'3.6T',  pe:12.4, h52:1179.00, l52:624.90,  sector:'AUTO' },
  { sym:'BAJAJ-AUTO', name:'Bajaj Auto Ltd',           ltp:8976.20,  chg:-42.30,  pct:-0.47, vol:'3.6L',   cap:'2.6T',  pe:32.6, h52:9860.05, l52:6036.00, sector:'AUTO' },
  { sym:'M&M',        name:'Mahindra & Mahindra',      ltp:2834.50,  chg:56.80,   pct:2.04,  vol:'12.4L',  cap:'3.5T',  pe:30.8, h52:3264.20, l52:1475.05, sector:'AUTO' },
  { sym:'HEROMOTOCO', name:'Hero MotoCorp',            ltp:4834.60,  chg:34.20,   pct:0.71,  vol:'4.2L',   cap:'96.6K', pe:21.8, h52:5740.50, l52:3065.10, sector:'AUTO' },
  { sym:'EICHERMOT',  name:'Eicher Motors Ltd',        ltp:4632.80,  chg:-28.40,  pct:-0.61, vol:'3.8L',   cap:'1.3T',  pe:35.4, h52:5200.00, l52:3258.10, sector:'AUTO' },
  // FMCG
  { sym:'HINDUNILVR', name:'Hindustan Unilever',       ltp:2634.50,  chg:-12.40,  pct:-0.47, vol:'8.6L',   cap:'6.2T',  pe:62.4, h52:2972.20, l52:2172.65, sector:'FMCG' },
  { sym:'ITC',        name:'ITC Ltd',                  ltp:478.25,   chg:4.60,    pct:0.97,  vol:'142.8L', cap:'5.9T',  pe:27.6, h52:528.50,  l52:396.15,  sector:'FMCG' },
  { sym:'NESTLEIND',  name:'Nestle India Ltd',         ltp:2434.80,  chg:18.20,   pct:0.75,  vol:'2.4L',   cap:'2.3T',  pe:78.2, h52:2778.00, l52:2079.05, sector:'FMCG' },
  { sym:'BRITANNIA',  name:'Britannia Industries',     ltp:5134.20,  chg:34.60,   pct:0.68,  vol:'1.8L',   cap:'1.2T',  pe:56.8, h52:5832.50, l52:4225.00, sector:'FMCG' },
  { sym:'DABUR',      name:'Dabur India Ltd',          ltp:534.70,   chg:-2.80,   pct:-0.52, vol:'14.6L',  cap:'94.8K', pe:52.4, h52:648.95,  l52:488.50,  sector:'FMCG' },
  { sym:'MARICO',     name:'Marico Ltd',               ltp:674.30,   chg:6.40,    pct:0.96,  vol:'12.4L',  cap:'87.2K', pe:48.6, h52:724.10,  l52:518.55,  sector:'FMCG' },
  // ENERGY
  { sym:'RELIANCE',   name:'Reliance Industries',      ltp:2934.50,  chg:42.80,   pct:1.48,  vol:'78.4L',  cap:'19.8T', pe:28.4, h52:3218.50, l52:2180.00, sector:'ENERGY' },
  { sym:'ONGC',       name:'Oil & Natural Gas Corp',   ltp:276.40,   chg:3.20,    pct:1.17,  vol:'98.6L',  cap:'3.5T',  pe:7.8,  h52:345.00,  l52:186.30,  sector:'ENERGY' },
  { sym:'COALINDIA',  name:'Coal India Ltd',           ltp:478.25,   chg:-2.40,   pct:-0.50, vol:'56.4L',  cap:'2.9T',  pe:8.2,  h52:539.80,  l52:299.30,  sector:'ENERGY' },
  { sym:'NTPC',       name:'NTPC Ltd',                 ltp:374.80,   chg:4.60,    pct:1.24,  vol:'64.2L',  cap:'3.6T',  pe:18.6, h52:448.45,  l52:221.65,  sector:'ENERGY' },
  { sym:'POWERGRID',  name:'Power Grid Corp',          ltp:298.45,   chg:2.80,    pct:0.95,  vol:'42.8L',  cap:'2.8T',  pe:16.4, h52:366.20,  l52:206.50,  sector:'ENERGY' },
  { sym:'ADANIGREEN', name:'Adani Green Energy',       ltp:1834.60,  chg:28.40,   pct:1.57,  vol:'8.4L',   cap:'2.9T',  pe:145.2,h52:2174.90, l52:824.25,  sector:'ENERGY' },
  // METALS
  { sym:'TATASTEEL',  name:'Tata Steel Ltd',           ltp:168.35,   chg:2.80,    pct:1.69,  vol:'248.6L', cap:'2.1T',  pe:24.8, h52:184.60,  l52:103.65,  sector:'METALS' },
  { sym:'JSWSTEEL',   name:'JSW Steel Ltd',            ltp:934.50,   chg:14.60,   pct:1.59,  vol:'28.4L',  cap:'2.3T',  pe:28.4, h52:1063.00, l52:674.50,  sector:'METALS' },
  { sym:'HINDALCO',   name:'Hindalco Industries',      ltp:678.25,   chg:8.90,    pct:1.33,  vol:'42.6L',  cap:'1.5T',  pe:18.6, h52:772.65,  l52:480.35,  sector:'METALS' },
  { sym:'VEDL',       name:'Vedanta Ltd',              ltp:478.60,   chg:6.40,    pct:1.36,  vol:'52.4L',  cap:'1.8T',  pe:14.2, h52:526.80,  l52:218.55,  sector:'METALS' },
  { sym:'SAIL',       name:'Steel Authority of India', ltp:132.45,   chg:-1.20,   pct:-0.90, vol:'86.4L',  cap:'54.8K', pe:12.4, h52:175.35,  l52:86.75,   sector:'METALS' },
  // TELECOM
  { sym:'BHARTIARTL', name:'Bharti Airtel Ltd',        ltp:1634.50,  chg:24.80,   pct:1.54,  vol:'18.6L',  cap:'9.8T',  pe:72.4, h52:1779.00, l52:948.35,  sector:'TELECOM' },
  { sym:'IDEA',       name:'Vodafone Idea Ltd',        ltp:14.25,    chg:-0.35,   pct:-2.40, vol:'348.6L', cap:'38.4K', pe:null, h52:19.20,   l52:7.05,    sector:'TELECOM' },
  // REALTY
  { sym:'DLF',        name:'DLF Ltd',                  ltp:834.60,   chg:18.40,   pct:2.25,  vol:'14.8L',  cap:'2.1T',  pe:52.4, h52:967.00,  l52:498.85,  sector:'REALTY' },
  { sym:'GODREJPROP', name:'Godrej Properties',        ltp:2634.50,  chg:42.80,   pct:1.65,  vol:'4.6L',   cap:'73.4K', pe:42.8, h52:3001.00, l52:1490.05, sector:'REALTY' },
  { sym:'OBEROIRLTY', name:'Oberoi Realty Ltd',        ltp:1834.60,  chg:24.60,   pct:1.36,  vol:'2.8L',   cap:'66.8K', pe:38.6, h52:2072.00, l52:1037.85, sector:'REALTY' },
  // INFRA
  { sym:'LT',         name:'Larsen & Toubro',          ltp:3634.50,  chg:48.60,   pct:1.36,  vol:'8.4L',   cap:'5.1T',  pe:34.6, h52:3896.00, l52:2659.45, sector:'INFRA' },
  { sym:'ULTRACEMCO', name:'UltraTech Cement',         ltp:10834.50, chg:124.80,  pct:1.16,  vol:'1.8L',   cap:'3.1T',  pe:42.4, h52:11878.00,l52:7820.00, sector:'INFRA' },
  { sym:'ACC',        name:'ACC Ltd',                  ltp:2234.50,  chg:28.60,   pct:1.30,  vol:'2.4L',   cap:'42.0K', pe:38.2, h52:2675.00, l52:1768.45, sector:'INFRA' },
];

// Build a quick lookup map
window.STOCK_MAP = {};
window.ALL_STOCKS.forEach(s => { window.STOCK_MAP[s.sym] = s; });
