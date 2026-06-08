from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
import time
import threading
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# NSE symbol map: yfinance symbol → our app symbol
SYMBOLS = {
    'TCS.NS':'TCS', 'INFY.NS':'INFY', 'WIPRO.NS':'WIPRO',
    'HCLTECH.NS':'HCLTECH', 'TECHM.NS':'TECHM', 'LTIM.NS':'LTIM',
    'MPHASIS.NS':'MPHASIS', 'PERSISTENT.NS':'PERSISTENT',
    'HDFCBANK.NS':'HDFCBANK', 'ICICIBANK.NS':'ICICIBANK', 'SBIN.NS':'SBIN',
    'KOTAKBANK.NS':'KOTAKBANK', 'AXISBANK.NS':'AXISBANK',
    'INDUSINDBK.NS':'INDUSINDBK', 'BANKBARODA.NS':'BANKBARODA', 'PNB.NS':'PNB',
    'SUNPHARMA.NS':'SUNPHARMA', 'DRREDDY.NS':'DRREDDY', 'CIPLA.NS':'CIPLA',
    'DIVISLAB.NS':'DIVISLAB', 'APOLLOHOSP.NS':'APOLLOHOSP', 'LUPIN.NS':'LUPIN',
    'MARUTI.NS':'MARUTI', 'TATAMOTORS.NS':'TATAMOTORS',
    'BAJAJ-AUTO.NS':'BAJAJ-AUTO', 'M&M.NS':'M&M',
    'HEROMOTOCO.NS':'HEROMOTOCO', 'EICHERMOT.NS':'EICHERMOT',
    'HINDUNILVR.NS':'HINDUNILVR', 'ITC.NS':'ITC', 'NESTLEIND.NS':'NESTLEIND',
    'BRITANNIA.NS':'BRITANNIA', 'DABUR.NS':'DABUR', 'MARICO.NS':'MARICO',
    'RELIANCE.NS':'RELIANCE', 'ONGC.NS':'ONGC', 'COALINDIA.NS':'COALINDIA',
    'NTPC.NS':'NTPC', 'POWERGRID.NS':'POWERGRID', 'ADANIGREEN.NS':'ADANIGREEN',
    'TATASTEEL.NS':'TATASTEEL', 'JSWSTEEL.NS':'JSWSTEEL',
    'HINDALCO.NS':'HINDALCO', 'VEDL.NS':'VEDL', 'SAIL.NS':'SAIL',
    'BHARTIARTL.NS':'BHARTIARTL', 'IDEA.NS':'IDEA',
    'DLF.NS':'DLF', 'GODREJPROP.NS':'GODREJPROP', 'OBEROIRLTY.NS':'OBEROIRLTY',
    'LT.NS':'LT', 'ULTRACEMCO.NS':'ULTRACEMCO', 'ACC.NS':'ACC',
}

# Simple in-memory cache (30 second TTL)
_cache = {'data': {}, 'ts': 0}
_lock  = threading.Lock()
CACHE_TTL = 30


def fetch_quotes():
    yf_syms = list(SYMBOLS.keys())
    result  = {}
    try:
        tickers = yf.Tickers(' '.join(yf_syms))
        for yf_sym, our_sym in SYMBOLS.items():
            try:
                fi   = tickers.tickers[yf_sym].fast_info
                ltp  = float(fi.last_price  or 0)
                prev = float(fi.previous_close or ltp)
                if ltp <= 0:
                    continue
                chg = ltp - prev
                pct = (chg / prev * 100) if prev else 0
                result[our_sym] = {
                    'ltp':       round(ltp,  2),
                    'chg':       round(chg,  2),
                    'pct':       round(pct,  2),
                    'basePrice': round(prev, 2),
                }
            except Exception:
                pass
        app.logger.info(f"Fetched {len(result)}/{len(SYMBOLS)} quotes")
    except Exception as e:
        app.logger.error(f"yfinance batch error: {e}")
    return result


@app.route('/quotes')
def quotes():
    with _lock:
        age = time.time() - _cache['ts']
        if age > CACHE_TTL or not _cache['data']:
            data = fetch_quotes()
            if data:
                _cache['data'] = data
                _cache['ts']   = time.time()
        return jsonify(_cache['data'])


@app.route('/health')
def health():
    return jsonify({
        'status':  'ok',
        'symbols': len(_cache['data']),
        'age_sec': round(time.time() - _cache['ts'], 1),
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
