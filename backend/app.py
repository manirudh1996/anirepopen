from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import threading
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

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
    'BAJAJ-AUTO.NS':'BAJAJ-AUTO', 'M%26M.NS':'M&M',
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

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}

_cache = {'data': {}, 'ts': 0}
_lock  = threading.Lock()
CACHE_TTL = 60


def fetch_batch(yf_syms):
    """Fetch a batch of symbols from Yahoo Finance."""
    symbols_str = ','.join(yf_syms)
    url = (
        'https://query1.finance.yahoo.com/v7/finance/quote'
        f'?symbols={symbols_str}'
        '&fields=regularMarketPrice,regularMarketChange,'
        'regularMarketChangePercent,regularMarketPreviousClose'
    )
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.json().get('quoteResponse', {}).get('result', [])


def fetch_quotes():
    yf_syms = list(SYMBOLS.keys())
    result  = {}

    # Split into batches of 25 to keep URLs short
    batch_size = 25
    for i in range(0, len(yf_syms), batch_size):
        batch = yf_syms[i:i + batch_size]
        for attempt, base in enumerate(['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']):
            try:
                symbols_str = ','.join(batch)
                url = (
                    f'{base}/v7/finance/quote?symbols={symbols_str}'
                    '&fields=regularMarketPrice,regularMarketChange,'
                    'regularMarketChangePercent,regularMarketPreviousClose'
                )
                resp = requests.get(url, headers=HEADERS, timeout=15)
                resp.raise_for_status()
                quotes = resp.json().get('quoteResponse', {}).get('result', [])

                for q in quotes:
                    our_sym = SYMBOLS.get(q.get('symbol', ''))
                    if not our_sym:
                        continue
                    ltp  = q.get('regularMarketPrice')
                    prev = q.get('regularMarketPreviousClose', ltp)
                    chg  = q.get('regularMarketChange', 0)
                    pct  = q.get('regularMarketChangePercent', 0)
                    if ltp and ltp > 0:
                        result[our_sym] = {
                            'ltp':       round(float(ltp),  2),
                            'chg':       round(float(chg),  2),
                            'pct':       round(float(pct),  2),
                            'basePrice': round(float(prev), 2),
                        }
                app.logger.info(f"Batch {i//batch_size+1}: got {len(quotes)} quotes from {base}")
                break  # success — don't try the other base URL
            except Exception as e:
                app.logger.warning(f"Batch {i//batch_size+1} attempt {attempt+1} failed: {e}")

    app.logger.info(f"Total: {len(result)}/{len(SYMBOLS)} quotes fetched")
    return result


def background_refresh():
    """Warm up cache on startup, then keep it fresh."""
    time.sleep(2)  # let gunicorn finish starting
    while True:
        try:
            data = fetch_quotes()
            if data:
                with _lock:
                    _cache['data'] = data
                    _cache['ts']   = time.time()
        except Exception as e:
            app.logger.error(f"Background refresh error: {e}")
        time.sleep(CACHE_TTL)


# Start background refresh thread on startup
_refresh_thread = threading.Thread(target=background_refresh, daemon=True)
_refresh_thread.start()


@app.route('/quotes')
def quotes():
    with _lock:
        return jsonify(_cache['data'])


@app.route('/health')
def health():
    with _lock:
        return jsonify({
            'status':  'ok',
            'symbols': len(_cache['data']),
            'age_sec': round(time.time() - _cache['ts'], 1),
            'sample':  dict(list(_cache['data'].items())[:3]),
        })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
