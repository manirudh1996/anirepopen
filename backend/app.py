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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

API_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://finance.yahoo.com/',
}

_session = requests.Session()
_crumb = None
_crumb_lock = threading.Lock()
_cache = {'data': {}, 'ts': 0, 'last_error': '', 'crumb': ''}
_lock = threading.Lock()
CACHE_TTL = 60


def refresh_crumb():
    global _crumb
    try:
        app.logger.info("Fetching Yahoo Finance page for cookies...")
        r1 = _session.get('https://finance.yahoo.com', headers=HEADERS, timeout=20)
        app.logger.info(f"YF homepage: status={r1.status_code}, cookies={list(_session.cookies.keys())}")
        time.sleep(2)

        app.logger.info("Fetching crumb...")
        r2 = _session.get(
            'https://query1.finance.yahoo.com/v1/test/getcrumb',
            headers=API_HEADERS,
            timeout=20,
        )
        app.logger.info(f"Crumb response: status={r2.status_code}, body={r2.text[:100]!r}")

        if r2.status_code == 200 and r2.text.strip():
            with _crumb_lock:
                _crumb = r2.text.strip()
            app.logger.info(f"Crumb acquired: {_crumb!r}")
            with _lock:
                _cache['crumb'] = _crumb
            return True
        else:
            app.logger.warning(f"Crumb fetch failed: status={r2.status_code} body={r2.text[:200]!r}")
    except Exception as e:
        app.logger.error(f"refresh_crumb error: {e}")
    return False


def fetch_quotes():
    global _crumb
    with _crumb_lock:
        crumb = _crumb

    yf_syms = list(SYMBOLS.keys())
    result = {}
    batch_size = 20
    last_error = ''

    for i in range(0, len(yf_syms), batch_size):
        batch = yf_syms[i:i + batch_size]
        symbols_str = ','.join(batch)
        success = False

        for base in ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']:
            try:
                params = {
                    'symbols': symbols_str,
                    'fields': 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose',
                }
                if crumb:
                    params['crumb'] = crumb

                resp = _session.get(
                    f'{base}/v7/finance/quote',
                    params=params,
                    headers=API_HEADERS,
                    timeout=20,
                )
                app.logger.info(f"Batch {i//batch_size+1} {base}: status={resp.status_code}")

                if resp.status_code == 401:
                    app.logger.warning("401 — crumb expired, refreshing")
                    if refresh_crumb():
                        with _crumb_lock:
                            crumb = _crumb
                        params['crumb'] = crumb
                        resp = _session.get(
                            f'{base}/v7/finance/quote',
                            params=params,
                            headers=API_HEADERS,
                            timeout=20,
                        )

                if resp.status_code != 200:
                    last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                    app.logger.warning(f"Batch {i//batch_size+1} {base}: {last_error}")
                    continue

                body = resp.json()
                quotes = body.get('quoteResponse', {}).get('result', [])
                app.logger.info(f"Batch {i//batch_size+1}: got {len(quotes)} quotes")

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
                success = True
                break
            except Exception as e:
                last_error = str(e)
                app.logger.warning(f"Batch {i//batch_size+1} {base} exception: {e}")

        if not success:
            app.logger.error(f"Batch {i//batch_size+1} failed all attempts. Last error: {last_error}")

    app.logger.info(f"Total: {len(result)}/{len(SYMBOLS)} quotes fetched")
    if last_error and not result:
        with _lock:
            _cache['last_error'] = last_error
    return result


def background_refresh():
    time.sleep(3)
    # Acquire crumb on startup
    app.logger.info("Background thread: acquiring initial crumb...")
    for attempt in range(3):
        if refresh_crumb():
            break
        app.logger.warning(f"Crumb attempt {attempt+1}/3 failed, retrying in 10s")
        time.sleep(10)

    while True:
        try:
            data = fetch_quotes()
            if data:
                with _lock:
                    _cache['data'] = data
                    _cache['ts']   = time.time()
                    _cache['last_error'] = ''
            else:
                app.logger.warning("fetch_quotes returned empty — will retry next cycle")
                # Try refreshing crumb in case it expired
                refresh_crumb()
        except Exception as e:
            app.logger.error(f"Background refresh error: {e}")
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
        return jsonify({
            'status':     'ok',
            'symbols':    len(_cache['data']),
            'age_sec':    round(time.time() - _cache['ts'], 1) if _cache['ts'] else None,
            'last_error': _cache['last_error'],
            'crumb':      bool(_cache['crumb']),
            'sample':     dict(list(_cache['data'].items())[:3]),
        })


@app.route('/debug')
def debug():
    """One-shot fetch of a single symbol for live diagnosis."""
    global _crumb
    info = {'crumb_present': bool(_crumb), 'cookies': list(_session.cookies.keys())}
    try:
        params = {'symbols': 'TCS.NS', 'fields': 'regularMarketPrice,regularMarketPreviousClose'}
        if _crumb:
            params['crumb'] = _crumb
        resp = _session.get(
            'https://query1.finance.yahoo.com/v7/finance/quote',
            params=params,
            headers=API_HEADERS,
            timeout=15,
        )
        info['status_code'] = resp.status_code
        info['response_preview'] = resp.text[:500]
    except Exception as e:
        info['error'] = str(e)
    return jsonify(info)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
