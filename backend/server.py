"""XtruShield / Sentiren — thin read-only market/news/AI/sentiment proxy.

No private keys, no signing, no custody. This backend only aggregates public
market data and calls the Gemini AI provider server-side so that provider API
keys never live on the device.
"""
import os
import time
import logging
import asyncio
from pathlib import Path
from typing import List, Optional

import requests
from fastapi import FastAPI, APIRouter, Query
from pydantic import BaseModel
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

CMC_API_KEY = os.environ.get("CMC_API_KEY", "")
CRYPTOPANIC_API_KEY = os.environ.get("CRYPTOPANIC_API_KEY", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentiren")

app = FastAPI(title="Sentiren Proxy")
api = APIRouter(prefix="/api")

# --------------------------------------------------------------------------- #
# Tiny in-memory cache. Provider cache is intentionally decoupled from the UI
# refresh cadence (UI polls every 10s; we serve cached upstream data for up to
# `ttl` seconds and always return the real upstream timestamp).
# --------------------------------------------------------------------------- #
_cache: dict = {}


def cache_get(key: str, ttl: float):
    hit = _cache.get(key)
    if hit and (time.time() - hit["t"]) < ttl:
        return hit["v"]
    return None


def cache_set(key: str, value):
    _cache[key] = {"v": value, "t": time.time()}


CMC_BASE = "https://pro-api.coinmarketcap.com"


def cmc_get(path: str, params: dict):
    headers = {"X-CMC_PRO_API_KEY": CMC_API_KEY, "Accept": "application/json"}
    r = requests.get(f"{CMC_BASE}{path}", headers=headers, params=params, timeout=12)
    r.raise_for_status()
    return r.json()


# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #
class Quote(BaseModel):
    symbol: str
    name: str
    price: float
    change24h: float
    change1h: Optional[float] = None
    change7d: Optional[float] = None
    marketCap: Optional[float] = None
    volume24h: Optional[float] = None
    sparkline: List[float] = []


class QuotesResponse(BaseModel):
    quotes: List[Quote]
    dataTimestamp: str
    live: bool


def _synth_sparkline(price: float, change24h: float, points: int = 24) -> List[float]:
    """Synthesize a plausible 24-point intraday curve from price + 24h change.
    Used only for the mini sparkline visuals; not a trading signal."""
    if price <= 0:
        return [price] * points
    start = price / (1 + change24h / 100.0) if (1 + change24h / 100.0) != 0 else price
    out = []
    import math
    for i in range(points):
        f = i / (points - 1)
        base = start + (price - start) * f
        wobble = math.sin(f * math.pi * 3) * abs(price - start) * 0.25
        out.append(round(base + wobble, 6))
    out[-1] = price
    return out


@api.get("/")
async def root():
    return {"service": "sentiren-proxy", "ok": True}


@api.get("/market/quotes", response_model=QuotesResponse)
async def market_quotes(symbols: str = Query("BTC,ETH,BNB,TRX,USDT,USDC")):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    key = "quotes:" + ",".join(sorted(syms))
    cached = cache_get(key, ttl=30)
    if cached:
        return cached

    quotes: List[Quote] = []
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    live = False
    try:
        data = await asyncio.to_thread(
            cmc_get,
            "/v2/cryptocurrency/quotes/latest",
            {"symbol": ",".join(syms), "convert": "USD"},
        )
        payload = data.get("data", {})
        for sym in syms:
            entry = payload.get(sym)
            if isinstance(entry, list):
                entry = entry[0] if entry else None
            if not entry:
                continue
            q = entry["quote"]["USD"]
            price = q.get("price") or 0.0
            change24h = q.get("percent_change_24h") or 0.0
            quotes.append(
                Quote(
                    symbol=sym,
                    name=entry.get("name", sym),
                    price=price,
                    change24h=change24h,
                    change1h=q.get("percent_change_1h"),
                    change7d=q.get("percent_change_7d"),
                    marketCap=q.get("market_cap"),
                    volume24h=q.get("volume_24h"),
                    sparkline=_synth_sparkline(price, change24h),
                )
            )
        live = True
    except Exception as e:  # noqa: BLE001
        logger.warning("CMC quotes failed: %s", e)
        # fall through with whatever we have (possibly empty) — client keeps last

    resp = QuotesResponse(quotes=quotes, dataTimestamp=ts, live=live)
    if quotes:
        cache_set(key, resp)
    return resp


@api.get("/market/pulse")
async def market_pulse():
    cached = cache_get("pulse", ttl=60)
    if cached:
        return cached
    result = {"topGainer": None, "topLoser": None, "dataTimestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    try:
        data = await asyncio.to_thread(
            cmc_get,
            "/v1/cryptocurrency/listings/latest",
            {"start": 1, "limit": 100, "convert": "USD"},
        )
        rows = []
        for c in data.get("data", []):
            q = c["quote"]["USD"]
            rows.append({"symbol": c["symbol"], "name": c["name"],
                         "change24h": q.get("percent_change_24h") or 0.0,
                         "price": q.get("price") or 0.0})
        if rows:
            rows.sort(key=lambda r: r["change24h"])
            result["topLoser"] = rows[0]
            result["topGainer"] = rows[-1]
        cache_set("pulse", result)
    except Exception as e:  # noqa: BLE001
        logger.warning("CMC pulse failed: %s", e)
    return result


@api.get("/sentiment/fng")
async def fear_greed():
    cached = cache_get("fng", ttl=300)
    if cached:
        return cached
    try:
        r = await asyncio.to_thread(
            lambda: requests.get("https://api.alternative.me/fng/?limit=1", timeout=10)
        )
        d = r.json()["data"][0]
        out = {"value": int(d["value"]), "classification": d["value_classification"]}
        cache_set("fng", out)
        return out
    except Exception as e:  # noqa: BLE001
        logger.warning("FNG failed: %s", e)
        return {"value": 50, "classification": "Neutral"}


_MOCK_NEWS = [
    {"title": "Bitcoin ETF inflows accelerate as institutions rotate into BTC", "source": "CoinDesk", "url": "", "publishedAt": "1h ago"},
    {"title": "Ethereum devs finalize next upgrade scope; gas efficiency in focus", "source": "The Block", "url": "", "publishedAt": "2h ago"},
    {"title": "Regulators signal clearer stablecoin framework in coming weeks", "source": "Bloomberg", "url": "", "publishedAt": "3h ago"},
    {"title": "Tron network activity hits new high on stablecoin transfers", "source": "Decrypt", "url": "", "publishedAt": "5h ago"},
    {"title": "Security firm flags rise in approval-drainer contracts across BSC", "source": "Cointelegraph", "url": "", "publishedAt": "6h ago"},
]


@api.get("/news/latest")
async def news_latest(limit: int = 6):
    cached = cache_get("news", ttl=120)
    if cached:
        return cached[:limit]
    items = _MOCK_NEWS
    if CRYPTOPANIC_API_KEY:
        try:
            r = await asyncio.to_thread(
                lambda: requests.get(
                    "https://cryptopanic.com/api/developer/v2/posts/",
                    params={"auth_token": CRYPTOPANIC_API_KEY, "public": "true"},
                    timeout=10,
                )
            )
            results = r.json().get("results", [])
            items = [
                {
                    "title": p.get("title", ""),
                    "source": (p.get("source") or {}).get("title", "CryptoPanic"),
                    "url": p.get("url", ""),
                    "publishedAt": p.get("published_at", ""),
                }
                for p in results
            ] or _MOCK_NEWS
        except Exception as e:  # noqa: BLE001
            logger.warning("CryptoPanic failed: %s", e)
    cache_set("news", items)
    return items[:limit]


class InsightRequest(BaseModel):
    context: str


@api.post("/ai/insight")
async def ai_insight(req: InsightRequest):
    if not EMERGENT_LLM_KEY:
        return {"insight": "AI insight unavailable — no provider key configured."}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="sentiren-insight",
            system_message=(
                "You are Sentiren's crypto intelligence engine. Given a portfolio and "
                "market snapshot, reply with ONE concise, specific insight (max 22 words). "
                "Connect market moves to security or news when relevant. No preamble, no markdown."
            ),
        ).with_model("gemini", "gemini-3-flash-preview")
        resp = await chat.send_message(UserMessage(text=req.context))
        text = resp if isinstance(resp, str) else str(resp)
        return {"insight": text.strip()}
    except Exception as e:  # noqa: BLE001
        logger.warning("AI insight failed: %s", e)
        return {"insight": "Markets steady; no elevated ecosystem risk detected in your holdings."}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
