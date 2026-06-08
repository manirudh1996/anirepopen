from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time
import threading
import logging
import re

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

PAGE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

API_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
}

_session = requests.Session()

# Crumb state — only refresh at most once per 10 minutes
_crumb = None
_crumb_lock = threading.Lock()
_crumb_last_attempt = 0
_CRUMB_RETRY_INTERVAL = 600  # 10 minutes

_cache = {'data': {}, 'ts': 0, 'last_error': '', 'crumb_src': ''}
_lock = threading.Lock()
CACHE_TTL = 90


def _extract_crumb_from_html(html: str):
    """Pull the crumb string out of Yahoo Finance page HTML."""
    for pattern in [
        r'"crumb"\s*:\s*"([A-Za-z0-9/_.-]{5,20})"',
        r'"CrumbStore"\s*:\s*\{"crumb"\s*:\s*"([^"]+)"',
    ]:
        m = re.search(pattern, html)
        if m:
            return m.group(1).replace('\\u002F', '/')
    return None


def refresh_crumb():
    global _crumb, _crumb_last_attempt

    with _crumb_lock:
        now = time.time()
        if now - _crumb_last_attempt < _CRUMB_RETRY_INTERVAL:
            app.logger.info(f"Crumb: skipping refresh (last attempt {now - _crumb_last_attempt:.0f}s ago)")
            return bool(_crumb)
        _crumb_last_attempt = now

    crumb_src = ''
    new_crumb = None

    try:
        # Step 1: consent/fc page sets initial cookies
        try:
            _session.get('https://fc.yahoo.com', headers=PAGE_HEADERS, timeout=10)
            time.sleep(2)
        except Exception:
            pass

        # Step 2: main Yahoo Finance page — also try to parse crumb from HTML
        app.logger.info("Fetching YF homepage for cookies + HTML crumb...")
        resp = _session.get('https://finance.yahoo.com', headers=PAGE_HEADERS, timeout=20)
        app.logger.info(f"YF homepage: {resp.status_code}, cookies={list(_session.cookies.keys())}")

        if resp.status_code == 200:
            new_crumb = _extract_crumb_from_html(resp.text)
            if new_crumb:
                crumb_src = 'html'
                app.logger.info(f"Crumb from HTML: {new_crumb!r}")

        # Step 3: if HTML parse failed, try the crumb API endpoint (query2 first, then query1)
        if not new_crumb:
            time.sleep(4)
            for base in ['https://query2.finance.yahoo.com', 'https://query1.finance.yahoo.com']:
                try:
                    r = _session.get(f'{base}/v1/test/getcrumb', headers=API_HEADERS, timeout=15)
                    app.logger.info(f"Crumb API {base}: {r.status_code} {r.text[:60]!r}")
                    if r.status_code == 200 and r.text.strip():
                        new_crumb = r.text.strip()
                        crumb_src = base
                        break
                    elif r.status_code == 429:
                        app.logger.warning("Crumb API 429 — rate limited, will rely on HTML method only")
                        break
                except Exception as e:
                    app.logger.warning(f"Crumb API {base}: {e}")

    except Exception as e:
        app.logger.error(f"refresh_crumb error: {e}")

    if new_crumb:
        with _crumb_lock:
            _crumb = new_crumb
        with _lock:
            _cache['crumb_src'] = crumb_src
        app.logger.info(f"Crumb set ({crumb_src}): {new_crumb!r}")
        return True

    app.logger.warning("refresh_crumb: no crumb obtained")
    return False


def fetch_quotes():
    global _crumb

    with _crumb_lock:
        crumb = _crumb

    yf_syms = list(SYMBOLS.keys())
    result = {}
    last_error = ''
    need_crumb_refresh = False

    for i in range(0, len(yf_syms), 20):
        batch = yf_syms[i:i + 20]
        success = False

        for base in ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']:
            try:
                params = {
                    'symbols': ','.join(batch),
                    'fields': 'regularMarketPrice,regularMarketChange,'
                              'regularMarketChangePercent,regularMarketPreviousClose',
                }
                if crumb:
                    params['crumb'] = crumb

                resp = _session.get(
                    f'{base}/v7/finance/quote',
                    params=params,
                    headers=API_HEADERS,
                    timeout=20,
                )
                app.logger.info(f"Batch {i//20+1} {base}: {resp.status_code}")

                if resp.status_code == 401:
                    app.logger.warning("401 — crumb invalid, scheduling refresh")
                    need_crumb_refresh = True
                    last_error = f"401 Unauthorized (crumb={crumb!r})"
                    continue

                if resp.status_code != 200:
                    last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                    app.logger.warning(f"Batch {i//20+1} {base}: {last_error}")
                    continue

                quotes = resp.json().get('quoteResponse', {}).get('result', [])
                app.logger.info(f"Batch {i//20+1}: {len(quotes)} quotes")

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
                app.logger.warning(f"Batch {i//20+1} {base} exception: {e}")

        if not success:
            app.logger.error(f"Batch {i//20+1} failed all bases. Last error: {last_error}")

    app.logger.info(f"Total: {len(result)}/{len(SYMBOLS)} quotes")

    if need_crumb_refresh:
        with _crumb_lock:
            _crumb = None  # force next refresh_crumb call to proceed
            _crumb_last_attempt = 0

    if last_error:
        with _lock:
            _cache['last_error'] = last_error

    return result


def background_refresh():
    time.sleep(5)

    app.logger.info("Background: initial crumb fetch...")
    refresh_crumb()

    while True:
        try:
            # If no crumb, try to get one (throttled inside refresh_crumb)
            if not _crumb:
                refresh_crumb()

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
            'crumb':      bool(_crumb),
            'crumb_src':  _cache['crumb_src'],
            'last_error': _cache['last_error'],
            'sample':     dict(list(_cache['data'].items())[:3]),
        })


@app.route('/debug')
def debug():
    """Live single-symbol test to diagnose Yahoo Finance connectivity."""
    info = {
        'crumb_present': bool(_crumb),
        'crumb_value':   _crumb,
        'cookies':       list(_session.cookies.keys()),
    }
    try:
        params = {
            'symbols': 'TCS.NS',
            'fields':  'regularMarketPrice,regularMarketPreviousClose',
        }
        if _crumb:
            params['crumb'] = _crumb
        resp = _session.get(
            'https://query1.finance.yahoo.com/v7/finance/quote',
            params=params,
            headers=API_HEADERS,
            timeout=15,
        )
        info['status_code'] = resp.status_code
        info['response'] = resp.text[:600]
    except Exception as e:
        info['error'] = str(e)
    return jsonify(info)


if __name__ == '__main__':
    app.run(debug=True, port=5000)
