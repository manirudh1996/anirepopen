from flask import Flask, jsonify
from flask_cors import CORS
import yfinance as yf
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

_cache = {'data': {}, 'ts': 0}
_lock  = threading.Lock()
CACHE_TTL = 60


def fetch_quotes():
    yf_syms = list(SYMBOLS.keys())
    result  = {}
    try:
        app.logger.info(f"Downloading {len(yf_syms)} symbols via yf.download...")
        df = yf.download(
            tickers   = yf_syms,
            period    = '5d',
            interval  = '1d',
            progress  = False,
            auto_adjust = True,
            group_by  = 'ticker',
        )
        app.logger.info(f"Download complete, shape: {df.shape}")

        for yf_sym, our_sym in SYMBOLS.items():
            try:
                # Multi-ticker download nests columns under ticker symbol
                close = df[yf_sym]['Close'] if yf_sym in df.columns.get_level_values(0) else None
                if close is None or close.dropna().empty:
                    continue
                close = close.dropna()
                today = float(close.iloc[-1])
                prev  = float(close.iloc[-2]) if len(close) >= 2 else today
                if today <= 0:
                    continue
                chg = today - prev
                pct = (chg / prev * 100) if prev else 0
                result[our_sym] = {
                    'ltp':       round(today, 2),
                    'chg':       round(chg,   2),
                    'pct':       round(pct,   2),
                    'basePrice': round(prev,   2),
                }
            except Exception as e:
                app.logger.warning(f"Skip {yf_sym}: {e}")

        app.logger.info(f"Fetched {len(result)}/{len(SYMBOLS)} quotes successfully")
    except Exception as e:
        app.logger.error(f"yf.download error: {e}")

    # If batch download failed, try individual tickers as fallback
    if not result:
        app.logger.info("Batch failed — trying individual ticker fallback...")
        for yf_sym, our_sym in SYMBOLS.items():
            try:
                hist = yf.Ticker(yf_sym).history(period='5d')
                if hist.empty:
                    continue
                today = float(hist['Close'].iloc[-1])
                prev  = float(hist['Close'].iloc[-2]) if len(hist) >= 2 else today
                chg   = today - prev
                pct   = (chg / prev * 100) if prev else 0
                result[our_sym] = {
                    'ltp':       round(today, 2),
                    'chg':       round(chg,   2),
                    'pct':       round(pct,   2),
                    'basePrice': round(prev,   2),
                }
            except Exception:
                pass
        app.logger.info(f"Individual fallback got {len(result)} quotes")

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
        'status':   'ok',
        'symbols':  len(_cache['data']),
        'age_sec':  round(time.time() - _cache['ts'], 1),
        'sample':   dict(list(_cache['data'].items())[:3]) if _cache['data'] else {},
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
