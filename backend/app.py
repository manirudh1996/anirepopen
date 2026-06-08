from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import threading
import logging
import csv
import io
import urllib.parse
import concurrent.futures

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Yahoo Finance symbol -> our display name
# Stooq uses the same .NS symbols in lowercase
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

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://stooq.com/',
}

_cache = {'data': {}, 'ts': 0, 'last_error': ''}
_lock = threading.Lock()
CACHE_TTL = 120


def fetch_one(ns_sym: str):
    """Fetch current quote for one NSE symbol from Stooq."""
    our_sym = SYMBOLS.get(ns_sym)
    if not our_sym:
        return our_sym, None

    # Stooq uses lowercase symbols; & must be URL-encoded
    stooq_sym = urllib.parse.quote(ns_sym.lower(), safe='-.')

    # f fields: s=symbol d2=date t2=time o=open h=high l=low c=close v=volume
    # &h adds a header row; e=csv forces CSV output
    url = f'https://stooq.com/q/l/?s={stooq_sym}&f=sd2t2ohlcv&h&e=csv'
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            app.logger.warning(f"Stooq {ns_sym}: HTTP {resp.status_code}")
            return our_sym, None

        reader = csv.DictReader(io.StringIO(resp.text))
        rows = list(reader)
        if not rows:
            app.logger.warning(f"Stooq {ns_sym}: empty response")
            return our_sym, None

        row = rows[0]
        close = float(row.get('Close') or 0)
        open_p = float(row.get('Open') or 0)

        if close <= 0:
            app.logger.warning(f"Stooq {ns_sym}: close={close}")
            return our_sym, None

        # Use open as previous-close proxy (intraday change approximation)
        prev = open_p if open_p > 0 else close
        chg  = round(close - prev, 2)
        pct  = round(chg / prev * 100, 2) if prev else 0.0

        return our_sym, {
            'ltp':       round(close, 2),
            'chg':       chg,
            'pct':       pct,
            'basePrice': round(prev, 2),
        }
    except Exception as e:
        app.logger.warning(f"Stooq {ns_sym}: {e}")
        return our_sym, None


def fetch_quotes():
    result = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(fetch_one, sym): sym for sym in SYMBOLS}
        for fut in concurrent.futures.as_completed(futures, timeout=45):
            try:
                our_sym, data = fut.result()
                if our_sym and data:
                    result[our_sym] = data
            except Exception as e:
                app.logger.warning(f"Future error: {e}")

    app.logger.info(f"Stooq: {len(result)}/{len(SYMBOLS)} quotes")
    return result


def background_refresh():
    time.sleep(3)
    while True:
        try:
            data = fetch_quotes()
            if data:
                with _lock:
                    _cache['data'] = data
                    _cache['ts']   = time.time()
                    _cache['last_error'] = ''
            else:
                app.logger.warning("fetch_quotes returned empty")
        except Exception as e:
            app.logger.error(f"Background error: {e}")
            with _lock:
                _cache['last_error'] = str(e)
        time.sleep(CACHE_TTL)


_refresh_thread = threading.Thread(target=background_refresh, daemon=True)
_refresh_thread.start()


@app.route('/quotes')
def quotes():
    with _lock:
        return jsonify(_cache['data'])


@app.route('/health')
def health():
    with _lock:
        age = round(time.time() - _cache['ts'], 1) if _cache['ts'] else None
        return jsonify({
            'status':     'ok',
            'symbols':    len(_cache['data']),
            'age_sec':    age,
            'last_error': _cache['last_error'],
            'sample':     dict(list(_cache['data'].items())[:3]),
        })


@app.route('/debug')
def debug():
    """Live single-symbol test."""
    our_sym, data = fetch_one('TCS.NS')
    return jsonify({'symbol': our_sym, 'data': data})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
