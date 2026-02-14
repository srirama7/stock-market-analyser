"""Common NSE stock symbols and their names for search functionality."""

NIFTY_50_SYMBOLS = {
    "RELIANCE": "Reliance Industries Ltd",
    "TCS": "Tata Consultancy Services Ltd",
    "HDFCBANK": "HDFC Bank Ltd",
    "INFY": "Infosys Ltd",
    "ICICIBANK": "ICICI Bank Ltd",
    "HINDUNILVR": "Hindustan Unilever Ltd",
    "ITC": "ITC Ltd",
    "SBIN": "State Bank of India",
    "BHARTIARTL": "Bharti Airtel Ltd",
    "KOTAKBANK": "Kotak Mahindra Bank Ltd",
    "LT": "Larsen & Toubro Ltd",
    "AXISBANK": "Axis Bank Ltd",
    "ASIANPAINT": "Asian Paints Ltd",
    "MARUTI": "Maruti Suzuki India Ltd",
    "HCLTECH": "HCL Technologies Ltd",
    "SUNPHARMA": "Sun Pharmaceutical Ind Ltd",
    "BAJFINANCE": "Bajaj Finance Ltd",
    "TITAN": "Titan Company Ltd",
    "WIPRO": "Wipro Ltd",
    "ULTRACEMCO": "UltraTech Cement Ltd",
    "NESTLEIND": "Nestle India Ltd",
    "ONGC": "Oil & Natural Gas Corp Ltd",
    "NTPC": "NTPC Ltd",
    "POWERGRID": "Power Grid Corp Of India Ltd",
    "M&M": "Mahindra & Mahindra Ltd",
    "TATAMOTORS": "Tata Motors Ltd",
    "TATASTEEL": "Tata Steel Ltd",
    "JSWSTEEL": "JSW Steel Ltd",
    "ADANIENT": "Adani Enterprises Ltd",
    "ADANIPORTS": "Adani Ports & SEZ Ltd",
    "BAJAJFINSV": "Bajaj Finserv Ltd",
    "BAJAJ-AUTO": "Bajaj Auto Ltd",
    "COALINDIA": "Coal India Ltd",
    "DIVISLAB": "Divi's Laboratories Ltd",
    "DRREDDY": "Dr. Reddy's Laboratories Ltd",
    "EICHERMOT": "Eicher Motors Ltd",
    "GRASIM": "Grasim Industries Ltd",
    "HDFCLIFE": "HDFC Life Insurance Co Ltd",
    "HEROMOTOCO": "Hero MotoCorp Ltd",
    "HINDALCO": "Hindalco Industries Ltd",
    "INDUSINDBK": "IndusInd Bank Ltd",
    "CIPLA": "Cipla Ltd",
    "SBILIFE": "SBI Life Insurance Co Ltd",
    "TECHM": "Tech Mahindra Ltd",
    "APOLLOHOSP": "Apollo Hospitals Enterprise Ltd",
    "BRITANNIA": "Britannia Industries Ltd",
    "TATACONSUM": "Tata Consumer Products Ltd",
    "LTIM": "LTIMindtree Ltd",
    "BPCL": "Bharat Petroleum Corp Ltd",
    "SHRIRAMFIN": "Shriram Finance Ltd",
}

# Sector mapping for sector heatmap
SECTOR_MAP = {
    "IT": ["TCS", "INFY", "HCLTECH", "WIPRO", "TECHM", "LTIM"],
    "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK"],
    "Auto": ["MARUTI", "TATAMOTORS", "M&M", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO"],
    "Pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "FMCG": ["HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM"],
    "Metal": ["TATASTEEL", "JSWSTEEL", "HINDALCO", "COALINDIA"],
    "Oil & Gas": ["RELIANCE", "ONGC", "BPCL"],
    "Infrastructure": ["LT", "ULTRACEMCO", "GRASIM", "ADANIENT", "ADANIPORTS"],
    "Power": ["NTPC", "POWERGRID"],
    "Financial Services": ["BAJFINANCE", "BAJAJFINSV", "HDFCLIFE", "SBILIFE", "SHRIRAMFIN"],
    "Consumer": ["TITAN", "ASIANPAINT"],
    "Telecom": ["BHARTIARTL"],
}

# Reverse mapping: symbol -> sector
SYMBOL_SECTOR = {}
for sector, symbols in SECTOR_MAP.items():
    for sym in symbols:
        SYMBOL_SECTOR[sym] = sector

# Index symbols for yfinance
INDEX_SYMBOLS = {
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "BANK NIFTY": "^NSEBANK",
    "NIFTY IT": "^CNXIT",
    "NIFTY PHARMA": "^CNXPHARMA",
}


def search_symbols(query: str, limit: int = 10):
    """Search for symbols matching query."""
    query = query.upper().strip()
    results = []
    for symbol, name in NIFTY_50_SYMBOLS.items():
        if query in symbol or query.lower() in name.lower():
            results.append({"symbol": symbol, "name": name, "exchange": "NSE"})
        if len(results) >= limit:
            break
    return results


def get_yfinance_symbol(symbol: str) -> str:
    """Convert NSE symbol to yfinance format."""
    if symbol.startswith("^"):
        return symbol
    return f"{symbol}.NS"
